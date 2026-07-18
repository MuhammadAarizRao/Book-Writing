-- =========================================================
-- RUN THIS ONCE in Supabase: Dashboard → SQL Editor → New Query
-- =========================================================

-- 1) Table that stores every contact form submission
create table if not exists contact_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  email text not null,
  phone text,
  service text,
  subject text,
  message text not null,
  source_page text,          -- e.g. 'home' or 'contact-us'
  status text default 'new'  -- 'new' | 'contacted' | 'closed'
);

-- 2) Lock the table down, then open only the access we want
alter table contact_submissions enable row level security;

-- Anyone (your public website visitors) can SUBMIT the form
create policy "Public can insert submissions"
  on contact_submissions
  for insert
  to anon
  with check (true);

-- Only logged-in CRM users can VIEW submissions
create policy "Authenticated users can read submissions"
  on contact_submissions
  for select
  to authenticated
  using (true);

-- Only logged-in CRM users can UPDATE status (e.g. mark as contacted)
create policy "Authenticated users can update submissions"
  on contact_submissions
  for update
  to authenticated
  using (true)
  with check (true);

-- Only logged-in CRM users can DELETE submissions
create policy "Authenticated users can delete submissions"
  on contact_submissions
  for delete
  to authenticated
  using (true);

-- =========================================================
-- 3) Create your CRM login
-- Dashboard → Authentication → Users → Add User
-- Add yourself with an email + password. That's what you'll
-- use to log into crm.html. Turn OFF public sign-ups under
-- Authentication → Settings, so no one else can create an
-- account and view your leads.
-- =========================================================
