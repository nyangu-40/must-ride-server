import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '../.env');
dotenv.config({ path: envPath });

export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const PAYCHANGU_SECRET_KEY = process.env.PAYCHANGU_SECRET_KEY;
export const PAYCHANGU_PUBLIC_KEY = process.env.PAYCHANGU_PUBLIC_KEY;
export const PAYCHANGU_WEBHOOK_SECRET = process.env.PAYCHANGU_WEBHOOK_SECRET;
export const PORT = process.env.PORT || 5000;
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
export const SERVER_URL = process.env.SERVER_URL || process.env.BACKEND_URL || 'http://localhost:5000';
export const PRICE_PER_SEAT = Number(process.env.PRICE_PER_SEAT) || 40;
export const PAYCHANGU_API_URL = process.env.PAYCHANGU_API_URL || 'https://api.paychangu.com/v1/checkout';
export const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
