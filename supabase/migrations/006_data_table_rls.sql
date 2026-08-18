-- Commits
create policy "Users can insert commits for own repositories"
  on public.commits for insert
  with check (
    exists (
      select 1 from public.repositories r
      where r.id = commits.repository_id
      and r.user_id = auth.uid()
    )
  );

create policy "Users can update commits for own repositories"
  on public.commits for update
  using (
    exists (
      select 1 from public.repositories r
      where r.id = commits.repository_id
      and r.user_id = auth.uid()
    )
  );

-- Pull requests
create policy "Users can insert pull requests for own repositories"
  on public.pull_requests for insert
  with check (
    exists (
      select 1 from public.repositories r
      where r.id = pull_requests.repository_id
      and r.user_id = auth.uid()
    )
  );

create policy "Users can update pull requests for own repositories"
  on public.pull_requests for update
  using (
    exists (
      select 1 from public.repositories r
      where r.id = pull_requests.repository_id
      and r.user_id = auth.uid()
    )
  );

-- Issues
create policy "Users can insert issues for own repositories"
  on public.issues for insert
  with check (
    exists (
      select 1 from public.repositories r
      where r.id = issues.repository_id
      and r.user_id = auth.uid()
    )
  );

create policy "Users can update issues for own repositories"
  on public.issues for update
  using (
    exists (
      select 1 from public.repositories r
      where r.id = issues.repository_id
      and r.user_id = auth.uid()
    )
  );

-- Releases
create policy "Users can insert releases for own repositories"
  on public.releases for insert
  with check (
    exists (
      select 1 from public.repositories r
      where r.id = releases.repository_id
      and r.user_id = auth.uid()
    )
  );

create policy "Users can update releases for own repositories"
  on public.releases for update
  using (
    exists (
      select 1 from public.repositories r
      where r.id = releases.repository_id
      and r.user_id = auth.uid()
    )
  );

-- Contributors
create policy "Users can insert contributors for own repositories"
  on public.contributors for insert
  with check (
    exists (
      select 1 from public.repositories r
      where r.id = contributors.repository_id
      and r.user_id = auth.uid()
    )
  );

create policy "Users can update contributors for own repositories"
  on public.contributors for update
  using (
    exists (
      select 1 from public.repositories r
      where r.id = contributors.repository_id
      and r.user_id = auth.uid()
    )
  );
