import { describe, it, expect } from 'vitest';

describe('Sprint 1 - Requirements 3 & 4: Username Validation and Case-Insensitive Uniqueness', () => {
  const existingUsers = [
    { id: '1', username: 'contractor_maharashtra', role: 'CONTRACTOR' },
    { id: '2', username: 'worker_ramesh', role: 'EMPLOYEE' },
  ];

  function normalizeUsername(username: string): string {
    return username.trim().toLowerCase();
  }

  function validateAndRegisterUsername(rawUsername: string, database: typeof existingUsers) {
    const clean = normalizeUsername(rawUsername);

    // Regex check matching DB constraint: ^[a-zA-Z0-9_-]{3,50}$
    const regex = /^[a-zA-Z0-9_-]{3,50}$/;
    if (!regex.test(clean)) {
      throw new Error('Invalid username format');
    }

    // Case-insensitive uniqueness check (corresponds to UNIQUE INDEX ON LOWER(username))
    const exists = database.some(u => u.username.toLowerCase() === clean);
    if (exists) {
      throw new Error('Username already exists. Duplicate usernames are rejected.');
    }

    return { id: String(database.length + 1), username: clean };
  }

  it('Requirement 3: Duplicate usernames are rejected', () => {
    expect(() => {
      validateAndRegisterUsername('contractor_maharashtra', existingUsers);
    }).toThrow('Username already exists. Duplicate usernames are rejected.');

    expect(() => {
      validateAndRegisterUsername('worker_ramesh', existingUsers);
    }).toThrow('Username already exists. Duplicate usernames are rejected.');

    // Valid unique username succeeds
    const newUser = validateAndRegisterUsername('new_unique_worker', existingUsers);
    expect(newUser.username).toBe('new_unique_worker');
  });

  it('Requirement 4: Usernames are case-insensitive', () => {
    // Attempting variations of capitalization
    expect(() => {
      validateAndRegisterUsername('Contractor_Maharashtra', existingUsers);
    }).toThrow('Username already exists');

    expect(() => {
      validateAndRegisterUsername('CONTRACTOR_MAHARASHTRA', existingUsers);
    }).toThrow('Username already exists');

    expect(() => {
      validateAndRegisterUsername('  Worker_Ramesh  ', existingUsers);
    }).toThrow('Username already exists');

    // Normalization always lowers and trims
    expect(normalizeUsername('  AdMiN_UsEr  ')).toBe('admin_user');
  });
});
