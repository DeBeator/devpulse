import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, ShieldAlert, ShieldCheck, AlertCircle } from 'lucide-react'

export default async function GlobalSecurityPage() {
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
        <Shield className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">No repositories connected</h2>
      </div>
    )
  }

  const { data: findings } = await supabase
    .from('security_findings')
    .select('*')
    .in('repository_id', repoIds)
    .eq('status', 'open')
    .order('severity', { ascending: true })

  const { data: scans } = await supabase
    .from('security_scans')
    .select('repository_id, status, completed_at, findings_count, files_scanned')
    .in('repository_id', repoIds)
    .order('created_at', { ascending: false })

  // Latest scan per repo
  const latestScans = new Map<string, NonNullable<typeof scans>[number]>()
  for (const scan of scans ?? []) {
    if (!latestScans.has(scan.repository_id)) {
      latestScans.set(scan.repository_id, scan)
    }
  }

  const allFindings = findings ?? []
  const critical = allFindings.filter((f) => f.severity === 'critical')
  const high = allFindings.filter((f) => f.severity === 'high')
  const medium = allFindings.filter((f) => f.severity === 'medium')
  const low = allFindings.filter((f) => f.severity === 'low')

  const repoMap = new Map(
    (repositories ?? []).map((r) => [r.id, r.full_name])
  )

  const severityColors: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-500 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Security</h1>
          <p className="text-muted-foreground mt-1">
            Security findings across all repositories.
          </p>
        </div>
        {allFindings.length === 0 ? (
          <ShieldCheck className="h-8 w-8 text-green-500" />
        ) : (
          <ShieldAlert className="h-8 w-8 text-red-500" />
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Critical', value: critical.length, color: 'text-red-500' },
          { label: 'High', value: high.length, color: 'text-orange-500' },
          { label: 'Medium', value: medium.length, color: 'text-yellow-500' },
          { label: 'Low', value: low.length, color: 'text-blue-500' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Repository scan status */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Repository scan status
        </h2>
        <div className="space-y-2">
          {(repositories ?? []).map((repo) => {
            const scan = latestScans.get(repo.id)
            return (
              <Link
                key={repo.id}
                href={`/dashboard/${repo.id}`}
                className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors bg-card"
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{repo.full_name}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {scan
                    ? `Last scan: ${new Date(scan.completed_at ?? '').toLocaleDateString()} · ${scan.findings_count ?? 0} findings`
                    : 'No scan yet'}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* All findings */}
      {allFindings.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Open findings ({allFindings.length})
          </h2>
          <div className="space-y-2">
            {allFindings.map((finding, i) => (
              <div
                key={finding.id ?? i}
                className="p-4 rounded-lg border bg-card space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {finding.secret_type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {repoMap.get(finding.repository_id) ?? 'Unknown repo'}
                    </span>
                  </div>
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
          <p className="text-xs text-muted-foreground mt-4">
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
      )}

      {allFindings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <ShieldCheck className="h-12 w-12 text-green-500" />
          <p className="text-sm font-medium">No open security findings</p>
          <p className="text-xs text-muted-foreground">
            Run a scan from a repository detail page to check for exposed secrets.
          </p>
        </div>
      )}
    </div>
  )
}
