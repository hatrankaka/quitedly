'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Habit, CheckIn, Milestone } from '@/types/database.types'
import { calculateStreak, calculateHabitStats, getHabitPatterns } from '@/utils/progress-utils'
import { Brain, Lightbulb, TrendingUp, Target, Calendar, RefreshCw, Sparkles, ChevronRight, Award, AlertTriangle, Zap } from 'lucide-react'
import { format, differenceInDays, startOfDay } from 'date-fns'

interface InsightsPanelProps {
  habits: Habit[]
  checkIns: CheckIn[]
  milestones: Milestone[]
}

interface Insight {
  id: string
  type: 'tip' | 'warning' | 'achievement' | 'suggestion'
  title: string
  description: string
  actionLabel?: string
  priority: 'high' | 'medium' | 'low'
  icon: React.ElementType
}

export function InsightsPanel({ habits, checkIns, milestones }: InsightsPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [insights, setInsights] = useState<Insight[]>([])

  // Generate insights based on data analysis
  const generateInsights = () => {
    setIsGenerating(true)
    
    // Simulate AI processing
    setTimeout(() => {
      const newInsights: Insight[] = []

      // Analyze streaks
      habits.forEach(habit => {
        const habitCheckIns = checkIns.filter(ci => ci.habit_id === habit.id)
        const streakData = calculateStreak(habitCheckIns)
        const stats = calculateHabitStats(habit, habitCheckIns)

        // Streak-based insights
        if (streakData.currentStreak >= 7 && streakData.currentStreak < 14) {
          newInsights.push({
            id: `streak-${habit.id}`,
            type: 'achievement',
            title: `${habit.name} is building momentum!`,
            description: `You've maintained a ${streakData.currentStreak}-day streak. Keep it up for 2 weeks to solidify this habit.`,
            priority: 'high',
            icon: Zap,
          })
        }

        if (streakData.currentStreak === 0 && streakData.lastCheckIn) {
          const daysSince = differenceInDays(new Date(), new Date(streakData.lastCheckIn))
          if (daysSince > 3 && daysSince < 7) {
            newInsights.push({
              id: `streak-broken-${habit.id}`,
              type: 'warning',
              title: `${habit.name} needs attention`,
              description: `It's been ${daysSince} days since your last check-in. Don't let this habit slip away!`,
              actionLabel: 'Check in now',
              priority: 'high',
              icon: AlertTriangle,
            })
          }
        }

        // Completion rate insights
        if (stats.completionRate < 30 && stats.totalCheckIns > 5) {
          newInsights.push({
            id: `completion-${habit.id}`,
            type: 'suggestion',
            title: `Adjust ${habit.name} frequency?`,
            description: `Your completion rate is ${stats.completionRate.toFixed(0)}%. Consider reducing the target frequency to build consistency first.`,
            priority: 'medium',
            icon: Target,
          })
        }

        // Pattern insights
        if (stats.mostActiveDay && stats.mostActiveHour !== null) {
          newInsights.push({
            id: `pattern-${habit.id}`,
            type: 'tip',
            title: `Best time for ${habit.name}`,
            description: `You're most consistent with this habit on ${stats.mostActiveDay}s around ${stats.mostActiveHour > 12 ? stats.mostActiveHour - 12 : stats.mostActiveHour}${stats.mostActiveHour >= 12 ? 'pm' : 'am'}. Try scheduling it at this time.`,
            priority: 'low',
            icon: Calendar,
          })
        }
      })

      // Milestone insights
      const upcomingMilestones = milestones.filter(m => 
        !m.is_completed && m.target_date && differenceInDays(new Date(m.target_date), new Date()) <= 7
      )
      
      if (upcomingMilestones.length > 0) {
        newInsights.push({
          id: 'milestones-upcoming',
          type: 'tip',
          title: `${upcomingMilestones.length} milestone${upcomingMilestones.length > 1 ? 's' : ''} coming up`,
          description: `You have milestones due within the next week. Focus on these to maintain momentum!`,
          priority: 'medium',
          icon: Award,
        })
      }

      // Overall insights
      const totalCheckInsThisWeek = checkIns.filter(ci => {
        const checkInDate = new Date(ci.created_at)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return checkInDate >= weekAgo
      }).length

      const avgCheckInsPerWeek = checkIns.length > 0 
        ? totalCheckInsThisWeek 
        : 0

      if (avgCheckInsPerWeek > habits.length * 5) {
        newInsights.push({
          id: 'high-activity',
          type: 'achievement',
          title: 'Exceptional week!',
          description: `You've checked in ${totalCheckInsThisWeek} times this week. Your dedication is paying off!`,
          priority: 'high',
          icon: Sparkles,
        })
      }

      // Habit stacking suggestion
      const patterns = getHabitPatterns(checkIns)
      if (patterns.hourlyDistribution.some(h => h.count > checkIns.length * 0.2)) {
        newInsights.push({
          id: 'habit-stacking',
          type: 'suggestion',
          title: 'Try habit stacking',
          description: 'You have consistent check-in times. Link new habits to existing ones during these peak times for better success.',
          priority: 'low',
          icon: Lightbulb,
        })
      }

      // Sort by priority
      newInsights.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })

      setInsights(newInsights)
      setIsGenerating(false)
    }, 1500)
  }

  const getInsightColor = (type: Insight['type']) => {
    switch (type) {
      case 'achievement':
        return 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200'
      case 'warning':
        return 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200'
      case 'tip':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200'
      case 'suggestion':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-200'
    }
  }

  const getInsightBadge = (type: Insight['type']) => {
    switch (type) {
      case 'achievement':
        return 'Achievement'
      case 'warning':
        return 'Attention'
      case 'tip':
        return 'Tip'
      case 'suggestion':
        return 'Suggestion'
    }
  }

  // Auto-generate insights on mount
  React.useEffect(() => {
    if (habits.length > 0 && checkIns.length > 0) {
      generateInsights()
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* AI Insights Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>AI-Powered Insights</CardTitle>
                <CardDescription>
                  Personalized recommendations based on your progress
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={generateInsights}
              disabled={isGenerating}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Insights List */}
      {isGenerating ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <Brain className="h-12 w-12 text-muted-foreground animate-pulse" />
                <Sparkles className="h-6 w-6 text-purple-500 absolute -top-1 -right-1 animate-ping" />
              </div>
              <p className="mt-4 text-muted-foreground">Analyzing your habits...</p>
              <p className="text-sm text-muted-foreground">This may take a moment</p>
            </div>
          </CardContent>
        </Card>
      ) : insights.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Not enough data to generate insights yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Keep tracking your habits to unlock personalized recommendations!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => (
            <Card key={insight.id} className={`border-l-4 ${
              insight.type === 'achievement' ? 'border-l-green-500' :
              insight.type === 'warning' ? 'border-l-red-500' :
              insight.type === 'tip' ? 'border-l-blue-500' :
              'border-l-purple-500'
            }`}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getInsightColor(insight.type)}`}>
                    {React.createElement(insight.icon, { className: 'h-5 w-5' })}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{insight.title}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {getInsightBadge(insight.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    {insight.actionLabel && (
                      <Button variant="link" className="h-auto p-0 text-sm">
                        {insight.actionLabel}
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI Features Coming Soon */}
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-lg">Coming Soon: Advanced AI Features</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              Predictive analytics for habit success rates
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              Personalized habit recommendations based on your goals
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              Smart reminders that adapt to your schedule
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              Correlation analysis between habits and well-being
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              Natural language progress summaries
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}