-- Allow insert for insights (used by server-side API)
create policy "Users can insert insights for own repositories"
  on public.insights for insert
  with check (
    exists (
      select 1 from public.repositories r
      where r.id = insights.repository_id
      and r.user_id = auth.uid()
    )
  );

create policy "Users can update insights for own repositories"
  on public.insights for update
  using (
    exists (
      select 1 from public.repositories r
      where r.id = insights.repository_id
      and r.user_id = auth.uid()
    )
  );
