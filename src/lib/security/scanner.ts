/**
 * Security scanning powered by Vaultless by FarukDev.
 * https://github.com/1FarukDev/Vaultless
 */

import { Octokit } from '@octokit/rest'

export interface SecurityFinding {
  file_path: string
  line_number: number | null
  secret_type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  preview: string
}

export interface ScanResult {
  files_scanned: number
  findings: SecurityFinding[]
  scan_mode: 'quick' | 'deep'
}

interface VaultlessExport {
  scanContent?: (content: string, filename?: string) => Array<{
    line: number
    type: string
    preview: string
  }>
  scan?: (content: string, filename?: string) => Array<{
    line: number
    type: string
    preview: string
  }>
  default?: VaultlessExport
}

// Mask a secret value for safe display
// Shows first 4 and last 4 characters only
export function maskSecret(value: string): string {
  if (value.length <= 8) return '****'
  return `${value.slice(0, 4)}${'*'.repeat(Math.max(4, value.length - 8))}${value.slice(-4)}`
}

// Map secret types to severity levels
function getSeverity(type: string): 'critical' | 'high' | 'medium' | 'low' {
  const critical = ['token', 'api_key', 'aws_key', 'openai_key', 'github_token']
  const high = ['password', 'secret', 'private_key']
  const medium = ['db_uri', 'connection_string']
  if (critical.some((t) => type.toLowerCase().includes(t))) return 'critical'
  if (high.some((t) => type.toLowerCase().includes(t))) return 'high'
  if (medium.some((t) => type.toLowerCase().includes(t))) return 'medium'
  return 'low'
}

export async function scanRepository(
  octokit: Octokit,
  owner: string,
  repo: string,
  mode: 'quick' | 'deep' = 'quick'
): Promise<ScanResult> {
  // Dynamically import vaultless scanner
  // This avoids issues if the package structure varies
  let scanContent:
    | ((content: string, filename?: string) => Array<{
        line: number
        type: string
        preview: string
      }>)
    | null = null

  try {
    let vaultless: VaultlessExport | undefined
    try {
      vaultless = (await import('vaultless')) as VaultlessExport
    } catch {
      // fallback
    }

    scanContent =
      vaultless?.scanContent ??
      vaultless?.default?.scanContent ??
      vaultless?.scan ??
      vaultless?.default?.scan ??
      null

    if (!scanContent) {
      try {
        const scannerModule = (await import('vaultless/dist/scanner.js')) as VaultlessExport
        scanContent =
          scannerModule.scanContent ??
          scannerModule.default?.scanContent ??
          null
      } catch {
        // empty catch
      }
    }

    if (!scanContent) {
      throw new Error('Could not find scan function in vaultless package')
    }
  } catch (err) {
    console.error('Failed to load vaultless:', err)
    throw new Error('Vaultless scanner could not be loaded')
  }

  const findings: SecurityFinding[] = []
  let filesScanned = 0

  try {
    // Get repository file tree
    const { data: tree } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: 'HEAD',
      recursive: '1',
    })

    // Filter to scannable files (skip binaries, large files, node_modules)
    const files = tree.tree.filter(
      (item) =>
        item.type === 'blob' &&
        item.path &&
        !item.path.includes('node_modules') &&
        !item.path.includes('.git') &&
        !item.path.includes('dist/') &&
        !item.path.includes('.next/') &&
        (item.size ?? 0) < 200000 // skip files > 200KB
    )

    // Scan each file
    for (const file of files.slice(0, 250)) {
      // max 250 files
      if (!file.path || !file.sha) continue

      try {
        const { data: blob } = await octokit.git.getBlob({
          owner,
          repo,
          file_sha: file.sha,
        })

        const content = Buffer.from(blob.content, 'base64').toString('utf-8')
        filesScanned++

        const fileFindings = scanContent(content, file.path)

        for (const finding of fileFindings) {
          findings.push({
            file_path: file.path,
            line_number: finding.line ?? null,
            secret_type: finding.type,
            severity: getSeverity(finding.type),
            preview: maskSecret(finding.preview ?? ''),
          })
        }
      } catch {
        // Skip files that can't be decoded (binaries etc)
        continue
      }
    }
  } catch (err) {
    console.error('Scan error:', err)
    throw err
  }

  return {
    files_scanned: filesScanned,
    findings,
    scan_mode: mode,
  }
}
