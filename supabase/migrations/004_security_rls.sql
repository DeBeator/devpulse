-- Create security_scans table if not exists
create table if not exists public.security_scans (
  id uuid primary key default uuid_generate_v4(),
  repository_id uuid references public.repositories(id) on delete cascade not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Create security_findings table if not exists
create table if not exists public.security_findings (
  id uuid primary key default uuid_generate_v4(),
  scan_id uuid references public.security_scans(id) on delete cascade not null,
  created_at timestamptz not null default now()
);

alter table public.security_scans enable row level security;
alter table public.security_findings enable row level security;

-- Security scans insert policy
create policy "Users can insert security scans for own repositories"
  on public.security_scans for insert
  with check (
    exists (
      select 1 from public.repositories r
      where r.id = security_scans.repository_id
      and r.user_id = auth.uid()
    )
  );

create policy "Users can update security scans for own repositories"
  on public.security_scans for update
  using (
    exists (
      select 1 from public.repositories r
      where r.id = security_scans.repository_id
      and r.user_id = auth.uid()
    )
  );

-- Security findings insert policy
create policy "Users can insert security findings for own repositories"
  on public.security_findings for insert
  with check (
    exists (
      select 1 from public.security_scans s
      join public.repositories r on r.id = s.repository_id
      where s.id = security_findings.scan_id
      and r.user_id = auth.uid()
    )
  );

-- Add missing columns to security_scans
alter table public.security_scans
  add column if not exists files_scanned integer default 0,
  add column if not exists findings_count integer default 0,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz;

-- Add missing columns to security_findings
alter table public.security_findings
  add column if not exists repository_id uuid references public.repositories(id) on delete cascade,
  add column if not exists file_path text,
  add column if not exists line_number integer,
  add column if not exists secret_type text,
  add column if not exists severity text check (severity in ('critical', 'high', 'medium', 'low')),
  add column if not exists preview text,
  add column if not exists status text default 'open' check (status in ('open', 'resolved', 'dismissed'));

-- Index for findings
create index if not exists idx_security_findings_repository_id
  on public.security_findings(repository_id);

create index if not exists idx_security_findings_scan_id
  on public.security_findings(scan_id);

create index if not exists idx_security_scans_repository_id
  on public.security_scans(repository_id);
