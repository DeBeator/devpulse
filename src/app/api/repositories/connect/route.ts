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

interface ConnectRepositoryBody {
  github_id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  html_url: string
  default_branch: string
  language: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ConnectRepositoryBody = await request.json()

    if (!body.github_id || !body.name || !body.full_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: existing } = await supabase
      .from('repositories')
      .select('id')
      .eq('user_id', user.id)
      .eq('github_id', body.github_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Repository already connected' },
        { status: 409 }
      )
    }

    const { data: repository, error: insertError } = await supabase
      .from('repositories')
      .insert({
        user_id: user.id,
        github_id: body.github_id,
        name: body.name,
        full_name: body.full_name,
        description: body.description,
        private: body.private,
        html_url: body.html_url,
        default_branch: body.default_branch,
        language: body.language,
        stargazers_count: body.stargazers_count,
        forks_count: body.forks_count,
        open_issues_count: body.open_issues_count,
        sync_status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to connect repository:', insertError)
      return NextResponse.json(
        { error: 'Failed to connect repository' },
        { status: 500 }
      )
    }

    // Auto-sync immediately after connecting
    try {
      const accessToken = await getGitHubToken(user.id)
      if (accessToken && repository) {
        const [owner, repo] = repository.full_name.split('/')
        const octokit = createGitHubClient(accessToken)

        // Update sync status
        await supabase
          .from('repositories')
          .update({ sync_status: 'syncing' })
          .eq('id', repository.id)

        const since = new Date()
        since.setDate(since.getDate() - 90)

        const [commits, pullRequests, issues, releases, contributors] =
          await Promise.all([
            syncCommits(octokit, owner, repo, since.toISOString()),
            syncPullRequests(octokit, owner, repo),
            syncIssues(octokit, owner, repo),
            syncReleases(octokit, owner, repo),
            syncContributors(octokit, owner, repo),
          ])

        if (commits.length > 0) {
          await supabase.from('commits').upsert(
            commits.map((c) => ({ ...c, repository_id: repository.id })),
            { onConflict: 'repository_id,sha' }
          )
        }

        if (pullRequests.length > 0) {
          await supabase.from('pull_requests').upsert(
            pullRequests.map((pr) => ({ ...pr, repository_id: repository.id })),
            { onConflict: 'repository_id,github_id' }
          )
        }

        if (issues.length > 0) {
          await supabase.from('issues').upsert(
            issues.map((issue) => ({
              ...issue,
              repository_id: repository.id,
              labels: JSON.stringify(issue.labels),
            })),
            { onConflict: 'repository_id,github_id' }
          )
        }

        if (releases.length > 0) {
          await supabase.from('releases').upsert(
            releases.map((r) => ({ ...r, repository_id: repository.id })),
            { onConflict: 'repository_id,github_id' }
          )
        }

        if (contributors.length > 0) {
          await supabase.from('contributors').upsert(
            contributors.map((c) => ({ ...c, repository_id: repository.id })),
            { onConflict: 'repository_id,github_login' }
          )
        }

        await supabase
          .from('repositories')
          .update({
            sync_status: 'synced',
            last_synced_at: new Date().toISOString(),
          })
          .eq('id', repository.id)
      }
    } catch (syncError) {
      // Sync failure should not fail the connect
      console.error('Auto-sync failed after connect:', syncError)
      await supabase
        .from('repositories')
        .update({ sync_status: 'error' })
        .eq('id', repository.id)
    }

    return NextResponse.json({ repository })
  } catch (error) {
    console.error('Failed to connect repository:', error)
    return NextResponse.json(
      { error: 'Failed to connect repository' },
      { status: 500 }
    )
  }
}
