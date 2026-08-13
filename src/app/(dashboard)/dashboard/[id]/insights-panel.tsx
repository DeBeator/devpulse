'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  RefreshCw,
} from 'lucide-react'

interface Insight {
  id: string
  severity: 'critical' | 'warning' | 'info' | 'good'
  category: string
  title: string
  description: string
  recommendation: string
}

interface InsightsPanelProps {
  repositoryId: string
  initialInsights: Insight[]
}

function SeverityIcon({ severity }: { severity: string }) {
  switch (severity) {
    case 'critical':
      return <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
    case 'good':
      return <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
    default:
      return <Info className="h-4 w-4 text-blue-500 shrink-0" />
  }
}

function SeverityBadge({ severity }: { severity: string }) {
  const variants: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-500 border-red-500/20',
    warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    good: 'bg-green-500/10 text-green-500 border-green-500/20',
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${variants[severity] ?? variants.info}`}
    >
      {severity}
    </span>
  )
}

export default function InsightsPanel({
  repositoryId,
  initialInsights,
}: InsightsPanelProps) {
  const [insights, setInsights] = useState<Insight[]>(initialInsights)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generateInsights() {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/repositories/${repositoryId}/insights`, {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to generate insights')
      }

      setInsights(data.insights)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights')
    } finally {
      setLoading(false)
    }
  }

  const critical = insights.filter((i) => i.severity === 'critical')
  const warnings = insights.filter((i) => i.severity === 'warning')
  const info = insights.filter((i) => i.severity === 'info')
  const good = insights.filter((i) => i.severity === 'good')
  const ordered = [...critical, ...warnings, ...info, ...good]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {critical.length > 0 && (
            <Badge variant="destructive">{critical.length} critical</Badge>
          )}
          {warnings.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
              {warnings.length} warning{warnings.length > 1 ? 's' : ''}
            </span>
          )}
          {good.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
              {good.length} good
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={generateInsights}
          disabled={loading}
        >
          <RefreshCw className={`h-3 w-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Generating...' : 'Generate Insights'}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {ordered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No insights yet. Click Generate Insights to analyze this repository.
        </p>
      ) : (
        <div className="space-y-3">
          {ordered.map((insight, i) => (
            <div
              key={insight.id ?? i}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card"
            >
              <SeverityIcon severity={insight.severity} />
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <SeverityBadge severity={insight.severity} />
                </div>
                <p className="text-xs text-muted-foreground">{insight.description}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Recommendation:</span>{' '}
                  {insight.recommendation}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
