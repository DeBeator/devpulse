import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  GitBranch,
  Plus,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
} from 'lucide-react'
import CalculateHealthButton from './calculate-health-button'

function HealthRing({ score }: { score: number }) {
  const color =
    score >= 80
      ? '#22c55e'
      : score >= 60
        ? '#eab308'
        : '#ef4444'
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const gap = circumference - progress

  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        className="-rotate-90"
      >
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-border"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${progress} ${gap}`}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute text-lg font-bold"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: repositories } = await supabase
    .from('repositories')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const repoIds = repositories?.map((r) => r.id) ?? []

  const [healthRes, insightsRes, findingsRes] = await Promise.all([
    repoIds.length > 0
      ? supabase
          .from('health_scores')
          .select('*')
          .in('repository_id', repoIds)
          .order('calculated_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    repoIds.length > 0
      ? supabase
          .from('insights')
          .select('severity, repository_id')
          .in('repository_id', repoIds)
          .eq('status', 'active')
      : Promise.resolve({ data: [] }),
    repoIds.length > 0
      ? supabase
          .from('security_findings')
          .select('severity, repository_id')
          .in('repository_id', repoIds)
          .eq('status', 'open')
      : Promise.resolve({ data: [] }),
  ])

  // Latest score per repo
  const latestScores = new Map<string, NonNullable<typeof healthRes.data>[number]>()
  for (const score of healthRes.data ?? []) {
    if (!latestScores.has(score.repository_id)) {
      latestScores.set(score.repository_id, score)
    }
  }

  const allScores = Array.from(latestScores.values())
  const avgHealth =
    allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b.overall, 0) / allScores.length)
      : null

  const criticalInsights = (insightsRes.data ?? []).filter(
    (i) => i.severity === 'critical'
  ).length
  const warningInsights = (insightsRes.data ?? []).filter(
    (i) => i.severity === 'warning'
  ).length
  const criticalFindings = (findingsRes.data ?? []).filter(
    (f) => f.severity === 'critical'
  ).length

  if (!repositories || repositories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <GitBranch className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No repositories connected</h2>
        <p className="text-muted-foreground text-sm">
          Connect a GitHub repository to get started.
        </p>
        <Button asChild>
          <Link href="/repositories">
            <Plus className="h-4 w-4 mr-2" />
            Connect Repository
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Overview</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {repositories.length}{' '}
            {repositories.length === 1 ? 'repository' : 'repositories'} connected
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/repositories">
            <Plus className="h-4 w-4 mr-2" />
            Add Repository
          </Link>
        </Button>
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Health</p>
                <p className={`text-2xl font-bold mt-1 ${
                  avgHealth === null
                    ? 'text-muted-foreground'
                    : avgHealth >= 80
                      ? 'text-green-500'
                      : avgHealth >= 60
                        ? 'text-yellow-500'
                        : 'text-red-500'
                }`}>
                  {avgHealth !== null ? `${avgHealth}` : '—'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Critical Insights</p>
                <p className={`text-2xl font-bold mt-1 ${criticalInsights > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {criticalInsights}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Warnings</p>
                <p className={`text-2xl font-bold mt-1 ${warningInsights > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                  {warningInsights}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Security Findings</p>
                <p className={`text-2xl font-bold mt-1 ${criticalFindings > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {criticalFindings}
                </p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Repository cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {repositories.map((repo) => {
          const health = latestScores.get(repo.id)
          const repoInsights = (insightsRes.data ?? []).filter(
            (i) => i.repository_id === repo.id
          )
          const repoCritical = repoInsights.filter(
            (i) => i.severity === 'critical'
          ).length
          const repoWarnings = repoInsights.filter(
            (i) => i.severity === 'warning'
          ).length

          return (
            <Card
              key={repo.id}
              className="border-border/50 hover:border-primary/40 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-medium truncate">
                      {repo.full_name}
                    </CardTitle>
                    {repo.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {repo.description}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs shrink-0 font-normal"
                  >
                    {repo.sync_status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {health ? (
                  <>
                    <div className="flex items-center gap-4">
                      <HealthRing score={health.overall} />
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 flex-1">
                        {[
                          { label: 'Activity', value: health.activity },
                          { label: 'PRs', value: health.pull_requests },
                          { label: 'Issues', value: health.issues },
                          { label: 'Security', value: health.security },
                          { label: 'Releases', value: health.releases },
                          { label: 'Contributors', value: health.contributors },
                        ].map((m) => (
                          <div key={m.label} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{m.label}</span>
                            <span className={
                              m.value >= 80
                                ? 'text-green-500'
                                : m.value >= 60
                                  ? 'text-yellow-500'
                                  : 'text-red-400'
                            }>
                              {m.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {(repoCritical > 0 || repoWarnings > 0) && (
                      <div className="flex items-center gap-2 pt-1">
                        {repoCritical > 0 && (
                          <span className="flex items-center gap-1 text-xs text-red-500">
                            <AlertTriangle className="h-3 w-3" />
                            {repoCritical} critical
                          </span>
                        )}
                        {repoWarnings > 0 && (
                          <span className="flex items-center gap-1 text-xs text-yellow-500">
                            <Clock className="h-3 w-3" />
                            {repoWarnings} warning{repoWarnings > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    )}

                    {repoCritical === 0 && repoWarnings === 0 && (
                      <div className="flex items-center gap-1 text-xs text-green-500 pt-1">
                        <CheckCircle className="h-3 w-3" />
                        No issues detected
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      No health score yet.
                    </p>
                    <CalculateHealthButton repositoryId={repo.id} />
                  </div>
                )}

                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  <Link href={`/dashboard/${repo.id}`}>
                    <Activity className="h-3 w-3 mr-2" />
                    View Details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
