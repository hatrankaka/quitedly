'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Milestone, Habit } from '@/types/database.types'
import { format, isPast, isFuture, isToday, differenceInDays } from 'date-fns'
import { Trophy, Target, Calendar, Plus, Check, Clock, AlertCircle, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface MilestoneTrackerProps {
  milestones: Milestone[]
  habits: Habit[]
}

export function MilestoneTracker({ milestones: initialMilestones, habits }: MilestoneTrackerProps) {
  const [milestones, setMilestones] = useState(initialMilestones)
  const [isCreating, setIsCreating] = useState(false)
  const [newMilestone, setNewMilestone] = useState({
    habitId: '',
    name: '',
    description: '',
    targetDate: '',
  })
  const supabase = createClient()

  // Group milestones by status
  const completedMilestones = milestones.filter(m => m.is_completed)
  const upcomingMilestones = milestones.filter(m => !m.is_completed && m.target_date && isFuture(new Date(m.target_date)))
  const overdueMilestones = milestones.filter(m => !m.is_completed && m.target_date && isPast(new Date(m.target_date)))
  const noDateMilestones = milestones.filter(m => !m.is_completed && !m.target_date)

  const handleCreateMilestone = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('milestones')
        .insert({
          user_id: user.id,
          habit_id: newMilestone.habitId,
          name: newMilestone.name,
          description: newMilestone.description || null,
          target_date: newMilestone.targetDate || null,
        })
        .select()
        .single()

      if (error) throw error

      setMilestones([data, ...milestones])
      setNewMilestone({ habitId: '', name: '', description: '', targetDate: '' })
      setIsCreating(false)
    } catch (error) {
      console.error('Error creating milestone:', error)
    }
  }

  const handleCompleteMilestone = async (milestoneId: string) => {
    try {
      const { error } = await supabase
        .from('milestones')
        .update({
          is_completed: true,
          completed_date: new Date().toISOString(),
        })
        .eq('id', milestoneId)

      if (error) throw error

      setMilestones(milestones.map(m => 
        m.id === milestoneId 
          ? { ...m, is_completed: true, completed_date: new Date().toISOString() }
          : m
      ))
    } catch (error) {
      console.error('Error completing milestone:', error)
    }
  }

  const getMilestoneIcon = (milestone: Milestone) => {
    if (milestone.is_completed) return <Check className="h-4 w-4 text-green-500" />
    if (milestone.target_date) {
      if (isPast(new Date(milestone.target_date))) return <AlertCircle className="h-4 w-4 text-red-500" />
      if (isToday(new Date(milestone.target_date))) return <Sparkles className="h-4 w-4 text-yellow-500" />
    }
    return <Target className="h-4 w-4 text-muted-foreground" />
  }

  const getMilestoneStatus = (milestone: Milestone) => {
    if (milestone.is_completed) return 'completed'
    if (milestone.target_date) {
      if (isPast(new Date(milestone.target_date))) return 'overdue'
      if (isToday(new Date(milestone.target_date))) return 'today'
      const daysUntil = differenceInDays(new Date(milestone.target_date), new Date())
      if (daysUntil <= 7) return 'soon'
    }
    return 'pending'
  }

  const MilestoneCard = ({ milestone }: { milestone: Milestone }) => {
    const habit = habits.find(h => h.id === milestone.habit_id)
    const status = getMilestoneStatus(milestone)
    
    return (
      <div className={`p-4 rounded-lg border transition-all ${
        status === 'completed' ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' :
        status === 'overdue' ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900' :
        status === 'today' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900' :
        status === 'soon' ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900' :
        'bg-muted/50 border-border'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getMilestoneIcon(milestone)}
              <h4 className="font-medium">{milestone.name}</h4>
            </div>
            {milestone.description && (
              <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {habit && (
                <Badge variant="outline" className="text-xs">
                  {habit.name}
                </Badge>
              )}
              {milestone.target_date && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(milestone.target_date), 'MMM d, yyyy')}
                </span>
              )}
              {milestone.is_completed && milestone.completed_date && (
                <span className="flex items-center gap-1 text-green-600">
                  <Trophy className="h-3 w-3" />
                  Completed {format(new Date(milestone.completed_date), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>
          {!milestone.is_completed && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleCompleteMilestone(milestone.id)}
              className="ml-2"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Trophy className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedMilestones.length}</div>
            <p className="text-xs text-muted-foreground">
              Achievements unlocked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingMilestones.length + noDateMilestones.length}</div>
            <p className="text-xs text-muted-foreground">
              Working towards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {upcomingMilestones.filter(m => {
                const daysUntil = differenceInDays(new Date(m.target_date!), new Date())
                return daysUntil <= 7 && daysUntil >= 0
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Next 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueMilestones.length}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create New Milestone */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Milestones</CardTitle>
              <CardDescription>
                Set goals and track your progress towards major achievements
              </CardDescription>
            </div>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Milestone</DialogTitle>
                  <DialogDescription>
                    Set a goal to work towards in your habit journey
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="habit">Habit</Label>
                    <Select 
                      value={newMilestone.habitId} 
                      onValueChange={(value) => setNewMilestone({ ...newMilestone, habitId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a habit" />
                      </SelectTrigger>
                      <SelectContent>
                        {habits.map(habit => (
                          <SelectItem key={habit.id} value={habit.id}>
                            {habit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Milestone Name</Label>
                    <Input
                      id="name"
                      value={newMilestone.name}
                      onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                      placeholder="e.g., 30-day streak, Run a 5K"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      value={newMilestone.description}
                      onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                      placeholder="Add details about this milestone..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetDate">Target Date (optional)</Label>
                    <Input
                      id="targetDate"
                      type="date"
                      value={newMilestone.targetDate}
                      onChange={(e) => setNewMilestone({ ...newMilestone, targetDate: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateMilestone}
                    disabled={!newMilestone.habitId || !newMilestone.name}
                  >
                    Create Milestone
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overdue Milestones */}
          {overdueMilestones.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3 text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Overdue
              </h3>
              <div className="space-y-2">
                {overdueMilestones.map(milestone => (
                  <MilestoneCard key={milestone.id} milestone={milestone} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Milestones */}
          {upcomingMilestones.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Upcoming
              </h3>
              <div className="space-y-2">
                {upcomingMilestones.map(milestone => (
                  <MilestoneCard key={milestone.id} milestone={milestone} />
                ))}
              </div>
            </div>
          )}

          {/* No Date Milestones */}
          {noDateMilestones.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Ongoing
              </h3>
              <div className="space-y-2">
                {noDateMilestones.map(milestone => (
                  <MilestoneCard key={milestone.id} milestone={milestone} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Milestones */}
          {completedMilestones.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3 text-green-600 flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Completed
              </h3>
              <div className="space-y-2">
                {completedMilestones.slice(0, 5).map(milestone => (
                  <MilestoneCard key={milestone.id} milestone={milestone} />
                ))}
              </div>
            </div>
          )}

          {milestones.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No milestones yet. Create your first milestone to track major achievements!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}