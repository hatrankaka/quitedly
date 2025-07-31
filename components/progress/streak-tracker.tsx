'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Habit, CheckIn } from '@/types/database.types'
import { calculateStreak } from '@/utils/progress-utils'
import { Flame, TrendingUp, Calendar, Award } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

interface StreakTrackerProps {
  habits: Habit[]
  checkIns: CheckIn[]
}

export function StreakTracker({ habits, checkIns }: StreakTrackerProps) {
  // Calculate streaks for each habit
  const habitStreaks = habits.map(habit => {
    const habitCheckIns = checkIns.filter(ci => ci.habit_id === habit.id)
    const streakData = calculateStreak(habitCheckIns)
    
    return {
      habit,
      ...streakData,
    }
  })

  // Sort by current streak (descending)
  const sortedStreaks = [...habitStreaks].sort((a, b) => b.currentStreak - a.currentStreak)
  
  // Get overall stats
  const totalCurrentStreak = habitStreaks.reduce((sum, hs) => sum + hs.currentStreak, 0)
  const longestOverallStreak = Math.max(...habitStreaks.map(hs => hs.longestStreak), 0)
  const activeStreaks = habitStreaks.filter(hs => hs.currentStreak > 0).length

  return (
    <div className="space-y-6">
      {/* Overall Streak Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Streaks</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStreaks}</div>
            <p className="text-xs text-muted-foreground">
              of {habits.length} habits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Combined Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCurrentStreak}</div>
            <p className="text-xs text-muted-foreground">
              total days across all habits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Streak</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{longestOverallStreak}</div>
            <p className="text-xs text-muted-foreground">
              days - your record
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Individual Habit Streaks */}
      <Card>
        <CardHeader>
          <CardTitle>Habit Streaks</CardTitle>
          <CardDescription>
            Keep your momentum going! Check in daily to maintain your streaks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedStreaks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No habits tracked yet. Start building your first streak!</p>
            </div>
          ) : (
            sortedStreaks.map(({ habit, currentStreak, longestStreak, lastCheckIn, streakStartDate }) => {
              const isActive = currentStreak > 0
              const daysSinceLastCheckIn = lastCheckIn 
                ? differenceInDays(new Date(), new Date(lastCheckIn))
                : null

              return (
                <div
                  key={habit.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{habit.name}</h4>
                      {isActive && (
                        <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        Current: <strong className={isActive ? 'text-orange-500' : ''}>{currentStreak} days</strong>
                      </span>
                      <span>
                        Best: <strong>{longestStreak} days</strong>
                      </span>
                      {lastCheckIn && (
                        <span>
                          Last check-in: {format(new Date(lastCheckIn), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 sm:mt-0">
                    {isActive && currentStreak >= 7 && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                        {currentStreak >= 30 ? 'On Fire!' : currentStreak >= 14 ? 'Great!' : 'Week!'}
                      </Badge>
                    )}
                    {!isActive && daysSinceLastCheckIn !== null && (
                      <Badge variant="outline" className="text-muted-foreground">
                        {daysSinceLastCheckIn === 0 
                          ? 'Today' 
                          : daysSinceLastCheckIn === 1 
                          ? 'Yesterday' 
                          : `${daysSinceLastCheckIn} days ago`}
                      </Badge>
                    )}
                    {currentStreak > 0 && currentStreak === longestStreak && longestStreak > 1 && (
                      <Badge className="bg-purple-100 text-purple-700">
                        Personal Best
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Streak Milestones */}
      {activeStreaks > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Milestones</CardTitle>
            <CardDescription>
              Keep going to unlock these achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sortedStreaks
                .filter(hs => hs.currentStreak > 0)
                .slice(0, 4)
                .map(({ habit, currentStreak }) => {
                  const milestones = [7, 14, 30, 60, 90, 100, 365]
                  const nextMilestone = milestones.find(m => m > currentStreak) || 365
                  const daysToNext = nextMilestone - currentStreak
                  const progress = (currentStreak / nextMilestone) * 100

                  return (
                    <div key={habit.id} className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-2">
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="text-muted"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 28}`}
                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                            className="text-orange-500 transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold">{nextMilestone}</span>
                        </div>
                      </div>
                      <p className="text-xs font-medium truncate">{habit.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {daysToNext} day{daysToNext !== 1 ? 's' : ''} to go
                      </p>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}