import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { HabitForm } from '@/components/habits/habit-form'
import { createClient } from '@/lib/supabase/server'

export default async function NewHabitPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          <HabitForm userId={user.id} />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}