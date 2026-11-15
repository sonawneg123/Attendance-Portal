import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Sprint 1 - Requirements 5 & 12: Password Security & Secret Isolation', () => {
  it('Requirement 5: Passwords are never stored in plaintext in any application database table', () => {
    // Read the foundational tables migration SQL file
    const migrationPath = path.resolve(__dirname, '../../supabase/migrations/20261115000002_create_foundational_tables.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    // List of application tables
    const tableNames = [
      'user_profiles',
      'admin_profiles',
      'contractors',
      'shops',
      'employees',
      'registration_codes',
      'audit_logs',
      'login_attempts',
    ];

    // Verify each table definition does NOT contain a password or plaintext_password column
    for (const table of tableNames) {
      const tableRegex = new RegExp(`CREATE TABLE[\\s\\S]*?${table}[\\s\\S]*?\\(([\\s\\S]*?)\\);`, 'gi');
      const match = tableRegex.exec(migrationSql);
      if (match) {
        const columnsBlock = match[1].toLowerCase();
        expect(columnsBlock).not.toContain('password varchar');
        expect(columnsBlock).not.toContain('password text');
        expect(columnsBlock).not.toContain('passwd');
        expect(columnsBlock).not.toContain('plaintext_password');
      }
    }

    // Verify registration_codes only stores code_hash (SHA-256), never plain registration codes
    expect(migrationSql).toContain('code_hash VARCHAR(64) NOT NULL UNIQUE');
    expect(migrationSql).not.toContain('plain_code');
  });

  it('Requirement 12: Frontend contains no service-role key in source code or env files', () => {
    // Scan all files in src/
    function scanDir(dir: string, foundIssues: string[] = []) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanDir(fullPath, foundIssues);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.html') || file.endsWith('.js')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          // Check for forbidden keywords: actual service-role JWT or hardcoded secret
          if (content.includes('SUPABASE_SERVICE_ROLE_KEY') && !fullPath.includes('tests')) {
            foundIssues.push(`Found SUPABASE_SERVICE_ROLE_KEY in frontend source: ${fullPath}`);
          }
          if (content.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/)) {
            foundIssues.push(`Found potential raw JWT token in frontend source: ${fullPath}`);
          }
        }
      }
      return foundIssues;
    }

    const srcDir = path.resolve(__dirname, '../../src');
    const issues = scanDir(srcDir);
    expect(issues).toEqual([]);

    // Check .env.example
    const envExamplePath = path.resolve(__dirname, '../../.env.example');
    if (fs.existsSync(envExamplePath)) {
      const envContent = fs.readFileSync(envExamplePath, 'utf8');
      expect(envContent).not.toMatch(/^VITE_.*SERVICE_ROLE/m);
    }
  });
});
