import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

describe('Sprint 1 - Requirements 10 & 11: Registration Code Lifecycle, Expiry, & Single-Use', () => {
  function hashSha256(text: string): string {
    return crypto.createHash('sha256').update(text.trim()).digest('hex');
  }

  // Mock Database for registration_codes
  interface RegistrationCodeRecord {
    id: string;
    code_hash: string;
    role: 'CONTRACTOR' | 'EMPLOYEE';
    expires_at: Date;
    is_consumed: boolean;
    consumed_at: Date | null;
    consumed_by: string | null;
  }

  const validPlainCode = 'CTR-ABCD-1234-EFGH';
  const validHash = hashSha256(validPlainCode);

  const expiredPlainCode = 'EMP-EXPR-9999-OLD1';
  const expiredHash = hashSha256(expiredPlainCode);

  const codesTable: RegistrationCodeRecord[] = [
    {
      id: 'code-1',
      code_hash: validHash,
      role: 'CONTRACTOR',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in future
      is_consumed: false,
      consumed_at: null,
      consumed_by: null,
    },
    {
      id: 'code-2',
      code_hash: expiredHash,
      role: 'EMPLOYEE',
      expires_at: new Date(Date.now() - 1000 * 60 * 60), // 1 hour in the past
      is_consumed: false,
      consumed_at: null,
      consumed_by: null,
    },
  ];

  // Atomic consumption workflow
  async function activateWithCode(plainCode: string, userId: string) {
    const inputHash = hashSha256(plainCode);

    const record = codesTable.find(c => c.code_hash === inputHash);
    if (!record) {
      throw new Error('Invalid registration code');
    }

    // 1. Check if already consumed (Requirement 10)
    if (record.is_consumed) {
      throw new Error('Registration code has already been used. Codes are strictly single-use.');
    }

    // 2. Check if expired (Requirement 11)
    if (new Date(record.expires_at) < new Date()) {
      throw new Error('Registration code has expired.');
    }

    // 3. Atomic consumption
    record.is_consumed = true;
    record.consumed_at = new Date();
    record.consumed_by = userId;

    return { success: true, role: record.role };
  }

  it('Requirement 10: Registration codes cannot be reused (Strict Single-Use)', async () => {
    // First activation succeeds
    const firstActivation = await activateWithCode(validPlainCode, 'user-id-101');
    expect(firstActivation.success).toBe(true);

    // Second activation with the EXACT same code must be rejected
    await expect(activateWithCode(validPlainCode, 'user-id-102')).rejects.toThrow(
      'Registration code has already been used. Codes are strictly single-use.'
    );

    // Verify stored state
    const record = codesTable.find(c => c.code_hash === validHash)!;
    expect(record.is_consumed).toBe(true);
    expect(record.consumed_by).toBe('user-id-101');
  });

  it('Requirement 11: Expired registration codes are rejected', async () => {
    // Attempting to activate with an expired code
    await expect(activateWithCode(expiredPlainCode, 'user-id-201')).rejects.toThrow(
      'Registration code has expired.'
    );

    // Verify expired code remains unconsumed
    const record = codesTable.find(c => c.code_hash === expiredHash)!;
    expect(record.is_consumed).toBe(false);
  });
});
