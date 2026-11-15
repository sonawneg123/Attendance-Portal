-- ========================================================
-- Migration: 20261115000004_create_rls_policies.sql
-- Description: Enable and enforce Row Level Security (RLS) on all tables
-- ========================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;


-- --------------------------------------------------------
-- 1. USER_PROFILES POLICIES
-- --------------------------------------------------------

-- Admin has full access
CREATE POLICY "admin_all_user_profiles"
  ON public.user_profiles
  FOR ALL
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN')
  WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- Users can read their own profile
CREATE POLICY "users_read_own_profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Contractor can read employee user profiles belonging to their company
CREATE POLICY "contractor_read_own_employees_profiles"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() = 'CONTRACTOR'
    AND id IN (
      SELECT user_profile_id FROM public.employees 
      WHERE contractor_id = public.get_current_user_contractor_id()
    )
  );


-- --------------------------------------------------------
-- 2. ADMIN_PROFILES POLICIES
-- --------------------------------------------------------

-- Only Admin can view admin profile
CREATE POLICY "admin_read_admin_profile"
  ON public.admin_profiles
  FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN');


-- --------------------------------------------------------
-- 3. CONTRACTORS POLICIES
-- --------------------------------------------------------

-- Admin has full access to contractors
CREATE POLICY "admin_all_contractors"
  ON public.contractors
  FOR ALL
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN')
  WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- Contractor can read only their own contractor record
CREATE POLICY "contractor_read_own_record"
  ON public.contractors
  FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() = 'CONTRACTOR' 
    AND user_id = auth.uid()
  );

-- Contractor can update only their own contractor record
CREATE POLICY "contractor_update_own_record"
  ON public.contractors
  FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_role() = 'CONTRACTOR' 
    AND user_id = auth.uid()
  )
  WITH CHECK (
    public.get_current_user_role() = 'CONTRACTOR' 
    AND user_id = auth.uid()
  );

-- Employee can view only their assigned contractor's company info
CREATE POLICY "employee_read_assigned_contractor"
  ON public.contractors
  FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() = 'EMPLOYEE'
    AND id = public.get_current_employee_contractor_id()
  );


-- --------------------------------------------------------
-- 4. SHOPS POLICIES
-- --------------------------------------------------------

-- Admin has full access to shops
CREATE POLICY "admin_all_shops"
  ON public.shops
  FOR ALL
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN')
  WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- Contractor can manage (SELECT, INSERT, UPDATE, DELETE) only their own shops
CREATE POLICY "contractor_manage_own_shops"
  ON public.shops
  FOR ALL
  TO authenticated
  USING (
    public.get_current_user_role() = 'CONTRACTOR'
    AND contractor_id = public.get_current_user_contractor_id()
  )
  WITH CHECK (
    public.get_current_user_role() = 'CONTRACTOR'
    AND contractor_id = public.get_current_user_contractor_id()
  );

-- Employee can read only their assigned shop
CREATE POLICY "employee_read_assigned_shop"
  ON public.shops
  FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() = 'EMPLOYEE'
    AND id = public.get_current_employee_shop_id()
  );


-- --------------------------------------------------------
-- 5. EMPLOYEES POLICIES
-- --------------------------------------------------------

-- Admin has full access to employees
CREATE POLICY "admin_all_employees"
  ON public.employees
  FOR ALL
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN')
  WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- Contractor can manage (SELECT, INSERT, UPDATE, DELETE) only their own employees
CREATE POLICY "contractor_manage_own_employees"
  ON public.employees
  FOR ALL
  TO authenticated
  USING (
    public.get_current_user_role() = 'CONTRACTOR'
    AND contractor_id = public.get_current_user_contractor_id()
  )
  WITH CHECK (
    public.get_current_user_role() = 'CONTRACTOR'
    AND contractor_id = public.get_current_user_contractor_id()
  );

-- Employee can ONLY read their own employee profile record
CREATE POLICY "employee_read_own_profile"
  ON public.employees
  FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() = 'EMPLOYEE'
    AND user_id = auth.uid()
  );


-- --------------------------------------------------------
-- 6. REGISTRATION_CODES POLICIES
-- --------------------------------------------------------

-- Admin has full access to registration codes
CREATE POLICY "admin_all_registration_codes"
  ON public.registration_codes
  FOR ALL
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN')
  WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- Contractor can view and create codes ONLY for employees under their own contractor ID
CREATE POLICY "contractor_manage_employee_codes"
  ON public.registration_codes
  FOR ALL
  TO authenticated
  USING (
    public.get_current_user_role() = 'CONTRACTOR'
    AND role = 'EMPLOYEE'
    AND contractor_id = public.get_current_user_contractor_id()
  )
  WITH CHECK (
    public.get_current_user_role() = 'CONTRACTOR'
    AND role = 'EMPLOYEE'
    AND contractor_id = public.get_current_user_contractor_id()
  );

-- Employees and Public have NO direct SELECT/INSERT/UPDATE on registration_codes table.


-- --------------------------------------------------------
-- 7. AUDIT_LOGS POLICIES
-- --------------------------------------------------------

-- Only Admin can read audit logs
CREATE POLICY "admin_read_audit_logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN');

-- Logging inserts can be done by authenticated users for their actions
CREATE POLICY "authenticated_insert_audit_logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid());


-- --------------------------------------------------------
-- 8. LOGIN_ATTEMPTS POLICIES
-- --------------------------------------------------------

-- Only Admin can read login attempt logs
CREATE POLICY "admin_read_login_attempts"
  ON public.login_attempts
  FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN');
