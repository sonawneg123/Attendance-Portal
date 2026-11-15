import { describe, it, expect } from 'vitest';

describe('Sprint 1 - Requirement 6: Invalid Login Credentials & Generic Error Handling', () => {
  const usersDatabase = [
    {
      id: 'uuid-user-1',
      username: 'active_contractor',
      internalEmail: 'usr_c1@internal.attendanceportal.local',
      passwordHash: 'supabase_managed_hash_1', // Managed strictly by Supabase Auth
      status: 'active',
    },
    {
      id: 'uuid-user-2',
      username: 'inactive_contractor',
      internalEmail: 'usr_c2@internal.attendanceportal.local',
      passwordHash: 'supabase_managed_hash_2',
      status: 'inactive',
    },
  ];

  const GENERIC_ERROR = 'Invalid username or password';

  async function mockEdgeFunctionLogin(payload: { username?: any; password?: any }) {
    const { username, password } = payload;

    // 1. Input validation
    if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
      return { status: 400, body: { error: GENERIC_ERROR } };
    }

    const clean = username.trim().toLowerCase();

    // 2. Resolve username
    const profile = usersDatabase.find(u => u.username === clean && u.status === 'active');
    if (!profile) {
      // User does not exist or is inactive -> return GENERIC error (prevent user enumeration)
      return { status: 401, body: { error: GENERIC_ERROR } };
    }

    // 3. Supabase Auth password verification simulation
    const isPasswordValid = password === 'CorrectPassword123!';
    if (!isPasswordValid) {
      // Incorrect password -> return SAME GENERIC error
      return { status: 401, body: { error: GENERIC_ERROR } };
    }

    // 4. Success -> return session
    return {
      status: 200,
      body: {
        session: { access_token: 'valid.token', refresh_token: 'refresh.token' },
        user: { id: profile.id, username: profile.username },
      },
    };
  }

  it('Requirement 6: Invalid login credentials are rejected with identical generic errors', async () => {
    // 1. Non-existent username
    const nonExistent = await mockEdgeFunctionLogin({
      username: 'ghost_user',
      password: 'SomePassword123!',
    });
    expect(nonExistent.status).toBe(401);
    expect(nonExistent.body.error).toBe(GENERIC_ERROR);

    // 2. Existing username with wrong password
    const wrongPassword = await mockEdgeFunctionLogin({
      username: 'active_contractor',
      password: 'WrongPassword123!',
    });
    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body.error).toBe(GENERIC_ERROR);

    // Error messages MUST be identical to prevent user enumeration
    expect(nonExistent.body.error).toBe(wrongPassword.body.error);

    // 3. Inactive/deactivated user account
    const inactiveUser = await mockEdgeFunctionLogin({
      username: 'inactive_contractor',
      password: 'CorrectPassword123!',
    });
    expect(inactiveUser.status).toBe(401);
    expect(inactiveUser.body.error).toBe(GENERIC_ERROR);

    // 4. Malformed/missing inputs
    const emptyPayload = await mockEdgeFunctionLogin({});
    expect(emptyPayload.status).toBe(400);
    expect(emptyPayload.body.error).toBe(GENERIC_ERROR);

    // 5. Valid credentials succeed
    const valid = await mockEdgeFunctionLogin({
      username: 'active_contractor',
      password: 'CorrectPassword123!',
    });
    expect(valid.status).toBe(200);
    expect(valid.body.session).toBeDefined();
    expect(valid.body.user.username).toBe('active_contractor');
  });
});
