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
