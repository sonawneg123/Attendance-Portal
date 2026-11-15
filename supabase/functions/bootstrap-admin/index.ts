// Supabase Edge Function: bootstrap-admin
// Secure server-side initialization of the single permanent Admin account

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ADMIN_BOOTSTRAP_SECRET = Deno.env.get('ADMIN_BOOTSTRAP_SECRET') || '';

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

    // 1. Verify Setup Secret
    const providedSecret = req.headers.get('x-bootstrap-secret');
    if (!ADMIN_BOOTSTRAP_SECRET || providedSecret !== ADMIN_BOOTSTRAP_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or missing bootstrap secret' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { username, password, full_name } = body;

    // 2. Validate Input
    if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/;
    if (!usernameRegex.test(cleanUsername)) {
      return new Response(
        JSON.stringify({ error: 'Username must be 3-50 alphanumeric, dash, or underscore characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';

    // 3. Strict Check: Verify that NO admin account exists anywhere in the system
    const { count: adminProfileCount, error: countError } = await supabaseAdmin
      .from('admin_profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error checking admin profiles:', countError);
    }

    if (adminProfileCount && adminProfileCount > 0) {
      return new Response(
        JSON.stringify({
          error: 'An Admin account already exists. A second Admin account cannot be created.',
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { count: adminUserCount } = await supabaseAdmin
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'ADMIN');

    if (adminUserCount && adminUserCount > 0) {
      return new Response(
        JSON.stringify({
          error: 'An Admin account already exists. A second Admin account cannot be created.',
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Create internal Auth user
    const internalAdminId = crypto.randomUUID();
    const internalEmail = `admin_${internalAdminId.replace(/-/g, '')}@internal.attendanceportal.local`;

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: internalEmail,
      password: password,
      email_confirm: true,
      user_metadata: { role: 'ADMIN' },
    });

    if (authError || !authUser.user) {
      console.error('Admin Auth creation error:', authError);
      return new Response(
        JSON.stringify({ error: 'Failed to create Admin authentication user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authUser.user.id;

    // 5. Create user_profiles record
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: userId,
        username: cleanUsername,
        role: 'ADMIN',
        internal_auth_email: internalEmail,
        status: 'active',
      })
      .select()
      .single();

    if (profileError || !profile) {
      console.error('Admin user_profiles error:', profileError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: profileError?.message || 'Failed to create Admin profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Create admin_profiles record (guaranteed singleton via database constraint)
    const { error: adminProfileError } = await supabaseAdmin
      .from('admin_profiles')
      .insert({
        id: userId,
        user_profile_id: profile.id,
        full_name: full_name?.trim() || 'System Administrator',
        singleton_guard: true,
      });

    if (adminProfileError) {
      console.error('Admin admin_profiles error:', adminProfileError);
      await supabaseAdmin.from('user_profiles').delete().eq('id', profile.id);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: adminProfileError.message || 'Failed to register Admin profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Audit log the Admin bootstrap
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: userId,
      action: 'ADMIN_BOOTSTRAP',
      entity: 'admin_profiles',
      entity_id: userId,
      details: { username: cleanUsername, message: 'System Admin account initialized' },
      ip_address: clientIp,
    });

    return new Response(
      JSON.stringify({
        message: 'Admin account initialized successfully.',
        username: cleanUsername,
        role: 'ADMIN',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Bootstrap admin unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Unexpected error during admin initialization' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
