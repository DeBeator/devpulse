import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, AlertTriangle, Info, CheckCircle, Lightbulb } from 'lucide-react'

export default async function GlobalInsightsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: repositories } = await supabase
    .from('repositories')
    .select('id, full_name')
    .eq('user_id', user.id)

  const repoIds = (repositories ?? []).map((r) => r.id)

  if (repoIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Lightbulb className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">No repositories connected</h2>
      </div>
    )
  }

  const { data: insights } = await supabase
    .from('insights')
    .select('*')
    .in('repository_id', repoIds)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const repoMap = new Map(
    (repositories ?? []).map((r) => [r.id, r.full_name])
  )

  const allInsights = insights ?? []
  const critical = allInsights.filter((i) => i.severity === 'critical')
  const warnings = allInsights.filter((i) => i.severity === 'warning')
  const info = allInsights.filter((i) => i.severity === 'info')
  const good = allInsights.filter((i) => i.severity === 'good')
  const ordered = [...critical, ...warnings, ...info, ...good]

  function SeverityIcon({ severity }: { severity: string }) {
    if (severity === 'critical')
      return <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
    if (severity === 'warning')
      return <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
    if (severity === 'good')
      return <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
    return <Info className="h-4 w-4 text-blue-500 shrink-0" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Insights</h1>
        <p className="text-muted-foreground mt-1">
          {allInsights.length > 0
            ? `${allInsights.length} active insight${allInsights.length !== 1 ? 's' : ''} across your repositories.`
            : 'No active insights. Generate insights from a repository detail page.'}
        </p>
      </div>

      {/* Summary badges */}
      {allInsights.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {critical.length > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
              {critical.length} critical
            </span>
          )}
          {warnings.length > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
              {warnings.length} warning{warnings.length > 1 ? 's' : ''}
            </span>
          )}
          {info.length > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
              {info.length} info
            </span>
          )}
          {good.length > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
              {good.length} good
            </span>
          )}
        </div>
      )}

      {/* Insights list */}
      {ordered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Lightbulb className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No active insights. Go to a repository detail page and click Generate Insights.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ordered.map((insight, i) => (
            <Link
              key={insight.id ?? i}
              href={`/dashboard/${insight.repository_id}`}
              className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors block"
            >
              <SeverityIcon severity={insight.severity} />
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <span className="text-xs text-muted-foreground">
                    · {repoMap.get(insight.repository_id) ?? 'Unknown'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {insight.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Recommendation:</span>{' '}
                  {insight.recommendation}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
