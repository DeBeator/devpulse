import { differenceInDays, parseISO } from 'date-fns'

export interface InsightInput {
  commits: Array<{ committed_at: string; additions: number; deletions: number }>
  pullRequests: Array<{
    state: 'open' | 'closed'
    merged: boolean
    opened_at: string
    merged_at: string | null
    closed_at: string | null
    review_comments: number
  }>
  issues: Array<{
    state: 'open' | 'closed'
    opened_at: string
    closed_at: string | null
  }>
  releases: Array<{ published_at: string | null; prerelease: boolean }>
  contributors: Array<{ contributions: number; github_login: string }>
}

export interface Insight {
  severity: 'critical' | 'warning' | 'info' | 'good'
  category: string
  title: string
  description: string
  recommendation: string
  evidence: Record<string, unknown>
}

export function generateInsights(input: InsightInput): Insight[] {
  const insights: Insight[] = []
  const now = new Date()

  // =====================
  // ACTIVITY INSIGHTS
  // =====================

  const last30Commits = input.commits.filter(
    (c) => differenceInDays(now, parseISO(c.committed_at)) <= 30
  )
  const last90Commits = input.commits.filter(
    (c) => differenceInDays(now, parseISO(c.committed_at)) <= 90
  )
  const prev30Commits = input.commits.filter((c) => {
    const days = differenceInDays(now, parseISO(c.committed_at))
    return days > 30 && days <= 60
  })

  if (last90Commits.length === 0) {
    insights.push({
      severity: 'critical',
      category: 'activity',
      title: 'No commits in the last 90 days',
      description: 'This repository has had no commit activity in the last 90 days.',
      recommendation: 'Review whether this repository is still active. If it is, consider pushing recent work.',
      evidence: { commits_last_90_days: 0 },
    })
  } else if (last30Commits.length === 0) {
    insights.push({
      severity: 'warning',
      category: 'activity',
      title: 'No commits in the last 30 days',
      description: 'Repository activity has stalled in the last 30 days.',
      recommendation: 'Check if work has moved to another branch or repository.',
      evidence: { commits_last_30_days: 0, commits_last_90_days: last90Commits.length },
    })
  } else if (prev30Commits.length > 0) {
    const decline = ((prev30Commits.length - last30Commits.length) / prev30Commits.length) * 100
    if (decline >= 50) {
      insights.push({
        severity: 'warning',
        category: 'activity',
        title: 'Significant activity decline',
        description: `Commit activity dropped ${Math.round(decline)}% compared to the previous 30-day period.`,
        recommendation: 'Review project priorities and team availability.',
        evidence: {
          commits_last_30_days: last30Commits.length,
          commits_prev_30_days: prev30Commits.length,
          decline_percent: Math.round(decline),
        },
      })
    }
  } else if (last30Commits.length >= 20) {
    insights.push({
      severity: 'good',
      category: 'activity',
      title: 'Strong commit activity',
      description: `${last30Commits.length} commits in the last 30 days.`,
      recommendation: 'Keep it up.',
      evidence: { commits_last_30_days: last30Commits.length },
    })
  }

  // =====================
  // PULL REQUEST INSIGHTS
  // =====================

  const openPRs = input.pullRequests.filter((pr) => pr.state === 'open')
  const stalePRs = openPRs.filter(
    (pr) => differenceInDays(now, parseISO(pr.opened_at)) > 14
  )
  const mergedPRs = input.pullRequests.filter((pr) => pr.merged)

  if (stalePRs.length >= 3) {
    insights.push({
      severity: 'warning',
      category: 'pull_requests',
      title: `${stalePRs.length} stale pull requests`,
      description: `${stalePRs.length} pull requests have been open for more than 14 days without activity.`,
      recommendation: 'Review and either merge, close, or request updates on stale PRs.',
      evidence: {
        stale_pr_count: stalePRs.length,
        stale_threshold_days: 14,
      },
    })
  } else if (stalePRs.length === 1 || stalePRs.length === 2) {
    insights.push({
      severity: 'info',
      category: 'pull_requests',
      title: `${stalePRs.length} stale pull request${stalePRs.length > 1 ? 's' : ''}`,
      description: `${stalePRs.length} pull request${stalePRs.length > 1 ? 's have' : ' has'} been open for more than 14 days.`,
      recommendation: 'Follow up on these pull requests.',
      evidence: { stale_pr_count: stalePRs.length },
    })
  }

  // PRs without reviews
  const prsWithoutReviews = openPRs.filter((pr) => pr.review_comments === 0)
  if (prsWithoutReviews.length > 0 && openPRs.length > 0) {
    insights.push({
      severity: 'info',
      category: 'pull_requests',
      title: `${prsWithoutReviews.length} open PR${prsWithoutReviews.length > 1 ? 's' : ''} without reviews`,
      description: `${prsWithoutReviews.length} open pull request${prsWithoutReviews.length > 1 ? 's have' : ' has'} no review comments.`,
      recommendation: 'Ensure pull requests are being reviewed before merging.',
      evidence: { prs_without_reviews: prsWithoutReviews.length },
    })
  }

  if (mergedPRs.length > 0 && input.pullRequests.length >= 5) {
    const mergeRate = mergedPRs.length / input.pullRequests.length
    if (mergeRate >= 0.7) {
      insights.push({
        severity: 'good',
        category: 'pull_requests',
        title: 'Healthy PR merge rate',
        description: `${Math.round(mergeRate * 100)}% of pull requests have been merged.`,
        recommendation: 'Maintain current PR workflow.',
        evidence: { merge_rate_percent: Math.round(mergeRate * 100) },
      })
    }
  }

  // =====================
  // ISSUE INSIGHTS
  // =====================

  const openIssues = input.issues.filter((i) => i.state === 'open')
  const closedIssues = input.issues.filter((i) => i.state === 'closed')
  const staleIssues = openIssues.filter(
    (i) => differenceInDays(now, parseISO(i.opened_at)) > 30
  )

  if (staleIssues.length >= 5) {
    insights.push({
      severity: 'warning',
      category: 'issues',
      title: `${staleIssues.length} stale issues`,
      description: `${staleIssues.length} issues have been open for more than 30 days.`,
      recommendation: 'Triage stale issues — close duplicates, add labels, or schedule fixes.',
      evidence: { stale_issue_count: staleIssues.length },
    })
  }

  if (input.issues.length >= 5) {
    const resolutionRate = closedIssues.length / input.issues.length
    if (resolutionRate >= 0.8) {
      insights.push({
        severity: 'good',
        category: 'issues',
        title: 'Excellent issue resolution rate',
        description: `${Math.round(resolutionRate * 100)}% of issues have been resolved.`,
        recommendation: 'Keep up the issue management cadence.',
        evidence: { resolution_rate_percent: Math.round(resolutionRate * 100) },
      })
    } else if (resolutionRate < 0.3 && input.issues.length > 10) {
      insights.push({
        severity: 'warning',
        category: 'issues',
        title: 'Low issue resolution rate',
        description: `Only ${Math.round(resolutionRate * 100)}% of issues have been closed.`,
        recommendation: 'Prioritize issue resolution to reduce backlog.',
        evidence: {
          resolution_rate_percent: Math.round(resolutionRate * 100),
          open_issues: openIssues.length,
          closed_issues: closedIssues.length,
        },
      })
    }
  }

  // =====================
  // RELEASE INSIGHTS
  // =====================

  const publishedReleases = input.releases.filter(
    (r) => r.published_at && !r.prerelease
  )

  if (publishedReleases.length === 0) {
    insights.push({
      severity: 'info',
      category: 'releases',
      title: 'No published releases',
      description: 'This repository has no published releases.',
      recommendation: 'Consider publishing a release to mark stable versions.',
      evidence: { release_count: 0 },
    })
  } else {
    const sorted = [...publishedReleases].sort(
      (a, b) =>
        parseISO(b.published_at!).getTime() -
        parseISO(a.published_at!).getTime()
    )
    const daysSinceRelease = differenceInDays(now, parseISO(sorted[0].published_at!))

    if (daysSinceRelease > 90) {
      insights.push({
        severity: 'warning',
        category: 'releases',
        title: 'No release in over 90 days',
        description: `Last release was ${daysSinceRelease} days ago.`,
        recommendation: 'Consider publishing a new release if meaningful changes have been made.',
        evidence: { days_since_last_release: daysSinceRelease },
      })
    } else if (daysSinceRelease <= 30) {
      insights.push({
        severity: 'good',
        category: 'releases',
        title: 'Recent release',
        description: `Last release was ${daysSinceRelease} days ago.`,
        recommendation: 'Maintain release cadence.',
        evidence: { days_since_last_release: daysSinceRelease },
      })
    }
  }

  // =====================
  // CONTRIBUTOR INSIGHTS
  // =====================

  if (input.contributors.length === 1) {
    insights.push({
      severity: 'info',
      category: 'contributors',
      title: 'Single contributor',
      description: 'Only one contributor has committed to this repository.',
      recommendation: 'Consider adding more contributors to reduce bus factor risk.',
      evidence: { contributor_count: 1 },
    })
  } else if (input.contributors.length >= 2) {
    const total = input.contributors.reduce((sum, c) => sum + c.contributions, 0)
    const top = Math.max(...input.contributors.map((c) => c.contributions))
    const topShare = total > 0 ? top / total : 0

    if (topShare > 0.85 && input.contributors.length > 1) {
      insights.push({
        severity: 'info',
        category: 'contributors',
        title: 'Contribution concentration',
        description: `One contributor accounts for ${Math.round(topShare * 100)}% of all commits.`,
        recommendation: 'Encourage more distributed contributions to reduce risk.',
        evidence: {
          top_contributor_share_percent: Math.round(topShare * 100),
          contributor_count: input.contributors.length,
        },
      })
    } else if (input.contributors.length >= 3) {
      insights.push({
        severity: 'good',
        category: 'contributors',
        title: 'Healthy contributor base',
        description: `${input.contributors.length} contributors are active on this repository.`,
        recommendation: 'Continue fostering collaboration.',
        evidence: { contributor_count: input.contributors.length },
      })
    }
  }

  return insights
}
