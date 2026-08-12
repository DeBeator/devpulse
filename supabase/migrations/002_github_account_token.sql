-- Add access_token to github_accounts
alter table public.github_accounts
  add column if not exists access_token text;

-- Allow users to insert/update their own github account
create policy "Users can insert own github account"
  on public.github_accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own github account"
  on public.github_accounts for update
  using (auth.uid() = user_id);
