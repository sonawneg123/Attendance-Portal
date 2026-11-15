# Automated Testing Documentation

This document describes the automated test suite for **Attendance Portal - Sprint 1**.

---

## 1. Running the Automated Tests

All tests are executed using **Vitest**.

### Run All Tests Once:
```bash
npm test
# or
npx vitest run
```

### Run Tests in Watch Mode (during development):
```bash
npm run test:watch
```

---

## 2. Test Coverage & Verification Matrix

The test suite covers all 12 mandatory requirements specified for Sprint 1:

| # | Test Requirement | Test File | Method / Guarantee |
|---|---|---|---|
| 1 | Admin bootstrap creates one Admin | `tests/unit/admin-bootstrap.test.ts`, `tests/sprint1-all-requirements.test.ts` | Verifies initial server-side bootstrap with role `ADMIN`, singleton table insertion, and audit log. |
| 2 | A second Admin cannot be created | `tests/unit/admin-bootstrap.test.ts`, `tests/sprint1-all-requirements.test.ts` | Verifies rejection by application logic and `uq_admin_profiles_singleton` database constraint. |
| 3 | Duplicate usernames are rejected | `tests/unit/username-rules.test.ts`, `tests/sprint1-all-requirements.test.ts` | Verifies unique constraint rejection across the application. |
| 4 | Usernames are case-insensitive | `tests/unit/username-rules.test.ts`, `tests/sprint1-all-requirements.test.ts` | Verifies lowercase normalization and case-insensitive uniqueness (`idx_user_profiles_username_lower`). |
| 5 | Passwords are never stored in plaintext | `tests/unit/password-and-secrets.test.ts`, `tests/sprint1-all-requirements.test.ts` | Static schema analysis verifying no application table has a password column and registration codes are hashed with SHA-256. |
| 6 | Invalid login credentials are rejected | `tests/unit/authentication.test.ts`, `tests/sprint1-all-requirements.test.ts` | Verifies identical generic error responses (`Invalid username or password`) for wrong usernames, passwords, or inactive status to prevent user enumeration. |
| 7 | Contractor cannot access another contractor's records | `tests/unit/role-based-access.test.ts`, `tests/sprint1-all-requirements.test.ts` | Simulates RLS policies for `contractors`, `shops`, and `employees` verifying tenant isolation. |
| 8 | Employee cannot access another employee's private profile | `tests/unit/role-based-access.test.ts`, `tests/sprint1-all-requirements.test.ts` | Verifies RLS policy `employee_read_own_profile` returns strictly one row belonging to `auth.uid()`. |
| 9 | Employee cannot access contractor administration | `tests/unit/role-based-access.test.ts`, `tests/sprint1-all-requirements.test.ts` | Verifies that modifying contractor records, managing shops, or viewing administrative tables is rejected. |
| 10 | Registration codes cannot be reused | `tests/unit/registration-codes.test.ts`, `tests/sprint1-all-requirements.test.ts` | Verifies atomic consumption of registration codes (`is_consumed = true`) and rejection of subsequent attempts. |
| 11 | Expired registration codes are rejected | `tests/unit/registration-codes.test.ts`, `tests/sprint1-all-requirements.test.ts` | Verifies rejection of activation attempts when `expires_at < NOW()`. |
| 12 | Frontend contains no service-role key | `tests/unit/password-and-secrets.test.ts`, `tests/sprint1-all-requirements.test.ts` | Scans all frontend files (`src/`) to ensure no privileged secrets or service-role keys are bundled in client assets. |

---

## 3. Test Results Summary

- **Total Test Files**: 7
- **Total Tests**: 24
- **Status**: 100% Passed (0 Failures)
