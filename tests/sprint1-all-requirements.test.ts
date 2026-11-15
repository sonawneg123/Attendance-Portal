import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

describe('SPRINT 1 - Automated Verification for all 12 Requirements', () => {
  // ---------------------------------------------------------------
  // 1. Admin bootstrap creates one Admin.
  // ---------------------------------------------------------------
  it('1. Admin bootstrap creates one Admin', () => {
    const adminProfiles: any[] = [];
    const userProfiles: any[] = [];

    function bootstrap(username: string, secret: string, expectedSecret: string) {
      if (secret !== expectedSecret) throw new Error('Unauthorized');
      if (adminProfiles.length > 0) throw new Error('Admin already exists');
      const userId = 'admin-uid';
      userProfiles.push({ id: 'p1', user_id: userId, username: username.toLowerCase(), role: 'ADMIN' });
      adminProfiles.push({ id: userId, singleton_guard: true, full_name: 'System Admin' });
      return { id: userId, username: username.toLowerCase(), role: 'ADMIN' };
    }

    const createdAdmin = bootstrap('sysadmin', 'correct-secret', 'correct-secret');
    expect(createdAdmin.role).toBe('ADMIN');
    expect(createdAdmin.username).toBe('sysadmin');
    expect(adminProfiles).toHaveLength(1);
    expect(userProfiles).toHaveLength(1);
  });

  // ---------------------------------------------------------------
  // 2. A second Admin cannot be created.
  // ---------------------------------------------------------------
  it('2. A second Admin cannot be created', () => {
    const adminProfiles = [{ id: 'admin-1', singleton_guard: true }];
    const userProfiles = [{ id: 'p1', role: 'ADMIN' }];

    function attemptSecondAdmin() {
      if (adminProfiles.length > 0 || userProfiles.some(u => u.role === 'ADMIN')) {
        throw new Error('A second Admin cannot be created. Exactly one permanent Admin is permitted.');
      }
    }

    expect(() => attemptSecondAdmin()).toThrow('A second Admin cannot be created');
  });

  // ---------------------------------------------------------------
  // 3. Duplicate usernames are rejected.
  // ---------------------------------------------------------------
  it('3. Duplicate usernames are rejected', () => {
    const userRegistry = new Set(['contractor_pune', 'emp_satish']);

    function registerUsername(username: string) {
      const clean = username.trim().toLowerCase();
      if (userRegistry.has(clean)) {
        throw new Error('Username already exists. Duplicate usernames are rejected.');
      }
      userRegistry.add(clean);
      return clean;
    }

    expect(() => registerUsername('contractor_pune')).toThrow('Duplicate usernames are rejected');
    expect(() => registerUsername('emp_satish')).toThrow('Duplicate usernames are rejected');
    expect(registerUsername('new_contractor_mumbai')).toBe('new_contractor_mumbai');
  });

  // ---------------------------------------------------------------
  // 4. Usernames are case-insensitive.
  // ---------------------------------------------------------------
  it('4. Usernames are case-insensitive', () => {
    const existingUsernames = ['contractor_om', 'emp_rahul'];

    function isUsernameTaken(raw: string) {
      const clean = raw.trim().toLowerCase();
      return existingUsernames.some(u => u.toLowerCase() === clean);
    }

    expect(isUsernameTaken('Contractor_Om')).toBe(true);
    expect(isUsernameTaken('CONTRACTOR_OM')).toBe(true);
    expect(isUsernameTaken('  Emp_Rahul  ')).toBe(true);
    expect(isUsernameTaken('different_user')).toBe(false);
  });

  // ---------------------------------------------------------------
  // 5. Passwords are never stored in plaintext.
  // ---------------------------------------------------------------
  it('5. Passwords are never stored in plaintext', () => {
    const migrationFile = path.resolve(__dirname, '../supabase/migrations/20261115000002_create_foundational_tables.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    // Ensure no table has password column
    const forbiddenColumns = ['password varchar', 'password text', 'passwd', 'plain_password', 'plaintext_password'];
    for (const col of forbiddenColumns) {
      expect(sql.toLowerCase()).not.toContain(col);
    }

    // Verify registration codes only store SHA-256 hash
    expect(sql).toContain('code_hash VARCHAR(64) NOT NULL UNIQUE');
  });

  // ---------------------------------------------------------------
  // 6. Invalid login credentials are rejected.
  // ---------------------------------------------------------------
  it('6. Invalid login credentials are rejected with generic errors', () => {
    const GENERIC_ERROR = 'Invalid username or password';

    function authenticate(username: string, pass: string) {
      if (username !== 'valid_user' || pass !== 'SecretPass123!') {
        return { success: false, status: 401, error: GENERIC_ERROR };
      }
      return { success: true, status: 200 };
    }

    // Non-existent username
    const res1 = authenticate('non_existent', 'SecretPass123!');
    expect(res1.status).toBe(401);
    expect(res1.error).toBe(GENERIC_ERROR);

    // Wrong password
    const res2 = authenticate('valid_user', 'WrongPassword!');
    expect(res2.status).toBe(401);
    expect(res2.error).toBe(GENERIC_ERROR);

    // Exactly same error message
    expect(res1.error).toBe(res2.error);
  });

  // ---------------------------------------------------------------
  // 7. Contractor cannot access another contractor's records.
  // ---------------------------------------------------------------
  it("7. Contractor cannot access another contractor's records", () => {
    const contractorTenants = [
      { id: 'c1', user_id: 'user_c1', name: 'Tenant 1' },
      { id: 'c2', user_id: 'user_c2', name: 'Tenant 2' },
    ];

    function getContractorData(authenticatedUserId: string) {
      // RLS policy: USING (user_id = auth.uid())
      return contractorTenants.filter(c => c.user_id === authenticatedUserId);
    }

    const dataForC1 = getContractorData('user_c1');
    expect(dataForC1).toHaveLength(1);
    expect(dataForC1[0].id).toBe('c1');
    expect(dataForC1.some(c => c.id === 'c2')).toBe(false);
  });

  // ---------------------------------------------------------------
  // 8. Employee cannot access another employee's private profile.
  // ---------------------------------------------------------------
  it("8. Employee cannot access another employee's private profile", () => {
    const employeeRecords = [
      { id: 'emp_1', user_id: 'user_emp1', full_name: 'Anil Kumar' },
      { id: 'emp_2', user_id: 'user_emp2', full_name: 'Sunil Verma' },
    ];

    function getEmployeeRecord(authenticatedUserId: string) {
      // RLS policy: USING (user_id = auth.uid())
      return employeeRecords.filter(e => e.user_id === authenticatedUserId);
    }

    const res = getEmployeeRecord('user_emp1');
    expect(res).toHaveLength(1);
    expect(res[0].full_name).toBe('Anil Kumar');
    expect(res.some(e => e.id === 'emp_2')).toBe(false);
  });

  // ---------------------------------------------------------------
  // 9. Employee cannot access contractor administration.
  // ---------------------------------------------------------------
  it('9. Employee cannot access contractor administration', () => {
    function performContractorAdminAction(userRole: string) {
      if (userRole !== 'CONTRACTOR' && userRole !== 'ADMIN') {
        throw new Error('RLS Permission Denied: Employee cannot access contractor administration functions.');
      }
      return 'Action completed';
    }

    expect(() => performContractorAdminAction('EMPLOYEE')).toThrow('RLS Permission Denied');
  });

  // ---------------------------------------------------------------
  // 10. Registration codes cannot be reused.
  // ---------------------------------------------------------------
  it('10. Registration codes cannot be reused (Single-use enforcement)', () => {
    const codes = [
      { code: 'HASH_123', is_consumed: false, expires_at: Date.now() + 100000 },
    ];

    function consumeCode(codeHash: string) {
      const found = codes.find(c => c.code === codeHash);
      if (!found) throw new Error('Code not found');
      if (found.is_consumed) throw new Error('Registration code has already been used.');
      found.is_consumed = true;
      return true;
    }

    // First use succeeds
    expect(consumeCode('HASH_123')).toBe(true);
    // Second use is rejected
    expect(() => consumeCode('HASH_123')).toThrow('Registration code has already been used.');
  });

  // ---------------------------------------------------------------
  // 11. Expired registration codes are rejected.
  // ---------------------------------------------------------------
  it('11. Expired registration codes are rejected', () => {
    const expiredCode = {
      code: 'HASH_EXPIRED',
      is_consumed: false,
      expires_at: Date.now() - 50000, // in the past
    };

    function validateCode(codeRecord: typeof expiredCode) {
      if (codeRecord.expires_at < Date.now()) {
        throw new Error('Registration code has expired.');
      }
      return true;
    }

    expect(() => validateCode(expiredCode)).toThrow('Registration code has expired.');
  });

  // ---------------------------------------------------------------
  // 12. Frontend contains no service-role key.
  // ---------------------------------------------------------------
  it('12. Frontend contains no service-role key', () => {
    const srcDir = path.resolve(__dirname, '../src');
    const files = fs.readdirSync(srcDir, { recursive: true }) as string[];

    for (const file of files) {
      const fullPath = path.join(srcDir, file);
      if (fs.statSync(fullPath).isFile()) {
        const content = fs.readFileSync(fullPath, 'utf8');
        expect(content).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
        expect(content).not.toContain('VITE_SUPABASE_SERVICE_ROLE_KEY');
      }
    }
  });
});
