'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Habit, CheckIn } from '@/types/database.types'
import { getHabitPatterns, calculateHabitStats } from '@/utils/progress-utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell } from 'recharts'
import { Clock, Calendar, TrendingUp, BarChart3, Sunrise, Sun, Moon, CloudMoon } from 'lucide-react'
import { format } from 'date-fns'

interface HabitPatternsProps {
  checkIns: CheckIn[]
  habits: Habit[]
}

const COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#84cc16']

export function HabitPatterns({ checkIns, habits }: HabitPatternsProps) {
  const patterns = getHabitPatterns(checkIns)
  
  // Calculate time of day preferences
  const timeOfDayGroups = {
    morning: { range: '6am-12pm', count: 0, icon: Sunrise },
    afternoon: { range: '12pm-6pm', count: 0, icon: Sun },
    evening: { range: '6pm-12am', count: 0, icon: Moon },
    night: { range: '12am-6am', count: 0, icon: CloudMoon },
  }

  patterns.hourlyDistribution.forEach((hour, index) => {
    if (index >= 6 && index < 12) timeOfDayGroups.morning.count += hour.count
    else if (index >= 12 && index < 18) timeOfDayGroups.afternoon.count += hour.count
    else if (index >= 18 && index < 24) timeOfDayGroups.evening.count += hour.count
    else timeOfDayGroups.night.count += hour.count
  })

  const mostActiveTimeOfDay = Object.entries(timeOfDayGroups).reduce((a, b) => 
    a[1].count > b[1].count ? a : b
  )[0]

  // Calculate habit-specific patterns
  const habitPatterns = habits.map((habit, index) => {
    const habitCheckIns = checkIns.filter(ci => ci.habit_id === habit.id)
    const stats = calculateHabitStats(habit, habitCheckIns)
    const habitPattern = getHabitPatterns(habitCheckIns)
    
    return {
      habit,
      stats,
      patterns: habitPattern,
      color: COLORS[index % COLORS.length],
    }
  })

  // Prepare radar chart data for weekly distribution
  const radarData = patterns.weeklyDistribution.map(day => ({
    day: day.day,
    checkIns: day.count,
    fullMark: Math.max(...patterns.weeklyDistribution.map(d => d.count)) || 1,
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Calculate consistency score
  const totalDays = 7
  const activeDays = patterns.weeklyDistribution.filter(d => d.count > 0).length
  const consistencyScore = Math.round((activeDays / totalDays) * 100)

  // Find peak hours
  const peakHours = [...patterns.hourlyDistribution]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .filter(h => h.count > 0)

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consistency Score</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consistencyScore}%</div>
            <p className="text-xs text-muted-foreground">
              Active {activeDays} of 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Active Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {React.createElement(timeOfDayGroups[mostActiveTimeOfDay as keyof typeof timeOfDayGroups].icon, {
                className: "h-5 w-5 text-orange-500"
              })}
              <span className="text-2xl font-bold capitalize">{mostActiveTimeOfDay}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {timeOfDayGroups[mostActiveTimeOfDay as keyof typeof timeOfDayGroups].range}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {peakHours.length > 0 ? (
                peakHours.map(hour => (
                  <Badge key={hour.hour} variant="secondary" className="text-xs">
                    {hour.hour}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No patterns yet</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your most active hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patterns</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkIns.length}</div>
            <p className="text-xs text-muted-foreground">
              Data points analyzed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity Pattern</CardTitle>
            <CardDescription>
              When you're most likely to check in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={patterns.hourlyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="hour" 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    interval={2}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="count" 
                    fill="#f97316"
                    name="Check-ins"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Pattern Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity Pattern</CardTitle>
            <CardDescription>
              Activity distribution across weekdays
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid className="stroke-muted" />
                  <PolarAngleAxis 
                    dataKey="day" 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 'dataMax']} 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <Radar 
                    name="Check-ins" 
                    dataKey="checkIns" 
                    stroke="#f97316" 
                    fill="#f97316" 
                    fillOpacity={0.6} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Habit-Specific Patterns */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Habit Patterns</CardTitle>
          <CardDescription>
            Unique patterns for each of your habits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {habitPatterns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No habit patterns to display yet.</p>
            </div>
          ) : (
            habitPatterns.map(({ habit, stats, patterns: habitPattern, color }) => {
              const mostActiveDay = stats.mostActiveDay
              const mostActiveHour = stats.mostActiveHour !== null 
                ? patterns.hourlyDistribution[stats.mostActiveHour]?.hour 
                : null

              return (
                <div key={habit.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                      {habit.name}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {stats.totalCheckIns} check-ins
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Completion Rate</p>
                      <p className="text-sm font-medium">{stats.completionRate.toFixed(0)}%</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Avg/Week</p>
                      <p className="text-sm font-medium">{stats.averageCheckInsPerWeek.toFixed(1)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Best Day</p>
                      <p className="text-sm font-medium">{mostActiveDay || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Best Time</p>
                      <p className="text-sm font-medium">{mostActiveHour || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Mini weekly distribution for this habit */}
                  <div className="h-[60px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={habitPattern.weeklyDistribution} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Bar dataKey="count" fill={color}>
                          {habitPattern.weeklyDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.count > 0 ? color : '#e5e7eb'} />
                          ))}
                        </Bar>
                        <XAxis 
                          dataKey="day" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: 'currentColor' }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Pattern Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Pattern Insights</CardTitle>
          <CardDescription>
            Recommendations based on your activity patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {mostActiveTimeOfDay && (
              <li className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                <p className="text-sm">
                  You're most active in the <strong>{mostActiveTimeOfDay}</strong>. 
                  Schedule important habits during this time for better consistency.
                </p>
              </li>
            )}
            
            {consistencyScore < 70 && (
              <li className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                <p className="text-sm">
                  Your consistency score is {consistencyScore}%. 
                  Try to check in on more days of the week to build stronger habits.
                </p>
              </li>
            )}

            {patterns.weeklyDistribution.some(d => d.day === 'Mon' && d.count > 
              patterns.weeklyDistribution.find(d => d.day === 'Sun')?.count!) && (
              <li className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                <p className="text-sm">
                  You're more active on weekdays. Consider setting weekend reminders to maintain momentum.
                </p>
              </li>
            )}

            {peakHours.length > 0 && peakHours[0].count > checkIns.length * 0.3 && (
              <li className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                <p className="text-sm">
                  Over 30% of your check-ins happen at {peakHours[0].hour}. 
                  This is a great time to build habit stacks.
                </p>
              </li>
            )}

            {habitPatterns.some(hp => hp.stats.averageCheckInsPerWeek < 1) && (
              <li className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                <p className="text-sm">
                  Some habits have less than 1 check-in per week. 
                  Consider adjusting their frequency or combining similar habits.
                </p>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}