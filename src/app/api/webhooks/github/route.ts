import { verifyWebhookSignature } from '@/lib/github/webhook'
import { createServiceClient } from '@/lib/supabase/service'
import { createGitHubClient } from '@/lib/github/client'
import {
  syncCommits,
  syncPullRequests,
  syncIssues,
  syncReleases,
} from '@/lib/github/sync'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get('x-hub-signature-256')
    const event = request.headers.get('x-github-event')
    const deliveryId = request.headers.get('x-github-delivery')

    // Verify webhook signature
    const secret = process.env.GITHUB_WEBHOOK_SECRET
    if (!secret) {
      console.error('GITHUB_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    if (!verifyWebhookSignature(payload, signature, secret)) {
      console.warn('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Handle ping event
    if (event === 'ping') {
      return NextResponse.json({ ok: true })
    }

    const body = JSON.parse(payload) as {
      action?: string
      repository?: {
        id: number
        full_name: string
        owner: { login: string }
      }
    }

    if (!body.repository) {
      return NextResponse.json({ ok: true })
    }

    const supabase = createServiceClient()

    // Find repository in our database
    const { data: repository } = await supabase
      .from('repositories')
      .select('id, user_id, full_name')
      .eq('github_id', body.repository.id)
      .single()

    if (!repository) {
      // Repository not connected to DevPulse — ignore
      return NextResponse.json({ ok: true })
    }

    // Idempotency check — skip if already processed
    if (deliveryId) {
      const { data: existing } = await supabase
        .from('webhook_events')
        .select('id')
        .eq('github_delivery_id', deliveryId)
        .single()

      if (existing) {
        return NextResponse.json({ ok: true, duplicate: true })
      }
    }

    // Record webhook event
    const { data: webhookEvent } = await supabase
      .from('webhook_events')
      .insert({
        repository_id: repository.id,
        event_type: event,
        action: body.action ?? null,
        github_delivery_id: deliveryId,
        processed: false,
      })
      .select()
      .single()

    // Get GitHub token for this user
    const { data: githubAccount } = await supabase
      .from('github_accounts')
      .select('access_token')
      .eq('user_id', repository.user_id)
      .single()

    if (!githubAccount?.access_token) {
      await supabase
        .from('webhook_events')
        .update({ processed: false, error: 'No GitHub token found' })
        .eq('id', webhookEvent?.id)
      return NextResponse.json({ ok: true })
    }

    const [owner, repo] = repository.full_name.split('/')
    const octokit = createGitHubClient(githubAccount.access_token)

    try {
      // Process based on event type
      switch (event) {
        case 'push': {
          const since = new Date()
          since.setDate(since.getDate() - 1) // last 24h
          const commits = await syncCommits(
            octokit,
            owner,
            repo,
            since.toISOString()
          )
          if (commits.length > 0) {
            await supabase.from('commits').upsert(
              commits.map((c) => ({ ...c, repository_id: repository.id })),
              { onConflict: 'repository_id,sha' }
            )
          }
          break
        }

        case 'pull_request': {
          const prs = await syncPullRequests(octokit, owner, repo)
          if (prs.length > 0) {
            await supabase.from('pull_requests').upsert(
              prs.map((pr) => ({ ...pr, repository_id: repository.id })),
              { onConflict: 'repository_id,github_id' }
            )
          }
          break
        }

        case 'issues': {
          const issues = await syncIssues(octokit, owner, repo)
          if (issues.length > 0) {
            await supabase.from('issues').upsert(
              issues.map((issue) => ({
                ...issue,
                repository_id: repository.id,
                labels: JSON.stringify(issue.labels),
              })),
              { onConflict: 'repository_id,github_id' }
            )
          }
          break
        }

        case 'release': {
          const releases = await syncReleases(octokit, owner, repo)
          if (releases.length > 0) {
            await supabase.from('releases').upsert(
              releases.map((r) => ({ ...r, repository_id: repository.id })),
              { onConflict: 'repository_id,github_id' }
            )
          }
          break
        }

        default:
          break
      }

      // Mark as processed
      if (webhookEvent) {
        await supabase
          .from('webhook_events')
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
          })
          .eq('id', webhookEvent.id)
      }

      // Update last_synced_at
      await supabase
        .from('repositories')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', repository.id)

    } catch (processError) {
      console.error('Webhook processing error:', processError)
      if (webhookEvent) {
        await supabase
          .from('webhook_events')
          .update({
            processed: false,
            error: processError instanceof Error
              ? processError.message
              : 'Processing failed',
          })
          .eq('id', webhookEvent.id)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
