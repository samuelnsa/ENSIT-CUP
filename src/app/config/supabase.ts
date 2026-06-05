import { createClient } from '@supabase/supabase-js';

// Variables d'environnement requises : VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const missingConfig = !supabaseUrl || !supabaseAnonKey;
if (missingConfig) {
  console.error(
    '⚠️ Configuration Supabase manquante. Configurez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local ou dans les variables d’environnement de la plateforme.'
  );
}

export const clientSupabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function ensureSupabaseConfig() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Configuration Supabase manquante : ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans les variables d’environnement.'
    );
  }
}

export type ClientSupabase = typeof clientSupabase;
