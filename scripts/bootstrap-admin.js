/**
 * Attendance Portal - Admin Bootstrap Script
 * Secure server-side bootstrap for creating the one permanent Admin account.
 * 
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ADMIN_USERNAME=admin ADMIN_PASSWORD=SecurePassword123! node scripts/bootstrap-admin.js
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || 'System Administrator';

async function bootstrapAdmin() {
  console.log('--- Attendance Portal Admin Bootstrap ---');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.');
    process.exit(1);
  }

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    console.error('Error: ADMIN_USERNAME and ADMIN_PASSWORD environment variables are required.');
    process.exit(1);
  }

  const cleanUsername = ADMIN_USERNAME.trim().toLowerCase();
  if (cleanUsername.length < 3 || cleanUsername.length > 50) {
    console.error('Error: ADMIN_USERNAME must be between 3 and 50 characters.');
    process.exit(1);
  }

  if (ADMIN_PASSWORD.length < 8) {
    console.error('Error: ADMIN_PASSWORD must be at least 8 characters long.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Check if an Admin profile already exists
  const { data: existingAdmin, error: checkError } = await supabase
    .from('admin_profiles')
    .select('id')
    .limit(1);

  if (checkError) {
    console.error('Database connection / check failed:', checkError.message);
    process.exit(1);
  }

  if (existingAdmin && existingAdmin.length > 0) {
    console.error('Security Violation: An Admin account already exists. A second Admin cannot be created.');
    process.exit(1);
  }

  // Create internal Auth user
  const internalAdminId = crypto.randomUUID();
  const internalEmail = `admin_${internalAdminId.replace(/-/g, '')}@internal.attendanceportal.local`;

  console.log(`Creating Admin user identity for username: "${cleanUsername}"...`);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: internalEmail,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { role: 'ADMIN' },
  });

  if (authError || !authData.user) {
    console.error('Failed to create auth user:', authError?.message);
    process.exit(1);
  }

  const userId = authData.user.id;

  // Insert into user_profiles
  const { data: profileData, error: profileError } = await supabase
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

  if (profileError || !profileData) {
    console.error('Failed to create user profile:', profileError?.message);
    await supabase.auth.admin.deleteUser(userId);
    process.exit(1);
  }

  // Insert into admin_profiles
  const { error: adminError } = await supabase
    .from('admin_profiles')
    .insert({
      id: userId,
      user_profile_id: profileData.id,
      full_name: ADMIN_FULL_NAME,
      singleton_guard: true,
    });

  if (adminError) {
    console.error('Failed to create admin profile:', adminError.message);
    await supabase.from('user_profiles').delete().eq('id', profileData.id);
    await supabase.auth.admin.deleteUser(userId);
    process.exit(1);
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    actor_id: userId,
    action: 'ADMIN_BOOTSTRAP',
    entity: 'admin_profiles',
    entity_id: userId,
    details: { username: cleanUsername, message: 'Initial Admin account created via CLI script' },
  });

  console.log('Admin account created successfully!');
  console.log(`Username: ${cleanUsername}`);
  console.log(`Role: ADMIN`);
  console.log('You may now log in via the Attendance Portal login page with this username and password.');
}

bootstrapAdmin().catch(err => {
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
