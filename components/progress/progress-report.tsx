'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Habit, CheckIn } from '@/types/database.types'
import { generateProgressReport, calculateHabitStats } from '@/utils/progress-utils'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { TrendingUp, TrendingDown, Minus, Download, Share2, Calendar, BarChart3, Target, Activity } from 'lucide-react'

interface ProgressReportProps {
  habits: Habit[]
  checkIns: CheckIn[]
  period: 'weekly' | 'monthly'
}

export function ProgressReport({ habits, checkIns, period }: ProgressReportProps) {
  const report = generateProgressReport(habits, checkIns, period)
  
  // Calculate individual habit performance
  const habitPerformance = habits.map(habit => {
    const habitCheckIns = checkIns.filter(ci => ci.habit_id === habit.id)
    const currentPeriodCheckIns = habitCheckIns.filter(ci => {
      const checkInDate = new Date(ci.created_at)
      return checkInDate >= report.startDate && checkInDate <= report.endDate
    })
    
    const previousPeriodStart = period === 'weekly' 
      ? startOfWeek(new Date(report.startDate.getTime() - 7 * 24 * 60 * 60 * 1000))
      : startOfMonth(new Date(report.startDate.getTime() - 30 * 24 * 60 * 60 * 1000))
    const previousPeriodEnd = period === 'weekly'
      ? endOfWeek(new Date(report.startDate.getTime() - 7 * 24 * 60 * 60 * 1000))
      : endOfMonth(new Date(report.startDate.getTime() - 30 * 24 * 60 * 60 * 1000))
    
    const previousPeriodCheckIns = habitCheckIns.filter(ci => {
      const checkInDate = new Date(ci.created_at)
      return checkInDate >= previousPeriodStart && checkInDate <= previousPeriodEnd
    })
    
    const stats = calculateHabitStats(habit, habitCheckIns)
    const change = currentPeriodCheckIns.length - previousPeriodCheckIns.length
    
    return {
      habit,
      currentCheckIns: currentPeriodCheckIns.length,
      previousCheckIns: previousPeriodCheckIns.length,
      change,
      changePercent: previousPeriodCheckIns.length > 0 
        ? ((change / previousPeriodCheckIns.length) * 100).toFixed(0)
        : currentPeriodCheckIns.length > 0 ? '100' : '0',
      stats,
    }
  })

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const formatPeriodRange = () => {
    const start = format(report.startDate, 'MMM d')
    const end = format(report.endDate, 'MMM d, yyyy')
    return `${start} - ${end}`
  }

  const handleExportReport = () => {
    // In a real app, this would generate a PDF or CSV
    console.log('Exporting report...', report)
  }

  const handleShareReport = () => {
    // In a real app, this would share the report
    console.log('Sharing report...', report)
  }

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">
                {period === 'weekly' ? 'Weekly' : 'Monthly'} Progress Report
              </CardTitle>
              <CardDescription className="mt-1">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatPeriodRange()}
                </span>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShareReport}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportReport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.totalCheckIns}</div>
            <p className="text-xs text-muted-foreground">
              This {period === 'weekly' ? 'week' : 'month'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.completionRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              Average across habits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Habits</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.habitsCount}</div>
            <p className="text-xs text-muted-foreground">
              Being tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {report.streakSummary.maintained} maintained
              </Badge>
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                {report.streakSummary.improved} improved
              </Badge>
              {report.streakSummary.broken > 0 && (
                <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                  {report.streakSummary.broken} broken
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
          <CardDescription>
            Notable achievements and areas for improvement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.mostConsistentHabit && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Most Consistent Habit
                </p>
                <p className="text-lg font-semibold">{report.mostConsistentHabit.habitName}</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {report.mostConsistentHabit.completionRate.toFixed(0)}% completion rate
                </p>
              </div>
              <Trophy className="h-8 w-8 text-green-600" />
            </div>
          )}

          {report.leastConsistentHabit && report.leastConsistentHabit.completionRate < 50 && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20">
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Needs Attention
                </p>
                <p className="text-lg font-semibold">{report.leastConsistentHabit.habitName}</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {report.leastConsistentHabit.completionRate.toFixed(0)}% completion rate
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
          )}

          {report.totalCheckIns === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activity recorded this {period === 'weekly' ? 'week' : 'month'}.</p>
              <p className="text-sm mt-1">Start checking in to see your progress!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Habit Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Habit Performance</CardTitle>
          <CardDescription>
            Detailed breakdown of each habit's progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {habitPerformance.map(({ habit, currentCheckIns, previousCheckIns, change, changePercent, stats }) => (
              <div key={habit.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <h4 className="font-medium">{habit.name}</h4>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{currentCheckIns} check-ins</span>
                    <span>{stats.completionRate.toFixed(0)}% completion</span>
                    {stats.mostActiveDay && (
                      <span>Most active: {stats.mostActiveDay}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 sm:mt-0">
                  {getTrendIcon(change)}
                  <span className={`text-sm font-medium ${
                    change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {change > 0 ? '+' : ''}{changePercent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
          <CardDescription>
            Personalized suggestions based on your progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {report.streakSummary.broken > 0 && (
              <li className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                <p className="text-sm">
                  You have {report.streakSummary.broken} broken streak{report.streakSummary.broken > 1 ? 's' : ''}.
                  Consider setting reminders or adjusting your target frequency to make habits more sustainable.
                </p>
              </li>
            )}
            {report.mostConsistentHabit && report.mostConsistentHabit.completionRate >= 90 && (
              <li className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                <p className="text-sm">
                  Excellent work on {report.mostConsistentHabit.habitName}! 
                  Consider setting a new milestone or increasing the challenge.
                </p>
              </li>
            )}
            {report.completionRate < 50 && (
              <li className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                <p className="text-sm">
                  Your overall completion rate is below 50%. 
                  Try focusing on just 1-2 habits to build momentum before adding more.
                </p>
              </li>
            )}
            {habitPerformance.some(hp => hp.stats.mostActiveDay) && (
              <li className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                <p className="text-sm">
                  Schedule important habits on your most active days for better consistency.
                </p>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

// Add missing imports
import { Trophy, AlertCircle } from 'lucide-react'