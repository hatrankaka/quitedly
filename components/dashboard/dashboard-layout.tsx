'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserAvatar } from '@/components/auth/user-avatar'
import { ReminderNotifications } from '@/components/habits/reminder-notifications'
import { cn } from '@/lib/utils'
import { Home, Target, Plus, BarChart3, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DashboardLayoutProps {
  children: React.ReactNode
  userId?: string
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Habits', href: '/dashboard/habits', icon: Target },
  { name: 'New Habit', href: '/dashboard/habits/new', icon: Plus },
  { name: 'Progress', href: '/dashboard/progress', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function DashboardLayout({ children, userId }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Get the current user ID if not provided
    if (!userId) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setCurrentUserId(user.id)
        }
      })
    } else {
      setCurrentUserId(userId)
    }
  }, [userId, supabase])

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold">
            Quitedly
          </Link>
          <UserAvatar />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 min-h-screen border-r bg-muted/10">
          <div className="p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Reminder Notifications */}
      {currentUserId && <ReminderNotifications userId={currentUserId} />}
    </div>
  )
}