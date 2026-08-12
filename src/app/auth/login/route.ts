import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url)
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${origin}/auth/callback`,
      scopes: 'read:user user:email repo',
    },
  })

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
  }

  return NextResponse.redirect(data.url)
}
