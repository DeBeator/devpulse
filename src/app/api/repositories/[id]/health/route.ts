import { createClient } from '@/lib/supabase/server'
import { calculateHealthScore } from '@/lib/health/scoring'
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

    const { data: repository, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (repoError || !repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    // Fetch all data for scoring
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
          .select('contributions')
          .eq('repository_id', id),
      ])

    const result = calculateHealthScore({
      commits: commitsRes.data ?? [],
      pullRequests: prsRes.data ?? [],
      issues: issuesRes.data ?? [],
      releases: releasesRes.data ?? [],
      contributors: contributorsRes.data ?? [],
      hasReadme: true, // assume true for now
    })

    // Save health score
    const { data: healthScore, error: insertError } = await supabase
      .from('health_scores')
      .insert({
        repository_id: id,
        overall: result.overall,
        activity: result.activity,
        pull_requests: result.pull_requests,
        issues: result.issues,
        security: result.security,
        releases: result.releases,
        contributors: result.contributors,
        documentation: result.documentation,
        factors: result.factors,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to save health score:', insertError)
      return NextResponse.json(
        { error: 'Failed to save health score' },
        { status: 500 }
      )
    }

    return NextResponse.json({ healthScore: { ...healthScore, ...result } })
  } catch (error) {
    console.error('Health score calculation failed:', error)
    return NextResponse.json(
      { error: 'Health score calculation failed' },
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

    const { data: healthScore } = await supabase
      .from('health_scores')
      .select('*')
      .eq('repository_id', id)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({ healthScore: healthScore ?? null })
  } catch (error) {
    console.error('Failed to fetch health score:', error)
    return NextResponse.json(
      { error: 'Failed to fetch health score' },
      { status: 500 }
    )
  }
}
