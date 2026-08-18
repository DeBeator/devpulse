import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
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

    const [commitsRes, prsRes, issuesRes, contributorsRes] = await Promise.all([
      supabase
        .from('commits')
        .select('committed_at, additions, deletions')
        .eq('repository_id', id)
        .order('committed_at', { ascending: true }),
      supabase
        .from('pull_requests')
        .select('opened_at, merged_at, closed_at, state, merged')
        .eq('repository_id', id)
        .order('opened_at', { ascending: true }),
      supabase
        .from('issues')
        .select('opened_at, closed_at, state')
        .eq('repository_id', id)
        .order('opened_at', { ascending: true }),
      supabase
        .from('contributors')
        .select('github_login, contributions, avatar_url')
        .eq('repository_id', id)
        .order('contributions', { ascending: false })
        .limit(10),
    ])

    return NextResponse.json({
      repository,
      commits: commitsRes.data ?? [],
      pull_requests: prsRes.data ?? [],
      issues: issuesRes.data ?? [],
      contributors: contributorsRes.data ?? [],
    })
  } catch (error) {
    console.error('Analytics fetch failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
