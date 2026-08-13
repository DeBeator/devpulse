import { createClient } from '@/lib/supabase/server'
import { generateInsights } from '@/lib/insights/engine'
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
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    const [commitsRes, prsRes, issuesRes, releasesRes, contributorsRes] =
      await Promise.all([
        supabase
          .from('commits')
          .select('committed_at, additions, deletions')
          .eq('repository_id', id),
        supabase
          .from('pull_requests')
          .select('state, merged, opened_at, merged_at, closed_at, review_comments')
          .eq('repository_id', id),
        supabase
          .from('issues')
          .select('state, opened_at, closed_at')
          .eq('repository_id', id),
        supabase
          .from('releases')
          .select('published_at, prerelease')
          .eq('repository_id', id),
        supabase
          .from('contributors')
          .select('contributions, github_login')
          .eq('repository_id', id),
      ])

    const insights = generateInsights({
      commits: commitsRes.data ?? [],
      pullRequests: prsRes.data ?? [],
      issues: issuesRes.data ?? [],
      releases: releasesRes.data ?? [],
      contributors: contributorsRes.data ?? [],
    })

    // Clear existing active insights for this repo
    await supabase
      .from('insights')
      .update({ status: 'resolved' })
      .eq('repository_id', id)
      .eq('status', 'active')

    // Insert new insights
    if (insights.length > 0) {
      await supabase.from('insights').insert(
        insights.map((insight) => ({
          repository_id: id,
          severity: insight.severity,
          category: insight.category,
          title: insight.title,
          description: insight.description,
          recommendation: insight.recommendation,
          evidence: insight.evidence,
          status: 'active',
        }))
      )
    }

    return NextResponse.json({ insights, count: insights.length })
  } catch (error) {
    console.error('Insight generation failed:', error)
    return NextResponse.json(
      { error: 'Insight generation failed' },
      { status: 500 }
    )
  }
}

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
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    const { data: insights } = await supabase
      .from('insights')
      .select('*')
      .eq('repository_id', id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    return NextResponse.json({ insights: insights ?? [] })
  } catch (error) {
    console.error('Failed to fetch insights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    )
  }
}
