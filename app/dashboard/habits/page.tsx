import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { HabitList } from '@/components/habits/habit-list'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function HabitsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Habits</h1>
              <p className="text-muted-foreground mt-2">
                Manage and track your daily habits
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/habits/new">
                <Plus className="mr-2 h-4 w-4" />
                New Habit
              </Link>
            </Button>
          </div>

          <HabitList userId={user.id} />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}