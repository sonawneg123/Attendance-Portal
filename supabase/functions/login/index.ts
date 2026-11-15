// Supabase Edge Function: login
// Handles username + password authentication with internal auth mapping and generic errors

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

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
    const { username, password } = body;

    // 1. Validate Input
    if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid username or password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';

    // Initialize Supabase Admin client with service-role (server-side only)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 2. Extensible Rate Limiting Check
    const { data: rateLimitAllowed, error: rateLimitError } = await supabaseAdmin.rpc(
      'check_rate_limit',
      {
        p_identifier: cleanUsername,
        p_ip_address: clientIp,
        p_max_attempts: 5,
        p_window_seconds: 900, // 15 minutes
      }
    );

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    } else if (rateLimitAllowed === false) {
      return new Response(
        JSON.stringify({
          error: 'Too many failed login attempts. Please try again after 15 minutes.',
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Resolve username to internal Auth identity securely
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, user_id, username, role, internal_auth_email, status')
      .eq('username', cleanUsername)
      .single();

    if (profileError || !profile || profile.status !== 'active') {
      // Record failed attempt
      await supabaseAdmin.from('login_attempts').insert({
        identifier: cleanUsername,
        ip_address: clientIp,
        success: false,
      });

      // Audit log failed attempt (no sensitive information)
      await supabaseAdmin.from('audit_logs').insert({
        action: 'USER_LOGIN_FAILED',
        entity: 'user_profiles',
        details: { attempted_username: cleanUsername, reason: 'profile_not_found_or_inactive' },
        ip_address: clientIp,
      });

      // Return generic error to prevent username enumeration
      return new Response(
        JSON.stringify({ error: 'Invalid username or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Authenticate using Supabase Auth with internal identity
    // Use anon client for signing in to create a real user session
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: profile.internal_auth_email,
      password: password,
    });

    if (authError || !authData.session) {
      // Record failed attempt
      await supabaseAdmin.from('login_attempts').insert({
        identifier: cleanUsername,
        ip_address: clientIp,
        success: false,
      });

      await supabaseAdmin.from('audit_logs').insert({
        actor_id: profile.user_id,
        action: 'USER_LOGIN_FAILED',
        entity: 'user_profiles',
        entity_id: profile.id,
        details: { username: cleanUsername, reason: 'auth_failed' },
        ip_address: clientIp,
      });

      // Generic error message
      return new Response(
        JSON.stringify({ error: 'Invalid username or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Login successful: Record success and log audit
    await supabaseAdmin.from('login_attempts').insert({
      identifier: cleanUsername,
      ip_address: clientIp,
      success: true,
    });

    await supabaseAdmin.from('audit_logs').insert({
      actor_id: profile.user_id,
      action: 'USER_LOGIN_SUCCESS',
      entity: 'user_profiles',
      entity_id: profile.id,
      details: { role: profile.role, username: cleanUsername },
      ip_address: clientIp,
    });

    // 6. Return secure session and non-sensitive user metadata
    return new Response(
      JSON.stringify({
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_in: authData.session.expires_in,
          token_type: authData.session.token_type,
        },
        user: {
          id: profile.user_id,
          username: profile.username,
          role: profile.role,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Unexpected login error:', err);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
