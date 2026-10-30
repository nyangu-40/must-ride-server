# Tiyende Bookings

Multi-tenant bus booking with a React/Vite passenger app, an Express API, Supabase
storage and authentication, and PayChangu hosted checkout.

## Setup

1. Copy `.env.example` to `.env` at the repository root and fill in the Supabase
   and PayChangu credentials. Keep service-role and PayChangu secret keys server-only.
2. Install dependencies:

   ```powershell
   cd server
   npm install
   cd ..\client
   npm install
   ```

3. Configure the Supabase browser values in the root `.env` as
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The service-role key must
   never use a `VITE_` prefix.
4. Apply `server/database/migrations/002_multitenant.sql` to the Supabase project.
   The migration backfills existing registrations to the default Mpoto Ride
   organiser and creates paid-registration ledger rows and occupied seats.
5. Set `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD`, then run:

   ```powershell
   cd server
   npm run seed:superadmin
   ```

   The seed ensures the superadmin profile exists and applies `PRICE_PER_SEAT`
   (default MWK 10,000) to the default trip.
6. Configure the PayChangu callback URL as `SERVER_URL/webhook/paychangu`.

The migration intentionally leaves the default historical trip's departure time
unset because no legacy departure time exists. Set its date in the organiser
dashboard before publishing it for a scheduled trip. Roll back with
`server/database/migrations/002_multitenant_rollback.sql` only if you intend to
remove the multitenant schema and its data.

## Run locally

Start the API from `server/`:

```powershell
npm run dev
```

Start the client from `client/`:

```powershell
npm run dev
```

The client listens on port 5173 and the API defaults to port 5000. Set
`FRONTEND_URL` and `SERVER_URL` to the public frontend and backend origins when
deploying. CORS allows only `FRONTEND_URL`.

## Environment variables

See `.env.example` for the complete placeholder list. Required server values:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_URL`, `SERVER_URL`

PayChangu credentials are only required for payment and webhook operations. The
API can start without them, but checkout and payment verification will return a
configuration error until `PAYCHANGU_SECRET_KEY` is set. Configure
`PAYCHANGU_WEBHOOK_SECRET` to accept signed PayChangu webhook notifications.

`SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD` are needed only to seed the
superadmin. `PAYOUTS_ENABLED` defaults to `false`; enable it only after PayChangu
payouts have been activated for the account. To allow organizers to withdraw
from their Wallet page, configure `PAYCHANGU_SECRET_KEY` and
`PAYCHANGU_WEBHOOK_SECRET`, set `PAYOUTS_ENABLED=true` in the server's deployment
environment, and restart/redeploy the server. PayChangu must have payouts
activated for the account; its payout notification URL is
`SERVER_URL/webhook/paychangu/payout`. Organizers can then choose a withdrawal
amount and send it to mobile money or a bank account. Pending withdrawals reserve
the requested amount until PayChangu confirms success or failure. Do not enable
the flag before the provider account and credentials are ready.

`IMPERSONATION_SECRET` is needed for short-lived, read-only platform-admin
view-as sessions. Never commit actual environment values.
`MIN_PAYMENT_AMOUNT` sets the minimum per-seat amount for flexible trips and
defaults to MWK 100.

New organizer invites start with an expired subscription until a superadmin
records an extension. The backfilled Mpoto Ride organizer keeps its existing
`active_until` value and can be extended from the platform dashboard.

## Main endpoints

- Public tenant pages: `GET /api/public/organizers/:slug`
- Trip seats and payment: `GET /api/public/trips/:tripId/seats`,
  `POST /api/public/trips/:tripId/payment`
- Receipts and confirmation: `GET /api/registration/:id/receipt`,
  `POST /api/registration/:id/confirm-payment`
- Login: `POST /api/auth/login` (Supabase email/password)
- Organizer APIs: `/api/organizer/*`
- Platform-admin APIs: `/api/platform/*`
- PayChangu notifications: `/webhook/paychangu`

Prices are computed from the trip row. Verified successful payments update a
registration and credit its organiser's internal ledger in one database
transaction. Organiser balances are ledger-derived; pending withdrawals reserve
available balance through a row-locked database function. Service-role API
queries explicitly scope organiser data by the authenticated organiser.
