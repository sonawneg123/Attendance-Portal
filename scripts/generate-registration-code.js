/**
 * Attendance Portal - Registration Code Generator Script
 * Generates single-use registration codes for Contractors or Employees and stores their SHA-256 hash.
 * 
 * Usage:
 *   ROLE=CONTRACTOR node scripts/generate-registration-code.js
 *   ROLE=EMPLOYEE CONTRACTOR_ID=<uuid> SHOP_ID=<uuid> node scripts/generate-registration-code.js
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ROLE = process.env.ROLE || 'CONTRACTOR';
const CONTRACTOR_ID = process.env.CONTRACTOR_ID || null;
const SHOP_ID = process.env.SHOP_ID || null;
const EXPIRY_DAYS = parseInt(process.env.EXPIRY_DAYS || '7', 10);

function generateSecureCode(role) {
  const prefix = role === 'CONTRACTOR' ? 'CTR' : 'EMP';
  const randomPart = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `${prefix}-${randomPart.slice(0, 4)}-${randomPart.slice(4, 8)}-${randomPart.slice(8, 12)}`;
}

async function generateCode() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    process.exit(1);
  }

  if (!['CONTRACTOR', 'EMPLOYEE'].includes(ROLE)) {
    console.error('Error: ROLE must be either CONTRACTOR or EMPLOYEE.');
    process.exit(1);
  }

  if (ROLE === 'EMPLOYEE' && (!CONTRACTOR_ID || !SHOP_ID)) {
    console.error('Error: CONTRACTOR_ID and SHOP_ID are required when generating an EMPLOYEE code.');
    process.exit(1);
  }

  const plaintextCode = generateSecureCode(ROLE);
  const codeHash = crypto.createHash('sha256').update(plaintextCode.trim()).digest('hex');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.from('registration_codes').insert({
    code_hash: codeHash,
    role: ROLE,
    contractor_id: CONTRACTOR_ID,
    shop_id: SHOP_ID,
    expires_at: expiresAt.toISOString(),
    is_consumed: false,
    metadata: {
      generated_via: 'CLI Script',
      generated_at: new Date().toISOString(),
    },
  }).select().single();

  if (error) {
    console.error('Failed to insert registration code hash:', error.message);
    process.exit(1);
  }

  console.log('========================================================');
  console.log('Registration Code Generated Successfully');
  console.log('========================================================');
  console.log(`Role:            ${ROLE}`);
  console.log(`One-Time Code:   ${plaintextCode}`);
  console.log(`Stored SHA-256:  ${codeHash}`);
  console.log(`Expires At:      ${expiresAt.toISOString()}`);
  console.log('========================================================');
  console.log('SECURITY WARNING: Share the Plaintext Code securely with the user.');
  console.log('The database ONLY stores the SHA-256 hash. Once used, it is single-use.');
}

generateCode().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
