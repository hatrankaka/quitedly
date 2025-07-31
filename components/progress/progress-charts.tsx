'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Habit, CheckIn } from '@/types/database.types'
import { getHabitProgressChartData, getOverallProgressChartData, calculateHabitStats } from '@/utils/progress-utils'
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { TrendingUp, Activity, Target, Calendar } from 'lucide-react'

interface ProgressChartsProps {
  habits: Habit[]
  checkIns: CheckIn[]
  timeRange: 'week' | 'month' | 'year'
}

const COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#84cc16']

export function ProgressCharts({ habits, checkIns, timeRange }: ProgressChartsProps) {
  // Calculate days based on time range
  const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365

  // Get overall progress data
  const overallData = getOverallProgressChartData(habits, checkIns, days)

  // Get individual habit progress data (for the first habit if specific, or overall)
  const habitProgressData = habits.length === 1 
    ? getHabitProgressChartData(habits[0], checkIns.filter(ci => ci.habit_id === habits[0].id), days)
    : overallData.map(d => ({ ...d, completed: d.checkIns, expected: d.habits }))

  // Calculate category distribution
  const categoryDistribution = habits.reduce((acc, habit) => {
    const category = habit.category
    const habitCheckIns = checkIns.filter(ci => ci.habit_id === habit.id).length
    if (!acc[category]) {
      acc[category] = 0
    }
    acc[category] += habitCheckIns
    return acc
  }, {} as Record<string, number>)

  const categoryData = Object.entries(categoryDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  // Calculate completion rates for each habit
  const habitCompletionData = habits.map((habit, index) => {
    const habitCheckIns = checkIns.filter(ci => ci.habit_id === habit.id)
    const stats = calculateHabitStats(habit, habitCheckIns)
    
    return {
      name: habit.name,
      completionRate: Math.round(stats.completionRate),
      totalCheckIns: stats.totalCheckIns,
      color: COLORS[index % COLORS.length],
    }
  }).sort((a, b) => b.completionRate - a.completionRate)

  // Custom tooltip for charts
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

  return (
    <div className="space-y-6">
      {/* Progress Over Time */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Progress Over Time</CardTitle>
              <CardDescription>
                {habits.length === 1 
                  ? `Daily check-ins for ${habits[0].name}`
                  : 'Daily habits completed vs total habits'}
              </CardDescription>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={habitProgressData}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="expected"
                  stroke="#94a3b8"
                  fillOpacity={1}
                  fill="url(#colorExpected)"
                  name={habits.length === 1 ? "Expected" : "Total Habits"}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#f97316"
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                  name="Completed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Rates */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Habit Completion Rates</CardTitle>
                <CardDescription>
                  Based on target frequency
                </CardDescription>
              </div>
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={habitCompletionData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name"
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="completionRate" 
                    name="Completion Rate (%)"
                    radius={[4, 4, 0, 0]}
                  >
                    {habitCompletionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Activity by Category</CardTitle>
                <CardDescription>
                  Total check-ins per category
                </CardDescription>
              </div>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis */}
      {habits.length === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Trend Analysis</CardTitle>
                <CardDescription>
                  Check-in trends over the selected period
                </CardDescription>
              </div>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={habitProgressData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ fill: '#f97316', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Check-ins"
                  />
                  <Line
                    type="monotone"
                    dataKey="expected"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Target"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}