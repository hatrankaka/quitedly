'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { StreakTracker } from '@/components/progress/streak-tracker'
import { ProgressCharts } from '@/components/progress/progress-charts'
import { MilestoneTracker } from '@/components/progress/milestone-tracker'
import { HabitPatterns } from '@/components/progress/habit-patterns'
import { ProgressReport } from '@/components/progress/progress-report'
import { InsightsPanel } from '@/components/progress/insights-panel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, TrendingUp, Calendar, Target, Brain, BarChart } from 'lucide-react'
import { Habit, CheckIn, Milestone } from '@/types/database.types'
import { useRouter } from 'next/navigation'

export default function ProgressDashboard() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [selectedHabitId, setSelectedHabitId] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Fetch habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })

      if (habitsError) throw habitsError

      // Fetch check-ins
      const { data: checkInsData, error: checkInsError } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (checkInsError) throw checkInsError

      // Fetch milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (milestonesError) throw milestonesError

      setHabits(habitsData || [])
      setCheckIns(checkInsData || [])
      setMilestones(milestonesData || [])
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load progress data')
    } finally {
      setLoading(false)
    }
  }

  const filteredCheckIns = selectedHabitId === 'all' 
    ? checkIns 
    : checkIns.filter(ci => ci.habit_id === selectedHabitId)

  const filteredMilestones = selectedHabitId === 'all'
    ? milestones
    : milestones.filter(m => m.habit_id === selectedHabitId)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your progress...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
            <Button 
              onClick={fetchData}
              className="w-full mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Progress Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Track your habits, celebrate wins, and discover insights
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedHabitId} onValueChange={setSelectedHabitId}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select habit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Habits</SelectItem>
                {habits.map(habit => (
                  <SelectItem key={habit.id} value={habit.id}>
                    {habit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={(value: 'week' | 'month' | 'year') => setTimeRange(value)}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Habits</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{habits.filter(h => h.is_active).length}</div>
            <p className="text-xs text-muted-foreground">
              {habits.length} total habits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredCheckIns.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredCheckIns.filter(ci => {
                const checkInDate = new Date(ci.created_at)
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return checkInDate >= weekAgo
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Check-ins this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Milestones</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredMilestones.filter(m => m.is_completed).length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {filteredMilestones.length} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="streaks">Streaks</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ProgressCharts 
            habits={selectedHabitId === 'all' ? habits : habits.filter(h => h.id === selectedHabitId)}
            checkIns={filteredCheckIns}
            timeRange={timeRange}
          />
          <ProgressReport
            habits={selectedHabitId === 'all' ? habits : habits.filter(h => h.id === selectedHabitId)}
            checkIns={filteredCheckIns}
            period={timeRange === 'week' ? 'weekly' : 'monthly'}
          />
        </TabsContent>

        <TabsContent value="streaks" className="space-y-4">
          <StreakTracker
            habits={selectedHabitId === 'all' ? habits : habits.filter(h => h.id === selectedHabitId)}
            checkIns={checkIns}
          />
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <HabitPatterns
            checkIns={filteredCheckIns}
            habits={selectedHabitId === 'all' ? habits : habits.filter(h => h.id === selectedHabitId)}
          />
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <MilestoneTracker
            milestones={filteredMilestones}
            habits={selectedHabitId === 'all' ? habits : habits.filter(h => h.id === selectedHabitId)}
          />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <InsightsPanel
            habits={selectedHabitId === 'all' ? habits : habits.filter(h => h.id === selectedHabitId)}
            checkIns={filteredCheckIns}
            milestones={filteredMilestones}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}