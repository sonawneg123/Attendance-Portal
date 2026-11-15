import { supabase } from './supabase';
import type { AuthUser, LoginResponse, ActivationPayload } from '../types/auth';

const GENERIC_LOGIN_ERROR = 'अवैध वापरकर्तानाव किंवा पासवर्ड';

export const authService = {
  /**
   * Authenticates user using username and password via Supabase Edge Function.
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    const cleanUsername = username.trim().toLowerCase();

    // Call Supabase Edge Function for server-side username resolution and authentication
    const { data, error } = await supabase.functions.invoke('login', {
      body: { username: cleanUsername, password },
    });

    if (error || !data?.session) {
      // In case of any error from Edge Function (401, 404, invalid credentials),
      // return a generic error message to prevent username enumeration.
      const errorMessage = data?.error || error?.message || GENERIC_LOGIN_ERROR;
      throw new Error(errorMessage.includes('Too many') ? errorMessage : GENERIC_LOGIN_ERROR);
    }

    // Set authenticated session in local Supabase client
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

    if (sessionError) {
      console.error('Failed to set Supabase session in client:', sessionError);
      throw new Error(GENERIC_LOGIN_ERROR);
    }

    return {
      session: data.session,
      user: data.user,
    };
  },

  /**
   * Activates a new Contractor or Employee account using a single-use registration code.
   */
  async activateAccount(payload: ActivationPayload): Promise<{ message: string; user: AuthUser }> {
    const { data, error } = await supabase.functions.invoke('activate-account', {
      body: payload,
    });

    if (error || !data?.user) {
      throw new Error(data?.error || error?.message || 'खाते सक्रिय करण्यात अपयश आले.');
    }

    return data;
  },

  /**
   * Fetches current authenticated user profile using RLS.
   */
  async getProfile(): Promise<AuthUser | null> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return null;
    }

    // Query user_profiles using RLS policy (users_read_own_profile)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, user_id, username, role, status')
      .eq('user_id', session.user.id)
      .single();

    if (profileError || !profile || profile.status !== 'active') {
      return null;
    }

    return {
      id: profile.user_id,
      username: profile.username,
      role: profile.role,
      status: profile.status,
    };
  },

  /**
   * Terminates active session.
   */
  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },
};
