import { createClient } from '@/lib/supabase/server'
import { createGitHubClient } from '@/lib/github/client'
import { getGitHubToken } from '@/lib/github/token'
import {
  syncCommits,
  syncPullRequests,
  syncIssues,
  syncReleases,
  syncContributors,
} from '@/lib/github/sync'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify repository belongs to user
    const { data: repository, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (repoError || !repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    const accessToken = await getGitHubToken(user.id)
    if (!accessToken) {
      return NextResponse.json(
        { error: 'GitHub token not found. Please sign in again.' },
        { status: 401 }
      )
    }

    // Mark as syncing
    await supabase
      .from('repositories')
      .update({ sync_status: 'syncing' })
      .eq('id', id)

    const [owner, repo] = repository.full_name.split('/')
    const octokit = createGitHubClient(accessToken)

    try {
      // Sync commits (last 90 days)
      const since = new Date()
      since.setDate(since.getDate() - 90)
      const commits = await syncCommits(
        octokit,
        owner,
        repo,
        since.toISOString()
      )

      if (commits.length > 0) {
        await supabase.from('commits').upsert(
          commits.map((c) => ({ ...c, repository_id: id })),
          { onConflict: 'repository_id,sha' }
        )
      }

      // Sync pull requests
      const pullRequests = await syncPullRequests(octokit, owner, repo)
      if (pullRequests.length > 0) {
        await supabase.from('pull_requests').upsert(
          pullRequests.map((pr) => ({ ...pr, repository_id: id })),
          { onConflict: 'repository_id,github_id' }
        )
      }

      // Sync issues
      const issues = await syncIssues(octokit, owner, repo)
      if (issues.length > 0) {
        await supabase.from('issues').upsert(
          issues.map((issue) => ({ ...issue, repository_id: id,
            labels: JSON.stringify(issue.labels) })),
          { onConflict: 'repository_id,github_id' }
        )
      }

      // Sync releases
      const releases = await syncReleases(octokit, owner, repo)
      if (releases.length > 0) {
        await supabase.from('releases').upsert(
          releases.map((r) => ({ ...r, repository_id: id })),
          { onConflict: 'repository_id,github_id' }
        )
      }

      // Sync contributors
      const contributors = await syncContributors(octokit, owner, repo)
      if (contributors.length > 0) {
        await supabase.from('contributors').upsert(
          contributors.map((c) => ({ ...c, repository_id: id })),
          { onConflict: 'repository_id,github_login' }
        )
      }

      // Mark as synced
      await supabase
        .from('repositories')
        .update({
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', id)

      return NextResponse.json({
        success: true,
        synced: {
          commits: commits.length,
          pull_requests: pullRequests.length,
          issues: issues.length,
          releases: releases.length,
          contributors: contributors.length,
        },
      })
    } catch (syncError) {
      // Mark as error if sync fails
      await supabase
        .from('repositories')
        .update({ sync_status: 'error' })
        .eq('id', id)

      throw syncError
    }
  } catch (error) {
    console.error('Sync failed:', error)
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    )
  }
}
