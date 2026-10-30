import axios from 'axios';
import { getSupabaseClient, isSupabaseConfigured } from './supabase.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const viewAsToken = window.sessionStorage.getItem('viewAsToken');
  if (viewAsToken) {
    config.headers.Authorization = `Bearer ${viewAsToken}`;
    return config;
  }
  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabaseClient().auth.getSession();
    if (error) throw error;
    if (data.session?.access_token) {
      config.headers.Authorization = `Bearer ${data.session.access_token}`;
    }
  }
  return config;
});

export default api;
