'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Habit, CommitmentMode } from '@/types/database.types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MoreVertical, Edit, Archive, Trash2, Target, Calendar, Clock, CheckCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { CheckInModal } from './check-in-modal'

interface HabitListProps {
  userId: string
}

const commitmentModeConfig = {
  free_flow: {
    label: 'Free Flow',
    color: 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20',
    description: 'Check in whenever you feel like it'
  },
  gentle_rhythm: {
    label: 'Gentle Rhythm',
    color: 'bg-green-500/10 text-green-700 hover:bg-green-500/20',
    description: 'Suggested check-ins with flexibility'
  },
  committed_path: {
    label: 'Committed Path',
    color: 'bg-purple-500/10 text-purple-700 hover:bg-purple-500/20',
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

export function HabitList({ userId }: HabitListProps) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [checkInModalOpen, setCheckInModalOpen] = useState(false)
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchHabits()
  }, [userId])

  const fetchHabits = async () => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      setHabits(data || [])
    } catch (error) {
      console.error('Error fetching habits:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async (habitId: string) => {
    try {
      const { error } = await supabase
        .from('habits')
        .update({ is_archived: true })
        .eq('id', habitId)

      if (error) throw error
      await fetchHabits()
    } catch (error) {
      console.error('Error archiving habit:', error)
    }
  }

  const handleDelete = async (habitId: string) => {
    if (!confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId)

      if (error) throw error
      await fetchHabits()
    } catch (error) {
      console.error('Error deleting habit:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  if (habits.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No habits yet</h3>
          <p className="text-muted-foreground mb-4">
            Start building your first habit to track your progress
          </p>
          <Button asChild>
            <Link href="/dashboard/habits/new">Create Your First Habit</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {habits.map((habit) => {
        const category = categoryConfig[habit.category]
        const commitmentMode = commitmentModeConfig[habit.commitment_mode]
        
        return (
          <Card key={habit.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{category.icon}</span>
                    <CardTitle className="text-xl">{habit.name}</CardTitle>
                  </div>
                  {habit.description && (
                    <CardDescription>{habit.description}</CardDescription>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/habits/${habit.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleArchive(habit.id)}>
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(habit.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge className={commitmentMode.color}>
                  {commitmentMode.label}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <span className="text-xs">{category.icon}</span>
                  {category.label}
                </Badge>
                {habit.target_frequency && (
                  <Badge variant="secondary" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {habit.target_frequency}
                  </Badge>
                )}
                {habit.reminder_time && (
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {habit.reminder_time}
                  </Badge>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => {
                    setSelectedHabit(habit)
                    setCheckInModalOpen(true)
                  }}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Quick Check-In
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/dashboard/habits/${habit.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
      
      {selectedHabit && (
        <CheckInModal
          open={checkInModalOpen}
          onOpenChange={setCheckInModalOpen}
          habitId={selectedHabit.id}
          habitName={selectedHabit.name}
          userId={userId}
          onSuccess={() => {
            // Optionally refresh habits or show success message
            console.log('Check-in successful')
          }}
        />
      )}
    </div>
  )
}