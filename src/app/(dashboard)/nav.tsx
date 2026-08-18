'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BarChart2,
  Shield,
  Lightbulb,
  Settings,
  GitBranch,
} from 'lucide-react'

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Repositories', href: '/repositories', icon: GitBranch },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
  { label: 'Security', href: '/dashboard/security', icon: Shield },
  { label: 'Insights', href: '/dashboard/insights', icon: Lightbulb },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navItems.map((item) => {
        const active =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              active
                ? 'bg-accent text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
