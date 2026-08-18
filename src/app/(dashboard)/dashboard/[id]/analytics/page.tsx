'use client'

import { useEffect, useState } from 'react'

import { useParams } from 'next/navigation'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  groupCommitsByWeek,
  groupPRsByWeek,
  groupIssuesByWeek,
} from '@/lib/analytics/transforms'

interface Contributor {
  github_login: string
  contributions: number
  avatar_url: string | null
}

export default function AnalyticsPage() {
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [repository, setRepository] = useState<{ full_name: string; language: string | null } | null>(null)
  const [commitData, setCommitData] = useState<ReturnType<typeof groupCommitsByWeek>>([])
  const [prData, setPrData] = useState<ReturnType<typeof groupPRsByWeek>>([])
  const [issueData, setIssueData] = useState<ReturnType<typeof groupIssuesByWeek>>([])
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [stats, setStats] = useState({
    totalCommits: 0,
    openPRs: 0,
    mergedPRs: 0,
    openIssues: 0,
    closedIssues: 0,
  })

  useEffect(() => {
    let ignore = false

    async function fetchAnalytics() {
      try {
        const res = await fetch(`/api/repositories/${id}/analytics`)
        const data = await res.json()

        if (ignore) return
        if (!res.ok) throw new Error(data.error ?? 'Failed to fetch analytics')

        setRepository(data.repository)
        setCommitData(groupCommitsByWeek(data.commits))
        setPrData(groupPRsByWeek(data.pull_requests))
        setIssueData(groupIssuesByWeek(data.issues))
        setContributors(data.contributors)
        setStats({
          totalCommits: data.commits.length,
          openPRs: data.pull_requests.filter((pr: { state: string }) => pr.state === 'open').length,
          mergedPRs: data.pull_requests.filter((pr: { merged: boolean }) => pr.merged).length,
          openIssues: data.issues.filter((i: { state: string }) => i.state === 'open').length,
          closedIssues: data.issues.filter((i: { state: string }) => i.state === 'closed').length,
        })
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchAnalytics()
    return () => {
      ignore = true
    }
  }, [id])


  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{repository?.full_name}</h1>
        <p className="text-muted-foreground mt-1">Analytics — last 12 weeks</p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Commits', value: stats.totalCommits },
          { label: 'Open PRs', value: stats.openPRs },
          { label: 'Merged PRs', value: stats.mergedPRs },
          { label: 'Open Issues', value: stats.openIssues },
          { label: 'Closed Issues', value: stats.closedIssues },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Commit activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Commit Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {commitData.every((d) => d.commits === 0) ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No commits in the last 12 weeks.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={commitData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="commits" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Pull request activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pull Request Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {prData.every((d) => d.opened === 0 && d.merged === 0) ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No pull request activity in the last 12 weeks.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={prData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="opened"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="merged"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="closed"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Issue activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Issue Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {issueData.every((d) => d.opened === 0 && d.closed === 0) ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No issue activity in the last 12 weeks.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={issueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="opened"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="closed"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Contributors */}
      {contributors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contributors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contributors.map((contributor) => {
                const max = contributors[0].contributions
                const pct = Math.round((contributor.contributions / max) * 100)
                return (
                  <div key={contributor.github_login} className="flex items-center gap-3">
                    <span className="text-sm w-32 truncate text-muted-foreground">
                      {contributor.github_login}
                    </span>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm w-12 text-right">
                      {contributor.contributions}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
