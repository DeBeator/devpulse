import { Octokit } from '@octokit/rest'

export interface GitHubRepository {
  id: number
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
  updated_at: string | null
}

export async function fetchUserRepositories(
  octokit: Octokit
): Promise<GitHubRepository[]> {
  const repos: GitHubRepository[] = []
  let page = 1

  while (true) {
    const { data } = await octokit.repos.listForAuthenticatedUser({
      per_page: 100,
      page,
      sort: 'updated',
      direction: 'desc',
    })

    if (data.length === 0) break

    repos.push(
      ...data.map((repo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description ?? null,
        private: repo.private,
        html_url: repo.html_url,
        default_branch: repo.default_branch,
        language: repo.language ?? null,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        open_issues_count: repo.open_issues_count,
        updated_at: repo.updated_at ?? null,
      }))
    )

    if (data.length < 100) break
    page++
  }

  return repos
}
