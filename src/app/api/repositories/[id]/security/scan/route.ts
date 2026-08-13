import { createClient } from '@/lib/supabase/server'
import { createGitHubClient } from '@/lib/github/client'
import { getGitHubToken } from '@/lib/github/token'
import { scanRepository } from '@/lib/security/scanner'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: repository } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    const accessToken = await getGitHubToken(user.id)
    if (!accessToken) {
      return NextResponse.json(
        { error: 'GitHub token not found. Please sign in again.' },
        { status: 401 }
      )
    }

    // Create scan record
    const { data: scan, error: scanError } = await supabase
      .from('security_scans')
      .insert({
        repository_id: id,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (scanError || !scan) {
      return NextResponse.json(
        { error: 'Failed to create scan record' },
        { status: 500 }
      )
    }

    try {
      const [owner, repo] = repository.full_name.split('/')
      const octokit = createGitHubClient(accessToken)

      const result = await scanRepository(octokit, owner, repo, 'quick')

      // Resolve previous findings before inserting new ones
      await supabase
        .from('security_findings')
        .update({ status: 'resolved' })
        .eq('repository_id', id)
        .eq('status', 'open')

      // Save findings (never store complete secret values)
      if (result.findings.length > 0) {
        await supabase.from('security_findings').insert(
          result.findings.map((finding) => ({
            scan_id: scan.id,
            repository_id: id,
            file_path: finding.file_path,
            line_number: finding.line_number,
            secret_type: finding.secret_type,
            severity: finding.severity,
            preview: finding.preview, // already masked
            status: 'open',
          }))
        )
      }

      // Update scan record
      await supabase
        .from('security_scans')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          files_scanned: result.files_scanned,
          findings_count: result.findings.length,
        })
        .eq('id', scan.id)

      // Calculate security score and update health score
      const criticalCount = result.findings.filter(
        (f) => f.severity === 'critical'
      ).length
      const highCount = result.findings.filter(
        (f) => f.severity === 'high'
      ).length
      const mediumCount = result.findings.filter(
        (f) => f.severity === 'medium'
      ).length

      let securityScore = 100
      securityScore -= criticalCount * 25
      securityScore -= highCount * 15
      securityScore -= mediumCount * 5
      securityScore = Math.max(0, securityScore)

      return NextResponse.json({
        scan_id: scan.id,
        files_scanned: result.files_scanned,
        findings_count: result.findings.length,
        security_score: securityScore,
        findings: result.findings,
      })
    } catch (scanErr) {
      await supabase
        .from('security_scans')
        .update({ status: 'failed' })
        .eq('id', scan.id)
      throw scanErr
    }
  } catch (error) {
    console.error('Security scan failed:', error)
    return NextResponse.json(
      { error: 'Security scan failed' },
      { status: 500 }
    )
  }
}
