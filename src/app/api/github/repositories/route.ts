import { createClient } from '@/lib/supabase/server'
import { createGitHubClient } from '@/lib/github/client'
import { fetchUserRepositories } from '@/lib/github/repositories'
import { getGitHubToken } from '@/lib/github/token'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accessToken = await getGitHubToken(user.id)

    if (!accessToken) {
      return NextResponse.json(
        { error: 'GitHub token not found. Please sign in again.' },
        { status: 401 }
      )
    }

    const octokit = createGitHubClient(accessToken)
    const repositories = await fetchUserRepositories(octokit)

    return NextResponse.json({ repositories })
  } catch (error) {
    console.error('Failed to fetch GitHub repositories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    )
  }
}
