import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckInHistory } from '@/components/habits/check-in-history'
import Link from 'next/link'
import { ArrowLeft, Edit, Calendar, Clock, Target } from 'lucide-react'

const commitmentModeConfig = {
  free_flow: {
    label: 'Free Flow',
    color: 'bg-blue-500/10 text-blue-700',
    description: 'Check in whenever you feel like it'
  },
  gentle_rhythm: {
    label: 'Gentle Rhythm',
    color: 'bg-green-500/10 text-green-700',
    description: 'Suggested check-ins with flexibility'
  },
  committed_path: {
    label: 'Committed Path',
    color: 'bg-purple-500/10 text-purple-700',
    description: 'Scheduled check-ins with reminders'
  }
}

const categoryConfig = {
  health: { label: 'Health', icon: '💪' },
  productivity: { label: 'Productivity', icon: '📈' },
  personal: { label: 'Personal', icon: '🌟' },
  relationships: { label: 'Relationships', icon: '❤️' },
  finance: { label: 'Finance', icon: '💰' },
  learning: { label: 'Learning', icon: '📚' },
  creative: { label: 'Creative', icon: '🎨' },
  other: { label: 'Other', icon: '✨' },
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default async function HabitDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Get user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/signin')
  }

  // Get habit details
  const { data: habit, error } = await supabase
    .from('habits')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !habit) {
    redirect('/dashboard')
  }

  const category = categoryConfig[habit.category as keyof typeof categoryConfig]
  const commitmentMode = commitmentModeConfig[habit.commitment_mode as keyof typeof commitmentModeConfig]

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/habits/${habit.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Habit
          </Link>
        </Button>
      </div>

      {/* Habit Details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{category.icon}</span>
                <CardTitle className="text-2xl">{habit.name}</CardTitle>
              </div>
              {habit.description && (
                <CardDescription className="text-base mt-2">
                  {habit.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Commitment Mode</p>
                <Badge className={commitmentMode.color}>
                  {commitmentMode.label}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {commitmentMode.description}
                </p>
              </div>
              
              {habit.target_frequency && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Target Frequency</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{habit.target_frequency}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {habit.preferred_days && habit.preferred_days.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Preferred Days</p>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                      <div
                        key={day}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          habit.preferred_days?.includes(day)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {dayNames[day]}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {habit.reminder_time && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Reminder Time</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{habit.reminder_time}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <Button asChild>
              <Link href={`/dashboard/habits/${habit.id}/check-in`}>
                <Target className="h-4 w-4 mr-2" />
                New Check-In
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Check-in History */}
      <CheckInHistory 
        habitId={habit.id} 
        habitName={habit.name}
        showHeader={true}
      />
    </div>
  )
}