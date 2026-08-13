'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Shield, ShieldAlert, ShieldCheck, RefreshCw } from 'lucide-react'

interface Finding {
  id: string
  file_path: string
  line_number: number | null
  secret_type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  preview: string
}

interface Scan {
  id: string
  status: string
  files_scanned: number
  findings_count: number
  completed_at: string | null
}

interface SecurityPanelProps {
  repositoryId: string
  initialFindings: Finding[]
  initialScans: Scan[]
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
}

export default function SecurityPanel({
  repositoryId,
  initialFindings,
  initialScans,
}: SecurityPanelProps) {
  const [findings, setFindings] = useState<Finding[]>(initialFindings)
  const [scans, setScans] = useState<Scan[]>(initialScans)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<{
    files_scanned: number
    findings_count: number
    security_score: number
  } | null>(null)

  async function runScan() {
    try {
      setScanning(true)
      setError(null)

      const res = await fetch(
        `/api/repositories/${repositoryId}/security/scan`,
        { method: 'POST' }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Scan failed')
      }

      setLastResult({
        files_scanned: data.files_scanned,
        findings_count: data.findings_count,
        security_score: data.security_score,
      })

      // Refresh findings
      const findingsRes = await fetch(
        `/api/repositories/${repositoryId}/security/findings`
      )
      if (findingsRes.ok) {
        const findingsData = await findingsRes.json()
        setFindings(findingsData.findings)
        setScans(findingsData.scans)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed')
    } finally {
      setScanning(false)
    }
  }

  const lastScan = scans[0]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {findings.length === 0 ? (
            <ShieldCheck className="h-5 w-5 text-green-500" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-red-500" />
          )}
          <span className="text-sm font-medium">
            {findings.length === 0
              ? 'No open findings'
              : `${findings.length} open finding${findings.length > 1 ? 's' : ''}`}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={runScan}
          disabled={scanning}
        >
          <RefreshCw className={`h-3 w-3 mr-2 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning...' : 'Run Scan'}
        </Button>
      </div>

      {lastResult && (
        <div className="rounded-md bg-primary/5 border border-primary/20 p-3 text-sm space-y-1">
          <p className="font-medium">Scan complete</p>
          <p className="text-muted-foreground">
            {lastResult.files_scanned} files scanned ·{' '}
            {lastResult.findings_count} finding{lastResult.findings_count !== 1 ? 's' : ''} ·{' '}
            Security score: {lastResult.security_score}/100
          </p>
        </div>
      )}

      {lastScan && !lastResult && (
        <p className="text-xs text-muted-foreground">
          Last scan:{' '}
          {lastScan.completed_at
            ? new Date(lastScan.completed_at).toLocaleString()
            : 'In progress'}{' '}
          · {lastScan.files_scanned ?? 0} files · {lastScan.findings_count ?? 0} findings
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {findings.length === 0 && !scanning ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Shield className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {scans.length === 0
              ? 'Run a scan to check for exposed secrets.'
              : 'No open security findings.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {findings.map((finding, i) => (
            <div
              key={finding.id ?? i}
              className="p-3 rounded-lg border bg-card space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{finding.secret_type}</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                    severityColors[finding.severity] ?? severityColors.low
                  }`}
                >
                  {finding.severity}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {finding.file_path}
                {finding.line_number ? `:${finding.line_number}` : ''}
              </p>
              <code className="text-xs bg-secondary px-2 py-1 rounded block">
                {finding.preview}
              </code>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground border-t pt-3">
        Security scanning powered by{' '}
        <a
          href="https://github.com/1FarukDev/Vaultless"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          Vaultless
        </a>{' '}
        by FarukDev.
      </p>
    </div>
  )
}
