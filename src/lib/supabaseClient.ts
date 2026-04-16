import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://vdpuhpnwihpzmwjjsatj.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkcHVocG53aWhwem13ampzYXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MTI3NTEsImV4cCI6MjA5MDk4ODc1MX0.mpMyP2sHxq1ONAUEFHRT0grUGDdMs0K_rLhBSbYiBR4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
});

export default supabase;
