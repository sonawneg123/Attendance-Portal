-- ========================================================
-- Migration: 20261115000002_create_foundational_tables.sql
-- Description: Create all 7 foundational tables with constraints, indexes and foreign keys
-- ========================================================

-- 1. USER PROFILES
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'CONTRACTOR', 'EMPLOYEE')),
  internal_auth_email VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_username_format CHECK (username ~* '^[a-zA-Z0-9_-]{3,50}$')
);

-- Case-insensitive unique index for usernames
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_username_lower 
  ON public.user_profiles (LOWER(username));

CREATE INDEX IF NOT EXISTS idx_user_profiles_role 
  ON public.user_profiles (role);

CREATE INDEX IF NOT EXISTS idx_user_profiles_status 
  ON public.user_profiles (status);


-- 2. ADMIN PROFILES
-- Guaranteed exactly one permanent admin account via singleton_guard UNIQUE constraint
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_profile_id UUID NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  full_name VARCHAR(100) NOT NULL DEFAULT 'System Administrator',
  singleton_guard BOOLEAN NOT NULL DEFAULT TRUE CHECK (singleton_guard = TRUE),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_admin_profiles_singleton UNIQUE (singleton_guard)
);


-- 3. CONTRACTORS (Tenants)
CREATE TABLE IF NOT EXISTS public.contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  user_profile_id UUID NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_contractors_user_id 
  ON public.contractors (user_id);

CREATE INDEX IF NOT EXISTS idx_contractors_status 
  ON public.contractors (status);


-- 4. SHOPS (Per-contractor locations/branches)
CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.contractors(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  address TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_contractor_shop_code UNIQUE (contractor_id, code)
);

CREATE INDEX IF NOT EXISTS idx_shops_contractor_id 
  ON public.shops (contractor_id);

CREATE INDEX IF NOT EXISTS idx_shops_status 
  ON public.shops (status);


-- 5. EMPLOYEES (Linked to contractor and shop)
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  user_profile_id UUID NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES public.contractors(id) ON DELETE RESTRICT,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE RESTRICT,
  employee_code VARCHAR(50) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_contractor_employee_code UNIQUE (contractor_id, employee_code)
);

CREATE INDEX IF NOT EXISTS idx_employees_contractor_id 
  ON public.employees (contractor_id);

CREATE INDEX IF NOT EXISTS idx_employees_shop_id 
  ON public.employees (shop_id);

CREATE INDEX IF NOT EXISTS idx_employees_user_id 
  ON public.employees (user_id);

CREATE INDEX IF NOT EXISTS idx_employees_status 
  ON public.employees (status);


-- 6. REGISTRATION CODES (Single-use, securely hashed)
CREATE TABLE IF NOT EXISTS public.registration_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash VARCHAR(64) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('CONTRACTOR', 'EMPLOYEE')),
  contractor_id UUID REFERENCES public.contractors(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_consumed BOOLEAN NOT NULL DEFAULT FALSE,
  consumed_at TIMESTAMPTZ,
  consumed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_employee_code_target CHECK (
    (role = 'EMPLOYEE' AND contractor_id IS NOT NULL AND shop_id IS NOT NULL) OR
    (role = 'CONTRACTOR')
  ),
  CONSTRAINT chk_consumed_state CHECK (
    (is_consumed = FALSE AND consumed_at IS NULL AND consumed_by IS NULL) OR
    (is_consumed = TRUE AND consumed_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_registration_codes_hash 
  ON public.registration_codes (code_hash);

CREATE INDEX IF NOT EXISTS idx_registration_codes_lookup 
  ON public.registration_codes (code_hash, is_consumed, expires_at);

CREATE INDEX IF NOT EXISTS idx_registration_codes_contractor 
  ON public.registration_codes (contractor_id);


-- 7. AUDIT LOGS (Security and administrative events)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id 
  ON public.audit_logs (actor_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
  ON public.audit_logs (action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
  ON public.audit_logs (created_at DESC);


-- 8. LOGIN ATTEMPTS (For extensible rate limiting)
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(255) NOT NULL,
  attempt_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  success BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier_time 
  ON public.login_attempts (identifier, attempt_time DESC);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time 
  ON public.login_attempts (ip_address, attempt_time DESC);


-- Apply handle_updated_at triggers
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_admin_profiles_updated_at
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_contractors_updated_at
  BEFORE UPDATE ON public.contractors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
