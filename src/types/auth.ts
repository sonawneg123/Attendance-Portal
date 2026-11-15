export type UserRole = 'ADMIN' | 'CONTRACTOR' | 'EMPLOYEE';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'terminated';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  status?: UserStatus;
  full_name?: string;
  contractor_id?: string;
  shop_id?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
}

export interface LoginResponse {
  session: AuthSession;
  user: AuthUser;
}

export interface ActivationPayload {
  registration_code: string;
  username: string;
  password: string;
  password_confirmation: string;
  full_name?: string;
  company_name?: string;
  contact_person?: string;
  phone?: string;
}
