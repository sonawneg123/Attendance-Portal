# Database Migrations Documentation

This document describes the version-controlled SQL migrations implemented in **Sprint 1: Database Foundation, Authentication and Role-Based Access Control** for the **Attendance Portal**.

---

## 1. Overview of Migrations

The migrations are located in `supabase/migrations/` and must be applied sequentially.

| Migration File | Purpose |
|---|---|
| `20261115000001_create_enums_and_extensions.sql` | Enables `uuid-ossp` and `pgcrypto` extensions; creates timestamp trigger function `handle_updated_at()`. |
| `20261115000002_create_foundational_tables.sql` | Creates the 7 core tables: `user_profiles`, `admin_profiles`, `contractors`, `shops`, `employees`, `registration_codes`, `audit_logs`, plus `login_attempts` for rate-limiting. |
| `20261115000003_create_functions_and_triggers.sql` | Defines RLS helper functions, the singleton Admin trigger (`enforce_single_admin()`), Admin deletion prevention trigger, and rate-limiting function (`check_rate_limit()`). |
| `20261115000004_create_rls_policies.sql` | Enables Row Level Security (RLS) on all tables and applies granular access control policies for Admin, Contractor, and Employee roles. |

---

## 2. Table Schemas & Constraints

### 1. `user_profiles`
Stores application-level profile data linked directly to `auth.users(id)`.
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to `auth.users(id)`, ON DELETE CASCADE, UNIQUE)
- `username`: VARCHAR(50) (Checked against `^[a-zA-Z0-9_-]{3,50}$`)
- `role`: VARCHAR(20) (`ADMIN`, `CONTRACTOR`, `EMPLOYEE`)
- `internal_auth_email`: VARCHAR(255) (UNIQUE internal identity for Supabase Auth)
- `status`: VARCHAR(20) (`active`, `inactive`, `suspended`)
- `created_at` / `updated_at`: TIMESTAMPTZ
- **Constraints & Indexes**:
  - `idx_user_profiles_username_lower`: UNIQUE index on `LOWER(username)` ensuring case-insensitive uniqueness.
  - Trigger `trg_user_profiles_single_admin`: strictly prevents creating more than one `ADMIN` account.

### 2. `admin_profiles`
Enforces the existence of exactly one permanent administrator.
- `id`: UUID (Primary Key, references `auth.users(id)`)
- `user_profile_id`: UUID (Foreign Key to `user_profiles(id)`)
- `full_name`: VARCHAR(100)
- `singleton_guard`: BOOLEAN (DEFAULT TRUE, CHECK `singleton_guard = TRUE`, UNIQUE)
- **Constraint**: `uq_admin_profiles_singleton UNIQUE (singleton_guard)` guarantees at the database engine level that no second row can ever be inserted.

### 3. `contractors`
Represents independent contractor tenants.
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to `auth.users(id)`, UNIQUE)
- `user_profile_id`: UUID (Foreign Key to `user_profiles(id)`, UNIQUE)
- `company_name`: VARCHAR(255)
- `contact_person`: VARCHAR(100)
- `phone`: VARCHAR(20)
- `status`: VARCHAR(20) (`active`, `inactive`, `suspended`)
- `created_at` / `updated_at`: TIMESTAMPTZ

### 4. `shops`
Multi-tenant branch/location records belonging to contractors.
- `id`: UUID (Primary Key)
- `contractor_id`: UUID (Foreign Key to `contractors(id)`, ON DELETE RESTRICT)
- `name`: VARCHAR(255)
- `code`: VARCHAR(50)
- `address`: TEXT
- `status`: VARCHAR(20) (`active`, `inactive`)
- **Constraint**: `uq_contractor_shop_code UNIQUE (contractor_id, code)` prevents duplicate shop codes within the same contractor.

### 5. `employees`
Employee records tied to a specific contractor tenant and shop.
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to `auth.users(id)`, UNIQUE)
- `user_profile_id`: UUID (Foreign Key to `user_profiles(id)`, UNIQUE)
- `contractor_id`: UUID (Foreign Key to `contractors(id)`, ON DELETE RESTRICT)
- `shop_id`: UUID (Foreign Key to `shops(id)`, ON DELETE RESTRICT)
- `employee_code`: VARCHAR(50)
- `full_name`: VARCHAR(100)
- `phone`: VARCHAR(20)
- `status`: VARCHAR(20) (`active`, `inactive`, `terminated`)
- **Constraint**: `uq_contractor_employee_code UNIQUE (contractor_id, employee_code)`

### 6. `registration_codes`
Manages single-use activation codes for initial account setup.
- `id`: UUID (Primary Key)
- `code_hash`: VARCHAR(64) (SHA-256 hash of the plaintext code, UNIQUE)
- `role`: VARCHAR(20) (`CONTRACTOR` or `EMPLOYEE`)
- `contractor_id`: UUID (NULL for contractor codes, NOT NULL for employee codes)
- `shop_id`: UUID (NULL for contractor codes, NOT NULL for employee codes)
- `expires_at`: TIMESTAMPTZ
- `is_consumed`: BOOLEAN (DEFAULT FALSE)
- `consumed_at`: TIMESTAMPTZ
- `consumed_by`: UUID (Foreign Key to `auth.users(id)`)
- `metadata`: JSONB
- **Constraints**:
  - `chk_employee_code_target`: Ensures employee codes have valid contractor and shop foreign keys.
  - `chk_consumed_state`: Enforces consistent consumed timestamps and states.

### 7. `audit_logs`
Records critical security, authentication, and administrative actions without logging sensitive data.
- `id`: UUID (Primary Key)
- `actor_id`: UUID (Foreign Key to `auth.users(id)`)
- `action`: VARCHAR(100) (`USER_LOGIN_SUCCESS`, `USER_LOGIN_FAILED`, `ADMIN_BOOTSTRAP`, `ACCOUNT_ACTIVATED`, etc.)
- `entity`: VARCHAR(50)
- `entity_id`: VARCHAR(100)
- `details`: JSONB (No passwords, tokens, or plaintext secrets)
- `ip_address`: VARCHAR(45)
- `created_at`: TIMESTAMPTZ

### 8. `login_attempts`
Extensible rate-limiting table storing recent login attempts.
- `id`: UUID (Primary Key)
- `identifier`: VARCHAR(255) (Normalized username or IP)
- `attempt_time`: TIMESTAMPTZ
- `success`: BOOLEAN
- `ip_address`: VARCHAR(45)

---

## 3. Applying Migrations

### Via Supabase CLI (Local or Linked Remote)
```bash
# Push migrations to linked remote Supabase project
supabase db push

# Or reset local database with all migrations
supabase db reset
```

### Via Supabase Cloud Dashboard SQL Editor
Copy and run each migration in order:
1. `supabase/migrations/20261115000001_create_enums_and_extensions.sql`
2. `supabase/migrations/20261115000002_create_foundational_tables.sql`
3. `supabase/migrations/20261115000003_create_functions_and_triggers.sql`
4. `supabase/migrations/20261115000004_create_rls_policies.sql`
