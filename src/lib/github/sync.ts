import { Octokit } from '@octokit/rest'

export interface SyncCommit {
  sha: string
  message: string
  author_name: string | null
  author_email: string | null
  author_github_login: string | null
  additions: number
  deletions: number
  committed_at: string
}

export interface SyncPullRequest {
  github_id: number
  number: number
  title: string
  state: 'open' | 'closed'
  merged: boolean
  draft: boolean
  author_github_login: string | null
  additions: number
  deletions: number
  changed_files: number
  review_comments: number
  opened_at: string
  merged_at: string | null
  closed_at: string | null
}

export interface SyncIssue {
  github_id: number
  number: number
  title: string
  state: 'open' | 'closed'
  author_github_login: string | null
  labels: string[]
  opened_at: string
  closed_at: string | null
}

export interface SyncRelease {
  github_id: number
  tag_name: string
  name: string | null
  prerelease: boolean
  draft: boolean
  published_at: string | null
}

export interface SyncContributor {
  github_login: string
  github_id: number | null
  avatar_url: string | null
  contributions: number
}

export async function syncCommits(
  octokit: Octokit,
  owner: string,
  repo: string,
  since?: string
): Promise<SyncCommit[]> {
  const commits: SyncCommit[] = []
  let page = 1

  while (true) {
    const { data } = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: 100,
      page,
      since,
    })

    if (data.length === 0) break

    for (const commit of data) {
      let additions = 0
      let deletions = 0

      try {
        const { data: detail } = await octokit.repos.getCommit({
          owner,
          repo,
          ref: commit.sha,
        })
        additions = detail.stats?.additions ?? 0
        deletions = detail.stats?.deletions ?? 0
      } catch {
        // stats not critical — continue
      }

      commits.push({
        sha: commit.sha,
        message: commit.commit.message.split('\n')[0],
        author_name: commit.commit.author?.name ?? null,
        author_email: commit.commit.author?.email ?? null,
        author_github_login: commit.author?.login ?? null,
        additions,
        deletions,
        committed_at: commit.commit.author?.date ?? new Date().toISOString(),
      })
    }

    if (data.length < 100) break
    page++
  }

  return commits
}

export async function syncPullRequests(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<SyncPullRequest[]> {
  const prs: SyncPullRequest[] = []
  let page = 1

  while (true) {
    const { data } = await octokit.pulls.list({
      owner,
      repo,
      state: 'all',
      per_page: 100,
      page,
      sort: 'updated',
      direction: 'desc',
    })

    if (data.length === 0) break

    prs.push(
      ...data.map((pr) => {
        const item = pr as typeof pr & {
          additions?: number
          deletions?: number
          changed_files?: number
          review_comments?: number
        }
        return {
          github_id: item.id,
          number: item.number,
          title: item.title,
          state: (item.state === 'open' ? 'open' : 'closed') as 'open' | 'closed',
          merged: item.merged_at !== null,
          draft: item.draft ?? false,
          author_github_login: item.user?.login ?? null,
          additions: item.additions ?? 0,
          deletions: item.deletions ?? 0,
          changed_files: item.changed_files ?? 0,
          review_comments: item.review_comments ?? 0,
          opened_at: item.created_at,
          merged_at: item.merged_at ?? null,
          closed_at: item.closed_at ?? null,
        }
      })
    )

    if (data.length < 100) break
    page++
  }

  return prs
}

export async function syncIssues(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<SyncIssue[]> {
  const issues: SyncIssue[] = []
  let page = 1

  while (true) {
    const { data } = await octokit.issues.listForRepo({
      owner,
      repo,
      state: 'all',
      per_page: 100,
      page,
      sort: 'updated',
      direction: 'desc',
    })

    if (data.length === 0) break

    // Filter out pull requests (GitHub issues API returns PRs too)
    const realIssues = data.filter((issue) => !issue.pull_request)

    issues.push(
      ...realIssues.map((issue) => ({
        github_id: issue.id,
        number: issue.number,
        title: issue.title,
        state: (issue.state === 'open' ? 'open' : 'closed') as 'open' | 'closed',
        author_github_login: issue.user?.login ?? null,
        labels: issue.labels.map((l) =>
          typeof l === 'string' ? l : l.name ?? ''
        ),
        opened_at: issue.created_at,
        closed_at: issue.closed_at ?? null,
      }))
    )

    if (data.length < 100) break
    page++
  }

  return issues
}

export async function syncReleases(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<SyncRelease[]> {
  const releases: SyncRelease[] = []
  let page = 1

  while (true) {
    const { data } = await octokit.repos.listReleases({
      owner,
      repo,
      per_page: 100,
      page,
    })

    if (data.length === 0) break

    releases.push(
      ...data.map((release) => ({
        github_id: release.id,
        tag_name: release.tag_name,
        name: release.name ?? null,
        prerelease: release.prerelease,
        draft: release.draft,
        published_at: release.published_at ?? null,
      }))
    )

    if (data.length < 100) break
    page++
  }

  return releases
}

export async function syncContributors(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<SyncContributor[]> {
  try {
    const { data } = await octokit.repos.listContributors({
      owner,
      repo,
      per_page: 100,
    })

    return data.map((contributor) => ({
      github_login: contributor.login ?? 'unknown',
      github_id: contributor.id ?? null,
      avatar_url: contributor.avatar_url ?? null,
      contributions: contributor.contributions,
    }))
  } catch {
    return []
  }
}
