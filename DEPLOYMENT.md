# Deployment Guide

End-to-end guide for deploying NStil to cloud services and distributing the iOS app via Ad Hoccreate or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
    insert into public.profiles (id)
    values (new.id);

    insert into public.journals (user_id, name, sort_order)
    values (new.id, 'My Journal', 0);

    insert into public.user_ai_profiles (user_id)
    values (new.id);

    insert into public.user_notification_preferences (user_id)
    values (new.id);

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();.

---

## Cloud Services Overview

| Service | Role | Dashboard | Free Tier |
|---------|------|-----------|-----------|
| **Supabase** | Postgres database, Auth (email/password, JWT), Storage | https://supabase.com/dashboard | Yes |
| **Upstash** | Managed Redis (TLS) for caching and rate limiting | https://console.upstash.com | Yes |
| **Render** | Docker hosting for the FastAPI backend | https://dashboard.render.com | Yes |
| **EAS (Expo)** | Cloud builds and Ad Hoc distribution for iOS/Android | https://expo.dev | Yes (limited builds/month) |

### Architecture in Production

```
iPhone
  └─▶ NStil app (installed via EAS Ad Hoc)
        ├─▶ Supabase Cloud (auth + database)
        └─▶ Render (FastAPI backend)
              ├─▶ Supabase Cloud (data queries via service_role)
              └─▶ Upstash Redis (cache + rate limiting)
```

---

## Prerequisites

- Apple Developer account ($99/year) — required for Ad Hoc distribution
- GitHub repo connected to Render
- Accounts on Supabase, Upstash, Render, and Expo (EAS)
- `supabase` CLI, `eas-cli`, and `just` installed locally

---

## Step 1: Supabase Cloud

### 1.1 Create Project

1. Go to https://supabase.com/dashboard → New Project
2. Pick a region, set a database password, note the **project ref** (e.g. `abcdefghijklmnop`)

### 1.2 Link and Push Migrations

```bash
supabase login
supabase link --project-ref <your-ref>
supabase db reset --linked
```

This wipes the cloud database and applies all migrations from `supabase/migrations/` in order. Migration `010_ROLE_GRANTS.sql` grants the necessary Postgres permissions to `anon`, `authenticated`, and `service_role` roles.

> **Gotcha:** If you see `permission denied for table ...` after pushing migrations, the role grants didn't apply. Run the contents of `010_ROLE_GRANTS.sql` manually in the Supabase SQL Editor.

### 1.3 Configure Auth

Go to Supabase Dashboard → Authentication → URL Configuration:

| Setting | Value |
|---------|-------|
| Site URL | `nstil://` |
| Redirect URLs | `nstil://verify-email`, `nstil://reset-password` |

### 1.4 Collect Keys

Go to Supabase Dashboard → Settings → API:

| Key | Format | Where It's Used |
|-----|--------|-----------------|
| **Project URL** | `https://<ref>.supabase.co` | Backend `SUPABASE_URL`, Mobile `EXPO_PUBLIC_SUPABASE_URL` |
| **anon (public)** | `eyJ...` (JWT with `"role":"anon"`) | Mobile `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role (secret)** | `eyJ...` (JWT with `"role":"service_role"`) | Backend `SUPABASE_SERVICE_KEY` — **never expose client-side** |

Go to Settings → API → JWT Settings (Legacy JWT Secret section):

| Key | Format | Where It's Used |
|-----|--------|-----------------|
| **JWT Secret** | Long base64 string | Backend `SUPABASE_JWT_SECRET` |

> **Common mistake:** The JWT Secret is NOT the "Key ID" (UUID). It's the actual signing key — a long random string.

---

## Step 2: Upstash Redis

1. Go to https://console.upstash.com → Create Database
2. Pick a region close to your Render region (e.g. `us-east-1`)
3. Enable TLS/SSL
4. Copy the connection URL — click the eye icon to reveal the password

The `REDIS_URL` format for the backend:

```
rediss://default:<password>@<endpoint>.upstash.io:6379
```

> **Note:** `rediss://` (double `s`) enables TLS. The Python `redis` client uses this to negotiate a secure connection.

---

## Step 3: Deploy Backend on Render

### 3.1 Create Web Service

1. Render Dashboard → New → Web Service → connect your GitHub repo
2. **Name:** `nstil-api`
3. **Root Directory:** `apps/backend`
4. **Runtime:** Docker

### 3.2 Environment Variables

Set these in the Render dashboard (Environment tab):

| Variable | Value | Description |
|----------|-------|-------------|
| `SUPABASE_URL` | `https://<ref>.supabase.co` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | `eyJ...` (service_role JWT) | Bypasses RLS for backend queries |
| `SUPABASE_JWT_SECRET` | Long base64 string | Verifies user JWTs (HS256 fallback) |
| `REDIS_URL` | `rediss://default:...@....upstash.io:6379` | Upstash Redis with TLS |
| `CORS_ORIGINS` | `["https://<ref>.supabase.co"]` | Allowed CORS origins |
| `DEBUG` | `false` | Disables debug mode |
| `RATE_LIMIT_ENABLED` | `true` | Enables Redis-backed rate limiting |
| `LOG_FORMAT` | `json` | Structured JSON logs in Render |

### 3.3 Deploy and Verify

Deploy, then verify:

```bash
curl https://nstil-api.onrender.com/api/v1/health
```

Should return HTTP 200.

### 3.4 Logging

Render streams logs from the backend container. Key log events:

| Event | Meaning |
|-------|---------|
| `app.startup` | Backend started successfully |
| `jwks.loaded` | JWKS keys fetched from Supabase (refreshes every 5 min) |
| `http.request.started` | Incoming request |
| `http.request.completed` | Successful response (includes `http_status`, `duration_ms`) |
| `http.request.failed` | Request errored (includes full exception traceback) |

> **Render free tier:** The service spins down after 15 min of inactivity. First request after spin-down takes ~30–60s (cold start).

---

## Step 4: Build and Distribute the iOS App

### 4.1 EAS Configuration

The file `apps/mobile/eas.json` contains three build profiles:

| Profile | Purpose | Distribution |
|---------|---------|-------------|
| `development` | Dev client for debugging on physical devices | Internal (Ad Hoc) |
| `preview` | Release build for sharing with testers | Internal (Ad Hoc) |
| `production` | App Store / Play Store submission | Store |

All profiles have production environment variables baked in (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL`).

> **Important:** The mobile `.env` file is for local development only. EAS builds use the `env` block in `eas.json`.

### 4.2 Register Devices

Ad Hoc distribution requires registering each device's UDID with Apple:

```bash
cd apps/mobile
eas device:create
```

This generates a URL. Send it to the person → they open it in **Safari** on their iPhone → follow the prompts to install a provisioning profile → their device UDID is registered.

### 4.3 Build

```bash
cd apps/mobile
eas build --platform ios --profile preview
```

EAS will prompt for:
- **Encryption compliance** → Answer `Y` (standard/exempt encryption only — HTTPS)
- **Apple Distribution Certificate** → Answer `Y` to generate one if none exists

The build runs in the cloud (~15–20 min). When done, EAS provides an install URL.

### 4.4 Install

Send the install URL to the recipient. They open it in Safari → tap Install. The app appears on their home screen.

### 4.5 Rebuilding

You need to rebuild (`eas build`) when:
- Code changes in `apps/mobile/`
- Environment variables in `eas.json` change (e.g. new API URL or anon key)
- A new device is registered (the provisioning profile must include their UDID)

You do NOT need to rebuild when:
- Backend code changes (just redeploy on Render)
- Backend environment variables change (just update on Render and redeploy)
- Database migrations are applied

---

## Troubleshooting

### "Something went wrong" on sign-up

1. Check Supabase Dashboard → Logs → Auth for the actual error
2. `email rate limit exceeded` (429) → Wait ~60 min or use a different email (Gmail `+` aliases work: `you+test1@gmail.com`)
3. `Invalid API key` → The anon key in `eas.json` is wrong. Cloud anon keys start with `eyJ...`, not `sb_publishable_...`

### Blank screen after login (only background animation visible)

1. Check Render logs for `http.request.failed` on `/api/v1/profile`
2. `permission denied for table profiles` (42501) → Run the grants from `010_ROLE_GRANTS.sql` in Supabase SQL Editor
3. No Render logs at all → Backend is down (cold start or deploy in progress). Wait and retry.

### "permission denied for table ..." on any table

The Postgres roles don't have grants on tables created by migrations. Run in Supabase SQL Editor:

```sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
```

This is already handled by migration `010_ROLE_GRANTS.sql`, but if you ran `supabase db reset --linked` before that migration existed, you need to apply it manually.

### Backend returns 500 but no useful error

Check the full exception traceback in Render logs. Common causes:
- Wrong `SUPABASE_SERVICE_KEY` (using local key instead of cloud key)
- Wrong `SUPABASE_JWT_SECRET` (using the Key ID instead of the actual secret)
- Redis connection failed (wrong `REDIS_URL` or missing `rediss://` for TLS)

---

## Key Rotation

If any secrets are compromised:

1. **Supabase:** Dashboard → Settings → API → regenerate keys. Update `SUPABASE_SERVICE_KEY` on Render, `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `eas.json`, and `SUPABASE_JWT_SECRET` on Render.
2. **Upstash Redis:** Console → Database → Reset Password. Update `REDIS_URL` on Render.
3. Redeploy Render (env var change triggers redeploy).
4. Rebuild the mobile app if the anon key changed (`eas build --platform ios --profile preview`).

---

## Quick Reference: Deployment Checklist

- [ ] Supabase Cloud project created
- [ ] Migrations pushed (`supabase db reset --linked`)
- [ ] Auth URL configuration set (Site URL + Redirect URLs)
- [ ] Upstash Redis database created
- [ ] Render web service created with correct env vars
- [ ] `curl .../api/v1/health` returns 200
- [ ] `eas.json` has correct cloud anon key and API URL
- [ ] Target devices registered (`eas device:create`)
- [ ] iOS build completed (`eas build --platform ios --profile preview`)
- [ ] App installed and sign-up/login works end-to-end
