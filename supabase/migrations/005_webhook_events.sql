-- Add RLS policies for webhook_events
alter table public.webhook_events enable row level security;

-- webhook_events are inserted by the server (service role)
-- Users can view their own webhook events
create policy "Users can view webhook events for own repositories"
  on public.webhook_events for select
  using (
    exists (
      select 1 from public.repositories r
      where r.id = webhook_events.repository_id
      and r.user_id = auth.uid()
    )
  );

-- Add missing columns to webhook_events
alter table public.webhook_events
  add column if not exists event_type text,
  add column if not exists action text,
  add column if not exists github_delivery_id text unique,
  add column if not exists processed boolean default false,
  add column if not exists processed_at timestamptz,
  add column if not exists error text;

create index if not exists idx_webhook_events_repository_id
  on public.webhook_events(repository_id);

create index if not exists idx_webhook_events_github_delivery_id
  on public.webhook_events(github_delivery_id);

create index if not exists idx_webhook_events_processed
  on public.webhook_events(processed);
