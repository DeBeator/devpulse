import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface ConnectRepositoryBody {
  github_id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  html_url: string
  default_branch: string
  language: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ConnectRepositoryBody = await request.json()

    if (!body.github_id || !body.name || !body.full_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: existing } = await supabase
      .from('repositories')
      .select('id')
      .eq('user_id', user.id)
      .eq('github_id', body.github_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Repository already connected' },
        { status: 409 }
      )
    }

    const { data: repository, error: insertError } = await supabase
      .from('repositories')
      .insert({
        user_id: user.id,
        github_id: body.github_id,
        name: body.name,
        full_name: body.full_name,
        description: body.description,
        private: body.private,
        html_url: body.html_url,
        default_branch: body.default_branch,
        language: body.language,
        stargazers_count: body.stargazers_count,
        forks_count: body.forks_count,
        open_issues_count: body.open_issues_count,
        sync_status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to connect repository:', insertError)
      return NextResponse.json(
        { error: 'Failed to connect repository' },
        { status: 500 }
      )
    }

    return NextResponse.json({ repository })
  } catch (error) {
    console.error('Failed to connect repository:', error)
    return NextResponse.json(
      { error: 'Failed to connect repository' },
      { status: 500 }
    )
  }
}
