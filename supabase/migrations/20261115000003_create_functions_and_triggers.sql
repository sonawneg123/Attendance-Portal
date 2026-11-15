-- ========================================================
-- Migration: 20261115000003_create_functions_and_triggers.sql
-- Description: Helper functions, security triggers, and rate-limiting procedures
-- ========================================================

-- 1. Helper function to get current user's role securely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS VARCHAR AS $$
  SELECT role FROM public.user_profiles 
  WHERE user_id = auth.uid() 
    AND status = 'active'
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;


-- 2. Helper function to get current user's contractor ID (if contractor)
CREATE OR REPLACE FUNCTION public.get_current_user_contractor_id()
RETURNS UUID AS $$
  SELECT id FROM public.contractors 
  WHERE user_id = auth.uid() 
    AND status = 'active'
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;


-- 3. Helper function to get contractor ID for an employee user
CREATE OR REPLACE FUNCTION public.get_current_employee_contractor_id()
RETURNS UUID AS $$
  SELECT contractor_id FROM public.employees 
  WHERE user_id = auth.uid() 
    AND status = 'active'
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;


-- 4. Helper function to get shop ID for an employee user
CREATE OR REPLACE FUNCTION public.get_current_employee_shop_id()
RETURNS UUID AS $$
  SELECT shop_id FROM public.employees 
  WHERE user_id = auth.uid() 
    AND status = 'active'
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;


-- 5. Trigger to strictly enforce SINGLE permanent Admin account
CREATE OR REPLACE FUNCTION public.enforce_single_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'ADMIN' THEN
    IF EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE role = 'ADMIN' 
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'A second Admin account cannot be created. Exactly one permanent Admin is permitted.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_user_profiles_single_admin
  BEFORE INSERT OR UPDATE OF role ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_admin();


-- 6. Prevent deletion of permanent Admin account
CREATE OR REPLACE FUNCTION public.prevent_admin_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = 'ADMIN' THEN
    RAISE EXCEPTION 'Permanent Admin account cannot be deleted.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_user_profiles_prevent_admin_delete
  BEFORE DELETE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_admin_deletion();


-- 7. Extensible Rate Limiting function for login attempts
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier VARCHAR,
  p_ip_address VARCHAR,
  p_max_attempts INT DEFAULT 5,
  p_window_seconds INT DEFAULT 900 -- 15 minutes window
)
RETURNS BOOLEAN AS $$
DECLARE
  v_failed_count INT;
  v_window_start TIMESTAMPTZ := timezone('utc'::text, now()) - (p_window_seconds || ' seconds')::INTERVAL;
BEGIN
  -- Count failed attempts within window for this identifier or IP
  SELECT COUNT(*) INTO v_failed_count
  FROM public.login_attempts
  WHERE (identifier = LOWER(p_identifier) OR (p_ip_address IS NOT NULL AND ip_address = p_ip_address))
    AND attempt_time >= v_window_start
    AND success = FALSE;

  IF v_failed_count >= p_max_attempts THEN
    RETURN FALSE; -- Rate limited
  END IF;

  RETURN TRUE; -- Within limits
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
