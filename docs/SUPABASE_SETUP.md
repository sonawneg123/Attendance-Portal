# Supabase Setup & Edge Functions Guide

This document provides step-by-step instructions to configure Supabase, deploy migrations and Edge Functions, and bootstrap the initial permanent Admin account.

---

## 1. Supabase Project Setup

1. Create a new project in the [Supabase Dashboard](https://supabase.com).
2. Retrieve the following credentials from **Project Settings > API**:
   - **Project URL**: (e.g. `https://your-project-id.supabase.co`)
   - **anon / public key**: Safe for browser client application.
   - **service_role key**: Secret key for server-side / Edge Functions only.
3. Link your local CLI to the project (optional if deploying via CLI):
   ```bash
   supabase login
   supabase link --project-ref <your-project-id>
   ```

---

## 2. Deploying Migrations

Run:
```bash
supabase db push
```
Or execute the 4 migration SQL files in sequential order directly in the Supabase Dashboard **SQL Editor**.

---

## 3. Configuring Edge Function Secrets

In the Supabase Dashboard under **Project Settings > Edge Functions** or via the CLI, configure the required secrets:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
supabase secrets set ADMIN_BOOTSTRAP_SECRET="<generate-a-strong-random-secret>"
```

*(Note: `SUPABASE_URL` and `SUPABASE_ANON_KEY` are provided automatically by Supabase runtime).*

---

## 4. Deploying Supabase Edge Functions

Deploy the three server-side functions:

```bash
# 1. Login Function (Username + Password authentication)
supabase functions deploy login --no-verify-jwt

# 2. Account Activation Function (First-time registration code consumption)
supabase functions deploy activate-account --no-verify-jwt

# 3. Admin Bootstrap Function (One-time secure initialization)
supabase functions deploy bootstrap-admin --no-verify-jwt
```

---

## 5. Bootstrapping the Permanent Admin Account

The system permits **exactly one permanent Admin account**. There is **no public Admin signup**.

### Option A: Using the CLI Script
Ensure `.env` contains the required values or pass them in the environment:

```bash
SUPABASE_URL="https://your-project-id.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>" \
ADMIN_USERNAME="admin" \
ADMIN_PASSWORD="<YourSecurePassword123!>" \
ADMIN_FULL_NAME="System Administrator" \
node scripts/bootstrap-admin.js
```

### Option B: Calling the `bootstrap-admin` Edge Function
Send a POST request with the secret header `x-bootstrap-secret`:

```bash
curl -X POST 'https://your-project-id.supabase.co/functions/v1/bootstrap-admin' \
  -H 'Content-Type: application/json' \
  -H 'x-bootstrap-secret: <ADMIN_BOOTSTRAP_SECRET>' \
  -d '{
    "username": "admin",
    "password": "<YourSecurePassword123!>",
    "full_name": "System Administrator"
  }'
```

**Security Guarantees:**
- If an admin account already exists, the function returns HTTP 409 Conflict.
- The database table `admin_profiles` has a unique constraint `uq_admin_profiles_singleton UNIQUE (singleton_guard)` which blocks any second row at the engine level.
- The trigger `trg_user_profiles_single_admin` rejects any additional user with `role = 'ADMIN'`.

---

## 6. Generating Registration Codes

To generate single-use registration codes for contractors or employees:

```bash
# For Contractor:
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ROLE=CONTRACTOR node scripts/generate-registration-code.js

# For Employee:
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ROLE=EMPLOYEE CONTRACTOR_ID=<uuid> SHOP_ID=<uuid> node scripts/generate-registration-code.js
```

- Give the plaintext code to the contractor or employee.
- The database stores **only** the SHA-256 hash.
- Upon activation at `/activate`, the code is atomically consumed and cannot be reused.
