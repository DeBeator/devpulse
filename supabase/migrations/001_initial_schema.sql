-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================
-- PROFILES
-- =====================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- =====================
-- GITHUB ACCOUNTS
-- =====================
create table public.github_accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  github_id bigint not null unique,
  github_login text not null,
  github_name text,
  github_avatar_url text,
  github_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.github_accounts enable row level security;

create policy "Users can view own github account"
  on public.github_accounts for select
  using (auth.uid() = user_id);

create index idx_github_accounts_user_id on public.github_accounts(user_id);
create index idx_github_accounts_github_id on public.github_accounts(github_id);

-- =====================
-- REPOSITORIES
-- =====================
create table public.repositories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  github_id bigint not null,
  name text not null,
  full_name text not null,
  description text,
  private boolean not null default false,
  html_url text not null,
  default_branch text not null default 'main',
  language text,
  stargazers_count integer not null default 0,
  forks_count integer not null default 0,
  open_issues_count integer not null default 0,
  last_synced_at timestamptz,
  sync_status text not null default 'pending'
    check (sync_status in ('pending', 'syncing', 'synced', 'error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, github_id)
);

alter table public.repositories enable row level security;

create policy "Users can view own repositories"
  on public.repositories for select
  using (auth.uid() = user_id);

create policy "Users can insert own repositories"
  on public.repositories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own repositories"
  on public.repositories for update
  using (auth.uid() = user_id);

create policy "Users can delete own repositories"
  on public.repositories for delete
  using (auth.uid() = user_id);

create index idx_repositories_user_id on public.repositories(user_id);
create index idx_repositories_github_id on public.repositories(github_id);

-- =====================
-- COMMITS
-- =====================
create table public.commits (
  id uuid primary key default uuid_generate_v4(),
  repository_id uuid references public.repositories(id) on delete cascade not null,
  sha text not null,
  message text not null,
  author_name text,
  author_email text,
  author_github_login text,
  additions integer not null default 0,
  deletions integer not null default 0,
  committed_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(repository_id, sha)
);

alter table public.commits enable row level security;

create policy "Users can view commits of own repositories"
  on public.commits for select
  using (
    exists (
      select 1 from public.repositories r
      where r.id = commits.repository_id
      and r.user_id = auth.uid()
    )
  );

create index idx_commits_repository_id on public.commits(repository_id);
create index idx_commits_committed_at on public.commits(committed_at desc);

-- =====================
-- PULL REQUESTS
-- =====================
create table public.pull_requests (
  id uuid primary key default uuid_generate_v4(),
  repository_id uuid references public.repositories(id) on delete cascade not null,
  github_id bigint not null,
  number integer not null,
  title text not null,
  state text not null check (state in ('open', 'closed')),
  merged boolean not null default false,
  draft boolean not null default false,
  author_github_login text,
  additions integer not null default 0,
  deletions integer not null default 0,
  changed_files integer not null default 0,
  review_comments integer not null default 0,
  opened_at timestamptz not null,
  merged_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(repository_id, github_id)
);

alter table public.pull_requests enable row level security;

create policy "Users can view pull requests of own repositories"
  on public.pull_requests for select
  using (
    exists (
      select 1 from public.repositories r
      where r.id = pull_requests.repository_id
      and r.user_id = auth.uid()
    )
  );

create index idx_pull_requests_repository_id on public.pull_requests(repository_id);
create index idx_pull_requests_state on public.pull_requests(state);
create index idx_pull_requests_opened_at on public.pull_requests(opened_at desc);

-- =====================
-- ISSUES
-- =====================
create table public.issues (
  id uuid primary key default uuid_generate_v4(),
  repository_id uuid references public.repositories(id) on delete cascade not null,
  github_id bigint not null,
  number integer not null,
  title text not null,
  state text not null check (state in ('open', 'closed')),
  author_github_login text,
  labels jsonb not null default '[]',
  opened_at timestamptz not null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(repository_id, github_id)
);

alter table public.issues enable row level security;

create policy "Users can view issues of own repositories"
  on public.issues for select
  using (
    exists (
      select 1 from public.repositories r
      where r.id = issues.repository_id
      and r.user_id = auth.uid()
    )
  );

create index idx_issues_repository_id on public.issues(repository_id);
create index idx_issues_state on public.issues(state);
create index idx_issues_opened_at on public.issues(opened_at desc);

-- =====================
-- RELEASES
-- =====================
create table public.releases (
  id uuid primary key default uuid_generate_v4(),
  repository_id uuid references public.repositories(id) on delete cascade not null,
  github_id bigint not null,
  tag_name text not null,
  name text,
  prerelease boolean not null default false,
  draft boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique(repository_id, github_id)
);

alter table public.releases enable row level security;

create policy "Users can view releases of own repositories"
  on public.releases for select
  using (
    exists (
      select 1 from public.repositories r
      where r.id = releases.repository_id
      and r.user_id = auth.uid()
    )
  );

create index idx_releases_repository_id on public.releases(repository_id);
create index idx_releases_published_at on public.releases(published_at desc);

-- =====================
-- CONTRIBUTORS
-- =====================
create table public.contributors (
  id uuid primary key default uuid_generate_v4(),
  repository_id uuid references public.repositories(id) on delete cascade not null,
  github_login text not null,
  github_id bigint,
  avatar_url text,
  contributions integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(repository_id, github_login)
);

alter table public.contributors enable row level security;

create policy "Users can view contributors of own repositories"
  on public.contributors for select
  using (
    exists (
      select 1 from public.repositories r
      where r.id = contributors.repository_id
      and r.user_id = auth.uid()
    )
  );

create index idx_contributors_repository_id on public.contributors(repository_id);

-- =====================
-- HEALTH SCORES
-- =====================
create table public.health_scores (
  id uuid primary key default uuid_generate_v4(),
  repository_id uuid references public.repositories(id) on delete cascade not null,
  overall integer not null check (overall between 0 and 100),
  activity integer not null check (activity between 0 and 100),
  pull_requests integer not null check (pull_requests between 0 and 100),
  issues integer not null check (issues between 0 and 100),
  security integer not null check (security between 0 and 100),
  releases integer not null check (releases between 0 and 100),
  contributors integer not null check (contributors between 0 and 100),
  documentation integer not null check (documentation between 0 and 100),
  factors jsonb not null default '[]',
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.health_scores enable row level security;

create policy "Users can view health scores of own repositories"
  on public.health_scores for select
  using (
    exists (
      select 1 from public.repositories r
      where r.id = health_scores.repository_id
      and r.user_id = auth.uid()
    )
  );

create index idx_health_scores_repository_id on public.health_scores(repository_id);
create index idx_health_scores_calculated_at on public.health_scores(calculated_at desc);

-- =====================
-- INSIGHTS
-- =====================
create table public.insights (
  id uuid primary key default uuid_generate_v4(),
  repository_id uuid references public.repositories(id) on delete cascade not null,
  severity text not null check (severity in ('critical', 'warning', 'info', 'good')),
  category text not null,
  title text not null,
  description text not null,
  recommendation text,
  evidence jsonb not null default '{}',
  status text not null default 'active'
    check (status in ('active', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.insights enable row level security;

create policy "Users can view insights of own repositories"
  on public.insights for select
  using (
    exists (
      select 1 from public.repositories r
      where r.id = insights.repository_id
      and r.user_id = auth.uid()
    )
  );

create index idx_insights_repository_id on public.insights(repository_id);
create index idx_insights_severity on public.insights(severity);
create index idx_insights_status on public.insights(status);

-- =====================
-- SYNC JOBS
-- =====================
create table public.sync_jobs (
  id uuid primary key default uuid_generate_v4(),
  repository_id uuid references public.repositories(id) on delete cascade not null,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed')),
  started_at timestamptz,
  completed_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

alter table public.sync_jobs enable row level security;

create policy "Users can view sync jobs of own repositories"
  on public.sync_jobs for select
  using (
    exists (
      select 1 from public.repositories r
      where r.id = sync_jobs.repository_id
      and r.user_id = auth.uid()
    )
  );

create index idx_sync_jobs_repository_id on public.sync_jobs(repository_id);
create index idx_sync_jobs_status on public.sync_jobs(status);

-- =====================
-- AUTO-UPDATE updated_at
-- =====================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger handle_updated_at before update on public.github_accounts
  for each row execute function public.handle_updated_at();

create trigger handle_updated_at before update on public.repositories
  for each row execute function public.handle_updated_at();

create trigger handle_updated_at before update on public.pull_requests
  for each row execute function public.handle_updated_at();

create trigger handle_updated_at before update on public.issues
  for each row execute function public.handle_updated_at();

create trigger handle_updated_at before update on public.contributors
  for each row execute function public.handle_updated_at();

create trigger handle_updated_at before update on public.insights
  for each row execute function public.handle_updated_at();

-- =====================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =====================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
