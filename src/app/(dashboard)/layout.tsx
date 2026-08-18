import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import DashboardNav from './nav'
import ThemeToggle from '@/components/theme-toggle'
import ScrollToTop from '@/components/scroll-to-top'

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
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="w-56 border-r flex flex-col shrink-0">
        <div className="h-14 flex items-center px-5 border-b">
          <span className="font-semibold text-base tracking-tight">DevPulse</span>
        </div>
        <DashboardNav />
        <div className="p-3 border-t flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground flex-1 truncate">
            {fullName ?? user.email}
          </span>
          <form action="/auth/signout" method="POST">
            <Button variant="ghost" size="icon" className="h-7 w-7" type="submit">
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 border-b flex items-center justify-between px-6 shrink-0">
          <span className="text-sm text-muted-foreground">Dashboard</span>
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <ScrollToTop />
          {children}
        </main>
      </div>
    </div>
  )
}

