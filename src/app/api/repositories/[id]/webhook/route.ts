import { createClient } from '@/lib/supabase/server'
import { createGitHubClient } from '@/lib/github/client'
import { getGitHubToken } from '@/lib/github/token'
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
        { error: 'GitHub token not found' },
        { status: 401 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl || appUrl === 'http://localhost:3000') {
      return NextResponse.json(
        { error: 'Webhooks require a public URL. Deploy to Vercel or use a tunnel.' },
        { status: 400 }
      )
    }

    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET
    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'GITHUB_WEBHOOK_SECRET not configured' },
        { status: 500 }
      )
    }

    const [owner, repo] = repository.full_name.split('/')
    const octokit = createGitHubClient(accessToken)

    const { data: hook } = await octokit.repos.createWebhook({
      owner,
      repo,
      config: {
        url: `${appUrl}/api/webhooks/github`,
        content_type: 'json',
        secret: webhookSecret,
        insecure_ssl: '0',
      },
      events: ['push', 'pull_request', 'issues', 'release'],
      active: true,
    })

    return NextResponse.json({
      webhook_id: hook.id,
      url: hook.config.url,
      events: hook.events,
    })
  } catch (error) {
    console.error('Failed to create webhook:', error)
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    )
  }
}
