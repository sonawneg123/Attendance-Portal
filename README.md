# हजेरी पोर्टल (Attendance Portal)

> **Sprint 1: Database Foundation, Authentication and Role-Based Access Control**  
> A production-ready, multi-tenant employee attendance and wage management web application.

---

## 1. Project Overview

The **Attendance Portal** (हजेरी पोर्टल) is designed to manage employee attendance and wages across multiple contractors and shops in Maharashtra, India. The application user interface is presented in **Marathi (`mr`)** using the **Noto Sans Devanagari** typography.

This repository represents the completed **Sprint 1** foundation, providing:
- PostgreSQL database schemas with version-controlled migrations.
- Strict multi-tenant Row Level Security (RLS) isolation.
- Single permanent Admin account with database-level singleton protection.
- Username-and-password-only authentication via a server-side Supabase Edge Function (no email login, no OTP, no plaintext passwords).
- Single-use, SHA-256 hashed registration code activation for Contractors and Employees.
- Extensible rate limiting for login attempts.
- Responsive React 18 + TypeScript + Vite + Tailwind CSS frontend with role-aware route protection.

---

## 2. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Lucide Icons.
- **Backend / Database**: Supabase PostgreSQL, Supabase Auth, Supabase Edge Functions (Deno / TypeScript).
- **Security**: PostgreSQL Row Level Security (RLS), SHA-256 Code Hashing, Rate Limiting, Audit Logging.
- **UI Language**: Marathi (`mr`) with Google Font `Noto Sans Devanagari`.
- **Testing**: Vitest automated test suite covering all 12 core requirements.

---

## 3. Application Roles (Sprint 1 Scope)

| Role | Permissions & Characteristics |
|---|---|
| **ADMIN (मुख्य प्रशासक)** | Exactly one permanent account. Created via secure server-side bootstrap only. Can manage all tenants. Has no attendance functionality. |
| **CONTRACTOR (कंत्राटदार)** | Belongs to their own tenant account. Can manage their own shops and employees. First login requires registration code; subsequent logins use username and password. |
| **EMPLOYEE (कर्मचारी)** | Belongs to one contractor and shop. Can view only their own record. First login requires registration code; subsequent logins use username and password. |

*Note: Dashboards for contractors and employees are deferred to Sprint 2 as per project requirements.*

---

## 4. Getting Started Locally

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- Supabase account (or Supabase CLI)

### Installation
1. Clone the repository and enter the directory:
   ```bash
   cd "c:\Attendance Portal"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

4. Start development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 5. Automated Tests

Execute the automated test suite:
```bash
npm test
```

All 12 requirements specified in the project brief are automatically tested and validated.

---

## 6. Documentation Index

- [Database Migrations](docs/MIGRATIONS.md) - Schemas, indexes, RLS policies, and triggers.
- [Supabase Setup & Deployment](docs/SUPABASE_SETUP.md) - Edge Functions, secrets, and admin bootstrap.
- [Automated Testing Guide](docs/TESTING.md) - Test matrices and execution instructions.
- [Environment Configuration](.env.example) - Template for frontend and server-side environment variables.
