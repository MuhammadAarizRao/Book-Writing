// =========================================================
// SUPABASE CONFIG
// Fill these in from your Supabase project:
// Supabase Dashboard → Project Settings → API
//   - Project URL          -> SUPABASE_URL
//   - anon / public API key -> SUPABASE_ANON_KEY
//
// The anon key is safe to expose in client-side code AS LONG AS
// Row Level Security (RLS) is enabled on your tables (see the
// SQL + policies in supabase-setup.sql). Never put your
// "service_role" key here — that one must stay server-side only.
// =========================================================

const SUPABASE_URL = 'https://huwtkrtogxuomiwfpozw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1d3RrcnRvZ3h1b21pd2Zwb3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MDcyMDUsImV4cCI6MjA5OTM4MzIwNX0.Xb34iFj9rArJPNplBpSYRldJFJikDP_L5g9Xxd71PXE';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
