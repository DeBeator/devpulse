import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import HealthScoreActions from './health-score-actions'
import InsightsPanel from './insights-panel'
import SecurityPanel from './security-panel'

interface Props {
  params: Promise<{ id: string }>
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

function FactorIcon({ impact }: { impact: string }) {
  if (impact === 'positive') return <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
  if (impact === 'negative') return <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
  return <Minus className="h-4 w-4 text-yellow-500 shrink-0" />
}

export default async function RepositoryDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: repository } = await supabase
    .from('repositories')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!repository) notFound()

  const { data: healthScore } = await supabase
    .from('health_scores')
    .select('*')
    .eq('repository_id', id)
    .order('calculated_at', { ascending: false })
    .limit(1)
    .single()

  const { data: insightsData } = await supabase
    .from('insights')
    .select('*')
    .eq('repository_id', id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const { data: securityScans } = await supabase
    .from('security_scans')
    .select('*')
    .eq('repository_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: securityFindings } = await supabase
    .from('security_findings')
    .select('*')
    .eq('repository_id', id)
    .eq('status', 'open')
    .order('severity', { ascending: true })

  const overallColor = healthScore
    ? healthScore.overall >= 80
      ? 'text-green-500'
      : healthScore.overall >= 60
        ? 'text-yellow-500'
        : 'text-red-500'
    : 'text-muted-foreground'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{repository.full_name}</h1>
        {repository.description && (
          <p className="text-muted-foreground mt-1">{repository.description}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            {healthScore ? (
              <div className="space-y-4">
                <div className="text-center">
                  <span className={`text-6xl font-bold ${overallColor}`}>
                    {healthScore.overall}
                  </span>
                  <span className="text-muted-foreground text-xl"> / 100</span>
                </div>
                <div className="space-y-3">
                  <ScoreBar score={healthScore.activity} label="Activity" />
                  <ScoreBar score={healthScore.pull_requests} label="Pull Requests" />
                  <ScoreBar score={healthScore.issues} label="Issues" />
                  <ScoreBar score={healthScore.security} label="Security" />
                  <ScoreBar score={healthScore.releases} label="Releases" />
                  <ScoreBar score={healthScore.contributors} label="Contributors" />
                  <ScoreBar score={healthScore.documentation} label="Documentation" />
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-muted-foreground text-sm">No score calculated yet.</p>
              </div>
            )}
            <div className="mt-4">
              <HealthScoreActions repositoryId={id} />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Why this score?</CardTitle>
          </CardHeader>
          <CardContent>
            {healthScore?.factors && Array.isArray(healthScore.factors) ? (
              <div className="space-y-3">
                {(healthScore.factors as Array<{
                  label: string
                  impact: string
                  detail: string
                }>).map((factor, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <FactorIcon impact={factor.impact} />
                    <div>
                      <p className="text-sm font-medium">{factor.label}</p>
                      <p className="text-xs text-muted-foreground">{factor.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Calculate a health score to see contributing factors.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <InsightsPanel
            repositoryId={id}
            initialInsights={insightsData ?? []}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Security</CardTitle>
        </CardHeader>
        <CardContent>
          <SecurityPanel
            repositoryId={id}
            initialFindings={securityFindings ?? []}
            initialScans={securityScans ?? []}
          />
        </CardContent>
      </Card>
    </div>
  )
}
