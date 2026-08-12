import { createClient } from '@/lib/supabase/server'

export async function getGitHubToken(userId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('github_accounts')
    .select('access_token')
    .eq('user_id', userId)
    .single()

  if (error || !data?.access_token) {
    return null
  }

  return data.access_token
}
