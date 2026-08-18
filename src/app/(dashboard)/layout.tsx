import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import DashboardNav from './nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined
  const fullName = user.user_metadata?.full_name as string | undefined
  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user.email?.[0].toUpperCase() ?? 'U'

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-60 border-r flex flex-col">
        <div className="h-14 flex items-center px-6 border-b">
          <span className="font-semibold text-lg">DevPulse</span>
        </div>
        <DashboardNav />
        <div className="p-3 border-t flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground flex-1 truncate">
            {fullName ?? user.email}
          </span>
          <form action="/auth/signout" method="POST">
            <Button variant="ghost" size="icon" type="submit">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b flex items-center px-6">
          <span className="text-sm text-muted-foreground">DevPulse Dashboard</span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
