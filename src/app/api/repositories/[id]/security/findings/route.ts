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
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    const { data: scans } = await supabase
      .from('security_scans')
      .select('*')
      .eq('repository_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: findings } = await supabase
      .from('security_findings')
      .select('*')
      .eq('repository_id', id)
      .eq('status', 'open')
      .order('severity', { ascending: true })

    return NextResponse.json({
      scans: scans ?? [],
      findings: findings ?? [],
    })
  } catch (error) {
    console.error('Failed to fetch security data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch security data' },
      { status: 500 }
    )
  }
}
