export interface Repository {
  id: string
  github_id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  html_url: string
  default_branch: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface HealthScore {
  id: string
  repository_id: string
  overall: number
  activity: number
  pull_requests: number
  issues: number
  security: number
  releases: number
  contributors: number
  documentation: number
  calculated_at: string
}

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

export interface ConnectedRepository {
  id: string
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
  sync_status: 'pending' | 'syncing' | 'synced' | 'error'
  last_synced_at: string | null
  created_at: string
  updated_at: string
}
