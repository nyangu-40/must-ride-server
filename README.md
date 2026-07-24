# MUST Ride Registration System

A complete registration application for MUST Ride trips with online payment integration using PayChangu and Supabase.

## Project Structure

- `client/` - React frontend built with Vite and Tailwind CSS
- `server/` - Express backend with Supabase database integration
- `.env.example` - example environment variables

## Features

- Landing page and registration page
- Payment checkout generation via PayChangu
- Secure webhook support for payment verification
- Admin dashboard with totals, search, and CSV export
- Supabase-backed registration storage

## Installation

1. Clone the repository.
2. Install frontend dependencies:
   ```bash
   cd client
   npm install
   ```
3. Install backend dependencies:
   ```bash
   cd ../server
   npm install
   ```

## Running the application

### Frontend

```bash
cd client
npm run dev
```

### Backend

```bash
cd server
npm run dev
```

## Supabase Setup

1. Create a Supabase project.
2. Add the following table using SQL.

```sql
create table registrations (
  id uuid default uuid_generate_v4() primary key,
  fullname text not null,
  phone text not null,
  pickup_location text not null,
  destination text not null,
  seats int not null,
  amount numeric not null,
  payment_status text not null default 'Pending',
  payment_reference text,
  payment_date timestamp,
  created_at timestamp not null default now()
);
```

3. Set backend environment variables in `.env`:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PAYCHANGU_SECRET_KEY=
PAYCHANGU_PUBLIC_KEY=
PAYCHANGU_WEBHOOK_SECRET=
PORT=5000
FRONTEND_URL=http://localhost:5173
```

4. Set frontend environment variables in `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_SUPABASE_URL=https://iiukqnepiwekeuqiuwgg.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_6dVGlaLFWQvvLJFLsoM17Q_aW4SMU9A
```

> Note: The frontend uses the backend API for registration and payment. The Supabase public values are available for browser-side integrations if you choose to add direct Supabase access later.

## PayChangu Integration

- Use `PAYCHANGU_SECRET_KEY` for server requests
- Use `PAYCHANGU_WEBHOOK_SECRET` for webhook verification
- The backend calculates the amount and creates the checkout session

## Deployment

### Frontend

- Deploy `client/` to Vercel or Netlify
- Ensure `VITE_API_BASE_URL` points to the deployed backend

### Backend

- Deploy `server/` to Render or Railway
- Set environment variables in your deployment provider

## API Endpoints

- `POST /api/register` - optional registration endpoint
- `POST /api/payment` - create registration and payment checkout
- `POST /webhook/paychangu` - PayChangu webhook endpoint
- `GET /api/registrations` - list registrations
- `GET /api/registration/:id` - fetch registration by id

## Notes

- The frontend never sends the amount; backend computes it.
- Webhook requests are verified using the signature header.
- Ensure webhook route is publicly accessible and configured in PayChangu.
