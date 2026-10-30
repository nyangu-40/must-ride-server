import path from 'path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(configDirectory, '../../.env');
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
export const PRICE_PER_SEAT = Number(process.env.PRICE_PER_SEAT) || 10000;
export const MIN_PAYMENT_AMOUNT = Number(process.env.MIN_PAYMENT_AMOUNT) || 100;
export const PAYOUTS_ENABLED = process.env.PAYOUTS_ENABLED === 'true';
export const PAYCHANGU_PAYOUTS_URL = process.env.PAYCHANGU_PAYOUTS_URL || 'https://api.paychangu.com/payouts';
export const IMPERSONATION_SECRET = process.env.IMPERSONATION_SECRET || '';