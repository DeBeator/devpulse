import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      const session = data.session
      const user = session.user
      const providerToken = session.provider_token

      if (providerToken && user) {
        const githubId = user.user_metadata?.provider_id
          ? parseInt(user.user_metadata.provider_id)
          : user.user_metadata?.sub
            ? parseInt(user.user_metadata.sub)
            : null

        if (githubId) {
          await supabase
            .from('github_accounts')
            .upsert(
              {
                user_id: user.id,
                github_id: githubId,
                github_login: user.user_metadata?.user_name ?? '',
                github_name: user.user_metadata?.full_name ?? null,
                github_avatar_url: user.user_metadata?.avatar_url ?? null,
                github_email: user.email ?? null,
                access_token: providerToken,
              },
              { onConflict: 'github_id' }
            )
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
