import { createClient } from '@supabase/supabase-js';

// Pull your verified Vercel Environment strings natively
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a unified database engine for your screens
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
