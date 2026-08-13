import { differenceInDays, parseISO } from 'date-fns'

export interface CommitData {
  committed_at: string
  additions: number
  deletions: number
}

export interface PullRequestData {
  state: 'open' | 'closed'
  merged: boolean
  opened_at: string
  merged_at: string | null
  closed_at: string | null
  review_comments: number
}

export interface IssueData {
  state: 'open' | 'closed'
  opened_at: string
  closed_at: string | null
}

export interface ReleaseData {
  published_at: string | null
  prerelease: boolean
}

export interface ContributorData {
  contributions: number
}

export interface ScoreFactor {
  label: string
  impact: 'positive' | 'negative' | 'neutral'
  detail: string
}

export interface CategoryScore {
  score: number
  factors: ScoreFactor[]
}

export interface HealthScoreResult {
  overall: number
  activity: number
  pull_requests: number
  issues: number
  security: number
  releases: number
  contributors: number
  documentation: number
  factors: ScoreFactor[]
}

// =====================
// ACTIVITY SCORE (20%)
// =====================
export function scoreActivity(commits: CommitData[]): CategoryScore {
  const factors: ScoreFactor[] = []
  const now = new Date()

  if (commits.length === 0) {
    return {
      score: 0,
      factors: [{ label: 'No commits', impact: 'negative', detail: 'No commits found in the last 90 days.' }],
    }
  }

  // Commits in last 30 days
  const last30 = commits.filter(
    (c) => differenceInDays(now, parseISO(c.committed_at)) <= 30
  )
  const last7 = commits.filter(
    (c) => differenceInDays(now, parseISO(c.committed_at)) <= 7
  )

  // Days since last commit
  const sorted = [...commits].sort(
    (a, b) => parseISO(b.committed_at).getTime() - parseISO(a.committed_at).getTime()
  )
  const daysSinceLastCommit = differenceInDays(now, parseISO(sorted[0].committed_at))

  let score = 100

  // Recent activity
  if (last30.length >= 20) {
    factors.push({ label: 'High commit frequency', impact: 'positive', detail: `${last30.length} commits in the last 30 days.` })
  } else if (last30.length >= 10) {
    factors.push({ label: 'Moderate commit frequency', impact: 'neutral', detail: `${last30.length} commits in the last 30 days.` })
    score -= 10
  } else if (last30.length >= 1) {
    factors.push({ label: 'Low commit frequency', impact: 'negative', detail: `Only ${last30.length} commits in the last 30 days.` })
    score -= 30
  } else {
    factors.push({ label: 'No recent commits', impact: 'negative', detail: 'No commits in the last 30 days.' })
    score -= 50
  }

  // Days since last commit
  if (daysSinceLastCommit <= 3) {
    factors.push({ label: 'Recently active', impact: 'positive', detail: `Last commit was ${daysSinceLastCommit} day(s) ago.` })
  } else if (daysSinceLastCommit <= 14) {
    factors.push({ label: 'Moderately active', impact: 'neutral', detail: `Last commit was ${daysSinceLastCommit} days ago.` })
  } else if (daysSinceLastCommit <= 30) {
    score -= 15
    factors.push({ label: 'Low recent activity', impact: 'negative', detail: `Last commit was ${daysSinceLastCommit} days ago.` })
  } else {
    score -= 30
    factors.push({ label: 'Inactive repository', impact: 'negative', detail: `Last commit was ${daysSinceLastCommit} days ago.` })
  }

  if (last7.length >= 3) {
    factors.push({ label: 'Active this week', impact: 'positive', detail: `${last7.length} commits in the last 7 days.` })
  }

  return { score: Math.max(0, Math.min(100, score)), factors }
}

// =====================
// PULL REQUEST SCORE (20%)
// =====================
export function scorePullRequests(prs: PullRequestData[]): CategoryScore {
  const factors: ScoreFactor[] = []

  if (prs.length === 0) {
    return {
      score: 50,
      factors: [{ label: 'No pull requests', impact: 'neutral', detail: 'No pull requests found.' }],
    }
  }

  let score = 100
  const now = new Date()

  const openPRs = prs.filter((pr) => pr.state === 'open')
  const mergedPRs = prs.filter((pr) => pr.merged)

  // Stale PRs (open > 14 days)
  const stalePRs = openPRs.filter(
    (pr) => differenceInDays(now, parseISO(pr.opened_at)) > 14
  )

  if (stalePRs.length === 0 && openPRs.length > 0) {
    factors.push({ label: 'No stale PRs', impact: 'positive', detail: 'All open PRs are recent.' })
  } else if (stalePRs.length > 0) {
    const penalty = Math.min(40, stalePRs.length * 10)
    score -= penalty
    factors.push({
      label: `${stalePRs.length} stale PR${stalePRs.length > 1 ? 's' : ''}`,
      impact: 'negative',
      detail: `${stalePRs.length} PR${stalePRs.length > 1 ? 's have' : ' has'} been open for more than 14 days.`,
    })
  }

  // Merge rate
  if (mergedPRs.length > 0) {
    const mergeRate = mergedPRs.length / prs.length
    if (mergeRate >= 0.7) {
      factors.push({ label: 'Healthy merge rate', impact: 'positive', detail: `${Math.round(mergeRate * 100)}% of PRs have been merged.` })
    } else if (mergeRate >= 0.4) {
      factors.push({ label: 'Moderate merge rate', impact: 'neutral', detail: `${Math.round(mergeRate * 100)}% of PRs have been merged.` })
      score -= 10
    } else {
      factors.push({ label: 'Low merge rate', impact: 'negative', detail: `Only ${Math.round(mergeRate * 100)}% of PRs have been merged.` })
      score -= 20
    }
  }

  // Average merge time
  const mergedWithTime = mergedPRs.filter((pr) => pr.merged_at)
  if (mergedWithTime.length > 0) {
    const avgMergeHours =
      mergedWithTime.reduce((sum, pr) => {
        const hours =
          (parseISO(pr.merged_at!).getTime() - parseISO(pr.opened_at).getTime()) /
          (1000 * 60 * 60)
        return sum + hours
      }, 0) / mergedWithTime.length

    if (avgMergeHours <= 24) {
      factors.push({ label: 'Fast merge time', impact: 'positive', detail: `Average merge time is ${Math.round(avgMergeHours)} hours.` })
    } else if (avgMergeHours <= 72) {
      factors.push({ label: 'Moderate merge time', impact: 'neutral', detail: `Average merge time is ${Math.round(avgMergeHours)} hours.` })
    } else {
      score -= 15
      factors.push({ label: 'Slow merge time', impact: 'negative', detail: `Average merge time is ${Math.round(avgMergeHours / 24)} days.` })
    }
  }

  return { score: Math.max(0, Math.min(100, score)), factors }
}

// =====================
// ISSUE SCORE (15%)
// =====================
export function scoreIssues(issues: IssueData[]): CategoryScore {
  const factors: ScoreFactor[] = []

  if (issues.length === 0) {
    return {
      score: 70,
      factors: [{ label: 'No issues', impact: 'neutral', detail: 'No issues found.' }],
    }
  }

  let score = 100
  const now = new Date()
  const openIssues = issues.filter((i) => i.state === 'open')
  const closedIssues = issues.filter((i) => i.state === 'closed')

  // Resolution rate
  if (issues.length > 0) {
    const resolutionRate = closedIssues.length / issues.length
    if (resolutionRate >= 0.7) {
      factors.push({ label: 'Good issue resolution', impact: 'positive', detail: `${Math.round(resolutionRate * 100)}% of issues resolved.` })
    } else if (resolutionRate >= 0.4) {
      score -= 10
      factors.push({ label: 'Moderate issue resolution', impact: 'neutral', detail: `${Math.round(resolutionRate * 100)}% of issues resolved.` })
    } else {
      score -= 25
      factors.push({ label: 'Low issue resolution rate', impact: 'negative', detail: `Only ${Math.round(resolutionRate * 100)}% of issues resolved.` })
    }
  }

  // Stale open issues (open > 30 days)
  const staleIssues = openIssues.filter(
    (i) => differenceInDays(now, parseISO(i.opened_at)) > 30
  )

  if (staleIssues.length > 0) {
    const penalty = Math.min(30, staleIssues.length * 5)
    score -= penalty
    factors.push({
      label: `${staleIssues.length} stale issue${staleIssues.length > 1 ? 's' : ''}`,
      impact: 'negative',
      detail: `${staleIssues.length} issue${staleIssues.length > 1 ? 's have' : ' has'} been open for more than 30 days.`,
    })
  } else if (openIssues.length > 0) {
    factors.push({ label: 'No stale issues', impact: 'positive', detail: 'All open issues are recent.' })
  }

  return { score: Math.max(0, Math.min(100, score)), factors }
}

// =====================
// RELEASE SCORE (10%)
// =====================
export function scoreReleases(releases: ReleaseData[]): CategoryScore {
  const factors: ScoreFactor[] = []
  const now = new Date()

  const publishedReleases = releases.filter(
    (r) => r.published_at && !r.prerelease
  )

  if (publishedReleases.length === 0) {
    return {
      score: 40,
      factors: [{ label: 'No releases', impact: 'negative', detail: 'No published releases found.' }],
    }
  }

  let score = 100

  const sorted = [...publishedReleases].sort(
    (a, b) =>
      parseISO(b.published_at!).getTime() - parseISO(a.published_at!).getTime()
  )

  const daysSinceLastRelease = differenceInDays(now, parseISO(sorted[0].published_at!))

  if (daysSinceLastRelease <= 30) {
    factors.push({ label: 'Recent release', impact: 'positive', detail: `Last release was ${daysSinceLastRelease} days ago.` })
  } else if (daysSinceLastRelease <= 90) {
    score -= 20
    factors.push({ label: 'Release overdue', impact: 'neutral', detail: `Last release was ${daysSinceLastRelease} days ago.` })
  } else {
    score -= 40
    factors.push({ label: 'No recent release', impact: 'negative', detail: `Last release was ${daysSinceLastRelease} days ago.` })
  }

  if (publishedReleases.length >= 3) {
    factors.push({ label: 'Consistent releases', impact: 'positive', detail: `${publishedReleases.length} releases published.` })
  }

  return { score: Math.max(0, Math.min(100, score)), factors }
}

// =====================
// CONTRIBUTOR SCORE (10%)
// =====================
export function scoreContributors(contributors: ContributorData[]): CategoryScore {
  const factors: ScoreFactor[] = []

  if (contributors.length === 0) {
    return {
      score: 30,
      factors: [{ label: 'No contributors', impact: 'negative', detail: 'No contributors found.' }],
    }
  }

  let score = 100

  if (contributors.length >= 5) {
    factors.push({ label: 'Healthy contributor count', impact: 'positive', detail: `${contributors.length} contributors.` })
  } else if (contributors.length >= 2) {
    score -= 10
    factors.push({ label: 'Small contributor base', impact: 'neutral', detail: `${contributors.length} contributors.` })
  } else {
    score -= 30
    factors.push({ label: 'Single contributor', impact: 'negative', detail: 'Only 1 contributor. Bus factor risk.' })
  }

  // Contribution distribution
  const total = contributors.reduce((sum, c) => sum + c.contributions, 0)
  const topContributor = Math.max(...contributors.map((c) => c.contributions))
  const topShare = topContributor / total

  if (topShare > 0.9 && contributors.length > 1) {
    score -= 15
    factors.push({ label: 'Uneven contributions', impact: 'negative', detail: `Top contributor accounts for ${Math.round(topShare * 100)}% of commits.` })
  }

  return { score: Math.max(0, Math.min(100, score)), factors }
}

// =====================
// SECURITY SCORE (20%)
// Default until Vaultless is integrated
// =====================
export function scoreSecurityDefault(): CategoryScore {
  return {
    score: 50,
    factors: [
      {
        label: 'Security scan pending',
        impact: 'neutral',
        detail: 'Run a security scan to get a security score.',
      },
    ],
  }
}

// =====================
// DOCUMENTATION SCORE (5%)
// =====================
export function scoreDocumentation(hasReadme: boolean): CategoryScore {
  if (hasReadme) {
    return {
      score: 80,
      factors: [{ label: 'README present', impact: 'positive', detail: 'Repository has a README file.' }],
    }
  }
  return {
    score: 20,
    factors: [{ label: 'No README', impact: 'negative', detail: 'Repository is missing a README file.' }],
  }
}

// =====================
// OVERALL SCORE
// =====================
export function calculateHealthScore(params: {
  commits: CommitData[]
  pullRequests: PullRequestData[]
  issues: IssueData[]
  releases: ReleaseData[]
  contributors: ContributorData[]
  hasReadme: boolean
  securityScore?: number
  securityFactors?: ScoreFactor[]
}): HealthScoreResult {
  const activityResult = scoreActivity(params.commits)
  const prResult = scorePullRequests(params.pullRequests)
  const issueResult = scoreIssues(params.issues)
  const releaseResult = scoreReleases(params.releases)
  const contributorResult = scoreContributors(params.contributors)
  const docResult = scoreDocumentation(params.hasReadme)

  const securityScore = params.securityScore ?? 50
  const securityFactors = params.securityFactors ?? scoreSecurityDefault().factors

  const overall = Math.round(
    activityResult.score * 0.20 +
    prResult.score * 0.20 +
    issueResult.score * 0.15 +
    securityScore * 0.20 +
    releaseResult.score * 0.10 +
    contributorResult.score * 0.10 +
    docResult.score * 0.05
  )

  const allFactors: ScoreFactor[] = [
    ...activityResult.factors,
    ...prResult.factors,
    ...issueResult.factors,
    ...securityFactors,
    ...releaseResult.factors,
    ...contributorResult.factors,
    ...docResult.factors,
  ]

  return {
    overall,
    activity: activityResult.score,
    pull_requests: prResult.score,
    issues: issueResult.score,
    security: securityScore,
    releases: releaseResult.score,
    contributors: contributorResult.score,
    documentation: docResult.score,
    factors: allFactors,
  }
}
