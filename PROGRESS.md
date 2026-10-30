# Multitenant Must Ride Progress

NEXT STEP: Resume Part C by checking the current UI diff, finishing remaining design-token cleanup, then build/test and update this file.

## Requested upgrades — Part A: Organizer signup and approval

- Status: Complete in code; migration not applied to the live Supabase project.
- Files: `server/database/migrations/003_organizer_signup.sql`, `server/database/migrations/003_organizer_signup_rollback.sql`, `server/services/organizerSlug.js`, public/platform/organizer controllers and routes, `server/middleware/requireAuth.js`; `client/src/pages/OrganizerSignupPage.jsx`, `client/src/pages/OrganizerApplicationStatus.jsx`, `client/src/pages/PlatformAdmin.jsx`, `client/src/App.jsx`, auth provider/guard/login and public organizer page.
- Environment variables: No new variables.
- Commands: Apply migration 003 after 002 using Supabase SQL Editor. Roll back only with `server/database/migrations/003_organizer_signup_rollback.sql`. Local validation: `cd server; npm test`; syntax-check server JS; `cd ..\client; npm run build`; `git diff --check`.
- Known issues: Live signup/approval/RLS checks need the migration applied. New signup creates a confirmed Supabase Auth user so password login is immediately available; organizer operations remain blocked until approval.
- Summary 1/3: Added status/approval columns, reserved-slug database rule, subscription/audit approval RPCs, and transactional migration rollback.
- Summary 2/3: Added rate-limited signup and slug availability, auth-user/profile/organizer cleanup on failures, organizer status endpoint, and API restrictions for pending/rejected applications.
- Summary 3/3: Added signup preview/form, approval status screen, public unavailable state, and platform applications view with approval/rejection actions and badge. Server tests, syntax checks, client build, and diff checks pass.

## Requested upgrades — Part B: Pricing modes per trip

- Status: Complete in code; migration and database smoke test need live Supabase access.
- Files: `server/database/migrations/003_organizer_signup.sql` (pricing columns and atomic flexible booking RPC), `server/database/migrations/003_organizer_signup_rollback.sql`, `server/database/tests/003_signup_pricing_smoke.sql`, `server/services/tripPricing.js`, public/organizer/receipt controllers, `server/config/index.js`, `.env.example`, `README.md`; `client/src/pages/OrganizerDashboard.jsx`, `client/src/pages/PublicOrganizerPage.jsx`, `client/src/pages/RegisterPage.jsx`, `client/src/pages/ReceiptPage.jsx`, `server/tests/paymentVerification.test.js`.
- Environment variables: Added `MIN_PAYMENT_AMOUNT` (default MWK 100).
- Commands: Apply migration 003 after 002; run `server/database/tests/003_signup_pricing_smoke.sql` in Supabase SQL Editor. Run `cd server; npm test`, server syntax checks, `cd ..\client; npm run build`, and `git diff --check`.
- Known issues: The SQL smoke test has not run without the migrated Supabase project. Flexible price is persisted on registration and verified from its stored amount; client-supplied total fields are ignored.
- Summary 1/3: Added fixed/flexible trip fields, per-seat minimum/maximum and server-configured minimum payment; DB booking RPC revalidates amount under trip lock.
- Summary 2/3: Added server-side amount calculation, exact amount storage/verification, receipt details, and tests for lower/upper limits, total tampering, fixed price source, and paid amount.
- Summary 3/3: Added organizer pricing controls and passenger range input/quick-picks/live total; public and organizer trip listings display fixed or starting prices. Six server tests and client build pass.

## Requested upgrades — Part C: Mobile-first SaaS redesign

- Status: In progress; work in this chunk has not been build-validated.
- Files: `client/src/components/ui.jsx`, `client/src/pages/PlatformHomePage.jsx`, `client/src/App.jsx`, `client/src/main.jsx`, `client/src/index.css`, `client/tailwind.config.js`, `client/src/layouts/Layout.jsx`, `client/src/pages/PublicOrganizerPage.jsx`, `client/src/pages/RegisterPage.jsx`, `client/src/pages/ReceiptPage.jsx`, `client/src/pages/OrganizerDashboard.jsx`, `client/src/pages/PlatformAdmin.jsx`, `client/src/utils/branding.js`; removed the old single-organizer landing component.
- Environment variables: No new variables.
- Commands: From `client/`, run `npm run build`; dependency additions are `lucide-react` and `@fontsource/inter`.
- Known issues: Part C changes from the current work session still need a client build, server tests, and `git diff --check`. Platform-admin and organizer dashboard styling cleanup is partial. Live Supabase migrations and SQL smoke tests still need an applied project.
- Summary 1/3: Added Inter font assets, emerald brand CSS/Tailwind tokens, accessible reusable UI primitives, and a wider app container.
- Summary 2/3: Replaced `/` with the SaaS marketing home, responsive CTAs, feature grid, trust messaging, onboarding steps, and FAQ.
- Summary 3/3: Platform-admin pages now use light content surfaces while retaining the dark sidebar; the organizer workspace has responsive sidebar/bottom navigation, onboarding checklist, link copy, and QR preview. Booking now has a Details → Seats → Pay stepper and mobile sticky payment summary; receipts support PDF download and sharing; public pages show secure-payment badges; dynamic brand text color now uses WCAG luminance comparison. These latest edits have not yet been validated.

## Stage checklist

- [x] Stage 2 — Database schema, rollback, RPCs, RLS, and superadmin seed written (migration not applied).
- [x] Stage 3 — JWT authentication, role middleware, shared-token removal, and Express hardening.
- [x] Stage 4 — Tenant public pages, trip seat holds, and verified payment confirmation.
- [x] Stage 5 — Tenant-scoped organiser APIs.
- [x] Stage 6 — Branded passenger experience.
- [x] Stage 7 — Organiser dashboard.
- [x] Stage 8 — Payout workflows behind a feature flag.
- [x] Stage 9 — Platform administration and read-only view-as.
- [ ] Stage 10 — Validation, tests, and documentation (in progress).

## Stage 2 — Database

- Files: `server/database/migrations/002_multitenant.sql`, `server/database/migrations/002_multitenant_rollback.sql`, `server/scripts/seedSuperadmin.js`, `server/package.json`.
- Environment variables: `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD`, `PRICE_PER_SEAT`.
- Commands: Apply the migration using Supabase SQL Editor; from `server/`, run `npm run seed:superadmin`; rollback with `server/database/migrations/002_multitenant_rollback.sql` only if intentionally removing tenant data.
- Known issues: Migration has not been applied to a live Supabase project. The default legacy trip departure is null because none existed.
- Summary 1/3: Added transactional idempotent tenant schema and backfilled registrations, paid seats, and one sale per paid registration.
- Summary 2/3: Added booking/seat hold, payment/ledger, payout reservation/settlement, and subscription-extension RPCs plus RLS.
- Summary 3/3: Added rollback and env-driven superadmin seed; seed applies configured `PRICE_PER_SEAT`.

## Stages 3–9 — Application

- Files: Server auth/public/organizer/payout/platform controllers, services, routes and middleware; client auth, passenger pages, organiser/platform dashboards; `server/package.json`, `client/package.json`, lockfiles.
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `PAYOUTS_ENABLED`, `PAYCHANGU_PAYOUTS_URL`, `IMPERSONATION_SECRET`, plus `SERVER_URL`, `PRICE_PER_SEAT`, `SUPERADMIN_EMAIL`, and `SUPERADMIN_PASSWORD`.
- Commands: Install from each project folder with `npm install`. Run client `npm run build`; start API with `npm run dev` from `server/`.
- Known issues: No live database/provider verification yet. PayChangu payout and balance endpoint paths/request formats require confirmation against an activated account.
- Stage 3 summary (1/3): Supabase Auth validates bearer sessions; organizer/superadmin roles come from database profiles.
- Stage 3 summary (2/3): Removed ADMIN_TOKEN and protected/remapped legacy global mutation endpoints.
- Stage 3 summary (3/3): Tight CORS, Helmet, login/payment rate limits applied.
- Stage 4 summary (1/3): Added public organiser branding/trips and trip-specific seat availability.
- Stage 4 summary (2/3): Atomic 10-minute seat holds and server-side trip-row pricing.
- Stage 4 summary (3/3): Payment redirect/webhook/confirm verify status, transaction reference, amount, and MWK currency before transactional idempotent ledger credit.
- Stage 5 summary (1/3): Added trip CRUD with rent expiry restrictions on creating/publishing.
- Stage 5 summary (2/3): Added registration, passenger, seat map, and delete/edit APIs, explicitly filtered by authenticated organizer and trip.
- Stage 5 summary (3/3): Added branding, wallet, transactions, and subscription APIs.
- Stage 5 follow-up: Registration deletion now uses a locked RPC and is blocked for paid bookings or active checkout holds; paid seat changes are rejected.
- Stage 6 summary (1/3): Replaced hardcoded passenger booking configuration with organizer/trip data.
- Stage 6 summary (2/3): Added branded receipt, optional passenger email, and friendly expired booking page.
- Stage 6 summary (3/3): `/register` redirects to the default organizer's public trips.
- Stage 7 summary (1/3): Added Supabase login context and role guards.
- Stage 7 summary (2/3): Added organizer overview, trip creation/status, registrations/seat map, wallet, branding preview, account page, QR link.
- Stage 7 summary (3/3): Added scoped exports and loading/empty/error UI states.
- Stage 8 summary (1/3): Organizer payout requests reserve balance with an organizer-row-locked RPC.
- Stage 8 summary (2/3): Added flag-gated lookups and payout initialization.
- Stage 8 summary (3/3): Added callback settlement; reversal credits offset an existing payout debit on later failure.
- Stage 8 follow-up: Completed payouts cannot be downgraded by late callbacks; provider balance reconciliation is disabled with payout APIs.
- Stage 9 summary (1/3): Added platform metrics, organizer invites/status/subscription actions, and global ledger/payout APIs.
- Stage 9 summary (2/3): Added reconciliation, audit events, and platform screens.
- Stage 9 summary (3/3): View-as token expires after 15 minutes, blocks non-GET API requests, and audits each read.

## Stage 10 — Hardening

- Files: `README.md`, `.env.example`, `PROGRESS.md`.
- Environment variables: Added placeholders for client/server Supabase keys, PayChangu, payouts, superadmin seed, and impersonation.
- Commands:
  - From the repository root in PowerShell:
    ```powershell
    cd server
    npm test
    Get-ChildItem -Recurse -Filter *.js | Where-Object { $_.FullName -notmatch '\\node_modules\\' } | ForEach-Object { node --check $_.FullName }
    cd ..\client
    npm run build
    cd ..
    git diff --check
    ```
  - Apply `server/database/migrations/002_multitenant.sql` in the Supabase SQL Editor, then run `server/database/tests/002_multitenant_smoke.sql` there. Seed with `cd server; npm run seed:superadmin`. Roll back only with `server/database/migrations/002_multitenant_rollback.sql`.
- Known issues: Local tests/build pass. `psql` is unavailable and live SQL/RLS/RPC behavior is unverified without Supabase project access. PayChangu payout and balance paths are provisional pending provider documentation/account verification; keep `PAYOUTS_ENABLED=false`.
- Summary 1/3: Rewrote setup guide without committed Supabase values.
- Summary 2/3: Added DB smoke checks for tenant boundary, paid-ledger idempotency, payout locking, double booking, and protection of active/paid registrations.
- Summary 3/3: Client production build, all server tests, JavaScript syntax checks, and `git diff --check` pass; live provider/database checks remain.
