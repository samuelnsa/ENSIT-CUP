import { createClient } from '@supabase/supabase-js';

// Variables d'environnement requises : VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Variables Supabase manquantes. Configurez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local'
  );
}

export const clientSupabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export type ClientSupabase = typeof clientSupabase;
