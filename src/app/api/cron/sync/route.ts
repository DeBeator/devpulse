import { createServiceClient } from '@/lib/supabase/service'
import { createGitHubClient } from '@/lib/github/client'
import {
  syncCommits,
  syncPullRequests,
  syncIssues,
  syncReleases,
  syncContributors,
} from '@/lib/github/sync'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Verify this is called by Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Get all repositories
  const { data: repositories } = await supabase
    .from('repositories')
    .select('id, full_name, user_id')

  if (!repositories || repositories.length === 0) {
    return NextResponse.json({ message: 'No repositories to sync' })
  }

  const results = []

  for (const repo of repositories) {
    try {
      // Get GitHub token for this user
      const { data: githubAccount } = await supabase
        .from('github_accounts')
        .select('access_token')
        .eq('user_id', repo.user_id)
        .single()

      if (!githubAccount?.access_token) {
        results.push({ repo: repo.full_name, status: 'skipped', reason: 'no token' })
        continue
      }

      await supabase
        .from('repositories')
        .update({ sync_status: 'syncing' })
        .eq('id', repo.id)

      const [owner, repoName] = repo.full_name.split('/')
      const octokit = createGitHubClient(githubAccount.access_token)

      const since = new Date()
      since.setDate(since.getDate() - 90)

      const [commits, pullRequests, issues, releases, contributors] =
        await Promise.all([
          syncCommits(octokit, owner, repoName, since.toISOString()),
          syncPullRequests(octokit, owner, repoName),
          syncIssues(octokit, owner, repoName),
          syncReleases(octokit, owner, repoName),
          syncContributors(octokit, owner, repoName),
        ])

      if (commits.length > 0) {
        await supabase.from('commits').upsert(
          commits.map((c) => ({ ...c, repository_id: repo.id })),
          { onConflict: 'repository_id,sha' }
        )
      }

      if (pullRequests.length > 0) {
        await supabase.from('pull_requests').upsert(
          pullRequests.map((pr) => ({ ...pr, repository_id: repo.id })),
          { onConflict: 'repository_id,github_id' }
        )
      }

      if (issues.length > 0) {
        await supabase.from('issues').upsert(
          issues.map((issue) => ({
            ...issue,
            repository_id: repo.id,
            labels: JSON.stringify(issue.labels),
          })),
          { onConflict: 'repository_id,github_id' }
        )
      }

      if (releases.length > 0) {
        await supabase.from('releases').upsert(
          releases.map((r) => ({ ...r, repository_id: repo.id })),
          { onConflict: 'repository_id,github_id' }
        )
      }

      if (contributors.length > 0) {
        await supabase.from('contributors').upsert(
          contributors.map((c) => ({ ...c, repository_id: repo.id })),
          { onConflict: 'repository_id,github_login' }
        )
      }

      await supabase
        .from('repositories')
        .update({
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', repo.id)

      results.push({ repo: repo.full_name, status: 'synced', commits: commits.length })
    } catch (error) {
      console.error(`Sync failed for ${repo.full_name}:`, error)
      await supabase
        .from('repositories')
        .update({ sync_status: 'error' })
        .eq('id', repo.id)
      results.push({ repo: repo.full_name, status: 'error' })
    }
  }

  return NextResponse.json({ synced: results.length, results })
}
