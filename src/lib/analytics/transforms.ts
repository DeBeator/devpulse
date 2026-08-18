import { format, parseISO, eachWeekOfInterval, subWeeks } from 'date-fns'

export interface WeeklyCommits {
  week: string
  commits: number
  additions: number
  deletions: number
}

export interface WeeklyPRs {
  week: string
  opened: number
  merged: number
  closed: number
}

export interface WeeklyIssues {
  week: string
  opened: number
  closed: number
}

export function groupCommitsByWeek(
  commits: Array<{ committed_at: string; additions: number; deletions: number }>,
  weeks = 12
): WeeklyCommits[] {
  const now = new Date()
  const start = subWeeks(now, weeks)

  const weekStarts = eachWeekOfInterval({ start, end: now })

  return weekStarts.map((weekStart) => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const weekCommits = commits.filter((c) => {
      const date = parseISO(c.committed_at)
      return date >= weekStart && date < weekEnd
    })

    return {
      week: format(weekStart, 'MMM d'),
      commits: weekCommits.length,
      additions: weekCommits.reduce((sum, c) => sum + (c.additions ?? 0), 0),
      deletions: weekCommits.reduce((sum, c) => sum + (c.deletions ?? 0), 0),
    }
  })
}

export function groupPRsByWeek(
  prs: Array<{ opened_at: string; merged_at: string | null; closed_at: string | null; state: string; merged: boolean }>,
  weeks = 12
): WeeklyPRs[] {
  const now = new Date()
  const start = subWeeks(now, weeks)
  const weekStarts = eachWeekOfInterval({ start, end: now })

  return weekStarts.map((weekStart) => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const opened = prs.filter((pr) => {
      const date = parseISO(pr.opened_at)
      return date >= weekStart && date < weekEnd
    }).length

    const merged = prs.filter((pr) => {
      if (!pr.merged_at) return false
      const date = parseISO(pr.merged_at)
      return date >= weekStart && date < weekEnd
    }).length

    const closed = prs.filter((pr) => {
      if (!pr.closed_at || pr.merged) return false
      const date = parseISO(pr.closed_at)
      return date >= weekStart && date < weekEnd
    }).length

    return {
      week: format(weekStart, 'MMM d'),
      opened,
      merged,
      closed,
    }
  })
}

export function groupIssuesByWeek(
  issues: Array<{ opened_at: string; closed_at: string | null; state: string }>,
  weeks = 12
): WeeklyIssues[] {
  const now = new Date()
  const start = subWeeks(now, weeks)
  const weekStarts = eachWeekOfInterval({ start, end: now })

  return weekStarts.map((weekStart) => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const opened = issues.filter((i) => {
      const date = parseISO(i.opened_at)
      return date >= weekStart && date < weekEnd
    }).length

    const closed = issues.filter((i) => {
      if (!i.closed_at) return false
      const date = parseISO(i.closed_at)
      return date >= weekStart && date < weekEnd
    }).length

    return {
      week: format(weekStart, 'MMM d'),
      opened,
      closed,
    }
  })
}
