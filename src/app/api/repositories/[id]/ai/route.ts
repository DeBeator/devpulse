import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { buildSystemPrompt } from '@/lib/ai/context'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

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

    const { message, history } = await request.json() as {
      message: string
      history: Array<{ role: 'user' | 'assistant'; content: string }>
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
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

    // Fetch all context data in parallel
    const [healthRes, insightsRes, findingsRes, commitsRes, prsRes, issuesRes, releasesRes, contributorsRes] =
      await Promise.all([
        supabase
          .from('health_scores')
          .select('*')
          .eq('repository_id', id)
          .order('calculated_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('insights')
          .select('severity, category, title, description, recommendation')
          .eq('repository_id', id)
          .eq('status', 'active'),
        supabase
          .from('security_findings')
          .select('severity')
          .eq('repository_id', id)
          .eq('status', 'open'),
        supabase
          .from('commits')
          .select('id', { count: 'exact', head: true })
          .eq('repository_id', id),
        supabase
          .from('pull_requests')
          .select('state, merged, opened_at')
          .eq('repository_id', id),
        supabase
          .from('issues')
          .select('state')
          .eq('repository_id', id),
        supabase
          .from('releases')
          .select('id', { count: 'exact', head: true })
          .eq('repository_id', id),
        supabase
          .from('contributors')
          .select('id', { count: 'exact', head: true })
          .eq('repository_id', id),
      ])

    const prs = prsRes.data ?? []
    const now = new Date()
    const stalePRs = prs.filter(
      (pr) =>
        pr.state === 'open' &&
        new Date(pr.opened_at) < new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    )
    const findings = findingsRes.data ?? []

    const context = {
      repository: {
        name: repository.name,
        full_name: repository.full_name,
        description: repository.description,
        language: repository.language,
      },
      health: healthRes.data ?? null,
      insights: insightsRes.data ?? [],
      security: {
        findings_count: findings.length,
        critical_count: findings.filter((f) => f.severity === 'critical').length,
        high_count: findings.filter((f) => f.severity === 'high').length,
      },
      stats: {
        total_commits: commitsRes.count ?? 0,
        open_prs: prs.filter((pr) => pr.state === 'open').length,
        merged_prs: prs.filter((pr) => pr.merged).length,
        stale_prs: stalePRs.length,
        open_issues: (issuesRes.data ?? []).filter((i) => i.state === 'open').length,
        closed_issues: (issuesRes.data ?? []).filter((i) => i.state === 'closed').length,
        total_releases: releasesRes.count ?? 0,
        contributor_count: contributorsRes.count ?? 0,
      },
    }

    const systemPrompt = buildSystemPrompt(context)

    // Build Gemini chat history
    // Gemini uses 'user' and 'model' roles
    const geminiHistory = (history ?? []).slice(-10).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
    })

    const chat = model.startChat({
      history: geminiHistory,
    })

    const result = await chat.sendMessage(message)
    const reply = result.response.text()

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('AI request failed:', error)
    return NextResponse.json(
      { error: 'AI request failed' },
      { status: 500 }
    )
  }
}
