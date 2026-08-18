import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart2, GitBranch } from 'lucide-react'

export default async function GlobalAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: repositories } = await supabase
    .from('repositories')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!repositories || repositories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <GitBranch className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">No repositories connected</h2>
        <p className="text-muted-foreground text-sm">
          Connect a repository to see analytics.
        </p>
      </div>
    )
  }

  // Fetch aggregate stats across all repos
  const repoIds = repositories.map((r) => r.id)

  const [commitsRes, prsRes, issuesRes, releasesRes, healthRes] =
    await Promise.all([
      supabase
        .from('commits')
        .select('id', { count: 'exact', head: true })
        .in('repository_id', repoIds),
      supabase
        .from('pull_requests')
        .select('state, merged')
        .in('repository_id', repoIds),
      supabase
        .from('issues')
        .select('state')
        .in('repository_id', repoIds),
      supabase
        .from('releases')
        .select('id', { count: 'exact', head: true })
        .in('repository_id', repoIds),
      supabase
        .from('health_scores')
        .select('repository_id, overall')
        .in('repository_id', repoIds)
        .order('calculated_at', { ascending: false }),
    ])

  const prs = prsRes.data ?? []
  const issues = issuesRes.data ?? []

  // Get latest health score per repo
  const latestScores = new Map<string, number>()
  for (const score of healthRes.data ?? []) {
    if (!latestScores.has(score.repository_id)) {
      latestScores.set(score.repository_id, score.overall)
    }
  }

  const avgHealth =
    latestScores.size > 0
      ? Math.round(
          Array.from(latestScores.values()).reduce((a, b) => a + b, 0) /
            latestScores.size
        )
      : null

  const stats = [
    { label: 'Total Commits', value: commitsRes.count ?? 0 },
    { label: 'Open PRs', value: prs.filter((p) => p.state === 'open').length },
    { label: 'Merged PRs', value: prs.filter((p) => p.merged).length },
    { label: 'Open Issues', value: issues.filter((i) => i.state === 'open').length },
    { label: 'Total Releases', value: releasesRes.count ?? 0 },
    {
      label: 'Avg Health Score',
      value: avgHealth !== null ? `${avgHealth}/100` : '—',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Aggregate data across {repositories.length} connected{' '}
          {repositories.length === 1 ? 'repository' : 'repositories'}.
        </p>
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Per-repository breakdown */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Repository breakdown
        </h2>
        <div className="space-y-2">
          {repositories.map((repo) => {
            const health = latestScores.get(repo.id)
            const healthColor =
              health === undefined
                ? 'text-muted-foreground'
                : health >= 80
                  ? 'text-green-500'
                  : health >= 60
                    ? 'text-yellow-500'
                    : 'text-red-500'

            return (
              <Link
                key={repo.id}
                href={`/dashboard/${repo.id}/analytics`}
                className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors bg-card"
              >
                <div className="flex items-center gap-3">
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{repo.full_name}</p>
                    {repo.description && (
                      <p className="text-xs text-muted-foreground">
                        {repo.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {health !== undefined ? (
                    <span className={`text-sm font-bold ${healthColor}`}>
                      {health}/100
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No score
                    </span>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {repo.sync_status}
                  </Badge>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
