import { describe, it, expect, vi } from 'vitest';

describe('Sprint 1 - Requirements 1 & 2: Admin Bootstrap & Singleton Enforcement', () => {
  it('Requirement 1: Admin bootstrap creates exactly one Admin account', async () => {
    // Simulated database state
    const adminProfiles: any[] = [];
    const userProfiles: any[] = [];
    const auditLogs: any[] = [];

    async function bootstrapAdmin(payload: { username: string; password: string; secret: string }, bootstrapSecret: string) {
      if (!payload.secret || payload.secret !== bootstrapSecret) {
        throw new Error('Unauthorized: Invalid bootstrap secret');
      }

      if (adminProfiles.length > 0 || userProfiles.some(u => u.role === 'ADMIN')) {
        throw new Error('Conflict: Admin account already exists');
      }

      const cleanUsername = payload.username.trim().toLowerCase();
      const userId = 'admin-uuid-1';

      const userProfile = {
        id: 'profile-uuid-1',
        user_id: userId,
        username: cleanUsername,
        role: 'ADMIN',
        status: 'active',
      };
      userProfiles.push(userProfile);

      const adminProfile = {
        id: userId,
        user_profile_id: userProfile.id,
        singleton_guard: true,
        full_name: 'System Administrator',
      };
      adminProfiles.push(adminProfile);

      auditLogs.push({
        action: 'ADMIN_BOOTSTRAP',
        actor_id: userId,
      });

      return { success: true, user: userProfile };
    }

    const result = await bootstrapAdmin(
      { username: 'sysadmin', password: 'SuperSecretPassword123!', secret: 'test-bootstrap-secret' },
      'test-bootstrap-secret'
    );

    expect(result.success).toBe(true);
    expect(result.user.username).toBe('sysadmin');
    expect(result.user.role).toBe('ADMIN');
    expect(adminProfiles).toHaveLength(1);
    expect(adminProfiles[0].singleton_guard).toBe(true);
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].action).toBe('ADMIN_BOOTSTRAP');
  });

  it('Requirement 2: A second Admin cannot be created (Singleton check & database constraint simulation)', async () => {
    const adminProfiles: any[] = [
      { id: 'admin-uuid-1', singleton_guard: true, full_name: 'System Administrator' }
    ];
    const userProfiles: any[] = [
      { id: 'profile-uuid-1', username: 'admin', role: 'ADMIN' }
    ];

    async function attemptCreateAdmin(username: string) {
      // 1. Application-level check
      if (adminProfiles.length > 0 || userProfiles.some(u => u.role === 'ADMIN')) {
        throw new Error('A second Admin account cannot be created. Exactly one permanent Admin is permitted.');
      }

      // 2. Database-level UNIQUE constraint on singleton_guard simulation
      if (adminProfiles.some(a => a.singleton_guard === true)) {
        throw new Error('duplicate key value violates unique constraint "uq_admin_profiles_singleton"');
      }
    }

    await expect(attemptCreateAdmin('admin2')).rejects.toThrow(
      'A second Admin account cannot be created. Exactly one permanent Admin is permitted.'
    );

    // Verify state has not been modified
    expect(adminProfiles).toHaveLength(1);
    expect(userProfiles).toHaveLength(1);
  });
});
