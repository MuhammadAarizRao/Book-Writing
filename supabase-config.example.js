// =========================================================
// SUPABASE CONFIG — EXAMPLE
// This file IS committed to the repo as a template.
// The real file (supabase-config.js) is gitignored and
// stays only on your machine / your hosting.
//
// To set up:
//   1. Copy this file and rename the copy to supabase-config.js
//   2. Fill in your real values from:
//      Supabase Dashboard → Project Settings → API
// =========================================================

const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-PUBLIC-KEY';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
