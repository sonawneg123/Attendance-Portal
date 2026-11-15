// Supabase Edge Function: activate-account
// Handles initial account activation using single-use registration codes for Contractors and Employees

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';
import { sha256 } from '../_shared/crypto.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const {
      registration_code,
      username,
      password,
      password_confirmation,
      full_name,
      company_name,
      contact_person,
      phone,
    } = body;

    // 1. Validation
    if (!registration_code || typeof registration_code !== 'string') {
      return new Response(JSON.stringify({ error: 'नोंदणी कोड आवश्यक आहे (Registration code is required)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!username || typeof username !== 'string') {
      return new Response(JSON.stringify({ error: 'वापरकर्तानाव आवश्यक आहे (Username is required)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/;
    if (!usernameRegex.test(cleanUsername)) {
      return new Response(
        JSON.stringify({
          error: 'वापरकर्तानाव 3 ते 50 वर्णांचे आणि फक्त अक्षरे, अंक, अंडरस्कोअर किंवा डॅश असावे',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'पासवर्ड किमान 8 अक्षरांचा असावा (Password must be at least 8 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password !== password_confirmation) {
      return new Response(
        JSON.stringify({ error: 'पासवर्ड आणि पुष्टीकरण पासवर्ड जुळत नाहीत (Passwords do not match)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';

    // 2. Hash registration code and verify
    const codeHash = await sha256(registration_code.trim());

    const { data: codeRecord, error: codeError } = await supabaseAdmin
      .from('registration_codes')
      .select('*')
      .eq('code_hash', codeHash)
      .single();

    if (codeError || !codeRecord) {
      return new Response(
        JSON.stringify({ error: 'अवैध नोंदणी कोड (Invalid registration code)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (codeRecord.is_consumed) {
      return new Response(
        JSON.stringify({ error: 'हा नोंदणी कोड आधीच वापरला गेला आहे (Registration code has already been used)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const expiry = new Date(codeRecord.expires_at);
    if (expiry < now) {
      return new Response(
        JSON.stringify({ error: 'नोंदणी कोडची मुदत संपली आहे (Registration code has expired)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Verify username uniqueness (case-insensitive)
    const { data: existingUser } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .ilike('username', cleanUsername)
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'हे वापरकर्तानाव आधीच अस्तित्वात आहे (Username is already taken)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Create internal Auth Identity in Supabase Auth
    const internalUserId = crypto.randomUUID();
    const internalEmail = `usr_${internalUserId.replace(/-/g, '')}@internal.attendanceportal.local`;

    const { data: authUser, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email: internalEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        role: codeRecord.role,
      },
    });

    if (authCreateError || !authUser.user) {
      console.error('Auth create error:', authCreateError);
      return new Response(
        JSON.stringify({ error: 'वापरकर्ता खाते तयार करताना त्रुटी आली (Failed to create user account)' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authUser.user.id;

    // 5. Create user_profiles record
    const { data: userProfile, error: profileCreateError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: userId,
        username: cleanUsername,
        role: codeRecord.role,
        internal_auth_email: internalEmail,
        status: 'active',
      })
      .select()
      .single();

    if (profileCreateError || !userProfile) {
      console.error('Profile create error:', profileCreateError);
      // Rollback auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: 'प्रोफाइल तयार करताना त्रुटी आली' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Role-specific record creation
    if (codeRecord.role === 'CONTRACTOR') {
      const contractorName = company_name || codeRecord.metadata?.company_name || `${cleanUsername} Enterprises`;
      const contactName = contact_person || full_name || cleanUsername;

      const { error: contractorError } = await supabaseAdmin.from('contractors').insert({
        user_id: userId,
        user_profile_id: userProfile.id,
        company_name: contractorName,
        contact_person: contactName,
        phone: phone || null,
        status: 'active',
      });

      if (contractorError) {
        console.error('Contractor create error:', contractorError);
      }
    } else if (codeRecord.role === 'EMPLOYEE') {
      const employeeName = full_name || codeRecord.metadata?.full_name || cleanUsername;
      const empCode = codeRecord.metadata?.employee_code || `EMP-${Date.now().toString().slice(-6)}`;

      const { error: employeeError } = await supabaseAdmin.from('employees').insert({
        user_id: userId,
        user_profile_id: userProfile.id,
        contractor_id: codeRecord.contractor_id,
        shop_id: codeRecord.shop_id,
        employee_code: empCode,
        full_name: employeeName,
        phone: phone || null,
        status: 'active',
      });

      if (employeeError) {
        console.error('Employee create error:', employeeError);
      }
    }

    // 7. Atomically consume the registration code
    const { error: consumeError } = await supabaseAdmin
      .from('registration_codes')
      .update({
        is_consumed: true,
        consumed_at: new Date().toISOString(),
        consumed_by: userId,
      })
      .eq('id', codeRecord.id)
      .eq('is_consumed', false);

    if (consumeError) {
      console.error('Code consume error:', consumeError);
    }

    // 8. Record audit log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: userId,
      action: 'ACCOUNT_ACTIVATED',
      entity: 'user_profiles',
      entity_id: userProfile.id,
      details: {
        role: codeRecord.role,
        username: cleanUsername,
        code_id: codeRecord.id,
      },
      ip_address: clientIp,
    });

    return new Response(
      JSON.stringify({
        message: 'खाते यशस्वीरित्या सक्रिय केले (Account successfully activated)',
        user: {
          id: userId,
          username: cleanUsername,
          role: codeRecord.role,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Activation unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'खाते सक्रिय करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
