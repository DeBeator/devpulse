import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GitBranch, Plus, Activity } from 'lucide-react'

import type { HealthScore } from '@/types'

function HealthBadge({ score }: { score: number }) {
  if (score >= 80) return <span className="text-green-500 font-bold text-2xl">{score}</span>
  if (score >= 60) return <span className="text-yellow-500 font-bold text-2xl">{score}</span>
  return <span className="text-red-500 font-bold text-2xl">{score}</span>
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: repositories } = await supabase
    .from('repositories')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const repoIds = repositories?.map((r) => r.id) ?? []

  const { data: healthScores } = repoIds.length > 0
    ? await supabase
        .from('health_scores')
        .select('*')
        .in('repository_id', repoIds)
        .order('calculated_at', { ascending: false })
    : { data: [] }

  // Get latest score per repository
  const latestScores = new Map<string, HealthScore>()
  for (const score of healthScores ?? []) {
    if (!latestScores.has(score.repository_id)) {
      latestScores.set(score.repository_id, score)
    }
  }

  if (!repositories || repositories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <GitBranch className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No repositories connected</h2>
        <p className="text-muted-foreground">Connect a GitHub repository to get started.</p>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Overview</h1>
          <p className="text-muted-foreground mt-1">
            {repositories.length} repository{repositories.length !== 1 ? 's' : ''} connected
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/repositories">
            <Plus className="h-4 w-4 mr-2" />
            Add Repository
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {repositories.map((repo) => {
          const health = latestScores.get(repo.id)
          return (
            <Card key={repo.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
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
                  <Badge variant="outline" className="ml-2 shrink-0 text-xs">
                    {repo.sync_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {health ? (
                  <div className="space-y-3">
                    <div className="flex items-end gap-2">
                      <HealthBadge score={health.overall} />
                      <span className="text-muted-foreground text-sm mb-1">/ 100</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Activity</span>
                        <span>{health.activity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">PRs</span>
                        <span>{health.pull_requests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Issues</span>
                        <span>{health.issues}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Security</span>
                        <span>{health.security}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Releases</span>
                        <span>{health.releases}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contributors</span>
                        <span>{health.contributors}</span>
                      </div>
                    </div>
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <Link href={`/dashboard/${repo.id}`}>
                        <Activity className="h-3 w-3 mr-2" />
                        View Details
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      No health score yet.
                    </p>
                    <form action={`/api/repositories/${repo.id}/health`} method="POST">
                      <Button size="sm" variant="outline" className="w-full" type="submit">
                        Calculate Health Score
                      </Button>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
