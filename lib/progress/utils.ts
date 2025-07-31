import { CheckIn, Habit } from '@/types/database.types'
import { startOfDay, endOfDay, differenceInDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, isWithinInterval, isSameDay } from 'date-fns'

export interface StreakData {
  currentStreak: number
  longestStreak: number
  totalCheckIns: number
  lastCheckInDate: Date | null
}

export interface HabitStats {
  completionRate: number
  totalCheckIns: number
  streakData: StreakData
  weeklyPattern: Record<string, number> // day of week -> completion count
  monthlyTrend: Array<{ date: string; count: number }>
}

export interface ProgressOverview {
  totalHabits: number
  activeHabits: number
  totalCheckIns: number
  currentStreaks: number
  overallCompletionRate: number
  bestStreak: number
}

// Calculate streak data for a habit
export function calculateStreaks(checkIns: CheckIn[]): StreakData {
  if (!checkIns || checkIns.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCheckIns: 0,
      lastCheckInDate: null,
    }
  }

  // Sort check-ins by date (newest first)
  const sortedCheckIns = [...checkIns].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const checkInDates = sortedCheckIns.map(ci => startOfDay(new Date(ci.created_at)))
  const uniqueDates = Array.from(new Set(checkInDates.map(d => d.getTime())))
    .map(time => new Date(time))
    .sort((a, b) => b.getTime() - a.getTime())

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0

  // Calculate current streak
  const today = startOfDay(new Date())
  const yesterday = subDays(today, 1)
  
  if (uniqueDates.length > 0) {
    const lastCheckIn = uniqueDates[0]
    
    // Check if the last check-in was today or yesterday
    if (isSameDay(lastCheckIn, today) || isSameDay(lastCheckIn, yesterday)) {
      currentStreak = 1
      
      // Count consecutive days
      for (let i = 1; i < uniqueDates.length; i++) {
        const dayDiff = differenceInDays(uniqueDates[i - 1], uniqueDates[i])
        if (dayDiff === 1) {
          currentStreak++
        } else {
          break
        }
      }
    }
  }

  // Calculate longest streak
  tempStreak = 1
  longestStreak = 1

  for (let i = 1; i < uniqueDates.length; i++) {
    const dayDiff = differenceInDays(uniqueDates[i - 1], uniqueDates[i])
    if (dayDiff === 1) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 1
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    totalCheckIns: checkIns.length,
    lastCheckInDate: uniqueDates[0] || null,
  }
}

// Calculate completion rate for a habit
export function calculateCompletionRate(
  habit: Habit,
  checkIns: CheckIn[],
  periodDays: number = 30
): number {
  const endDate = new Date()
  const startDate = subDays(endDate, periodDays - 1)
  
  const checkInsInPeriod = checkIns.filter(ci => {
    const checkInDate = new Date(ci.created_at)
    return isWithinInterval(checkInDate, { start: startDate, end: endDate })
  })

  // Get unique days with check-ins
  const uniqueDays = new Set(
    checkInsInPeriod.map(ci => format(new Date(ci.created_at), 'yyyy-MM-dd'))
  )

  // Calculate expected check-ins based on target frequency
  let expectedDays = periodDays
  if (habit.target_frequency) {
    if (habit.target_frequency === 'weekly') {
      expectedDays = Math.floor(periodDays / 7)
    } else if (habit.target_frequency.includes('x per week')) {
      const timesPerWeek = parseInt(habit.target_frequency)
      expectedDays = Math.floor((periodDays / 7) * timesPerWeek)
    }
  }

  return expectedDays > 0 ? (uniqueDays.size / expectedDays) * 100 : 0
}

// Get weekly pattern for a habit
export function getWeeklyPattern(checkIns: CheckIn[]): Record<string, number> {
  const pattern: Record<string, number> = {
    'Sunday': 0,
    'Monday': 0,
    'Tuesday': 0,
    'Wednesday': 0,
    'Thursday': 0,
    'Friday': 0,
    'Saturday': 0,
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  checkIns.forEach(ci => {
    const date = new Date(ci.created_at)
    const dayName = days[date.getDay()]
    pattern[dayName]++
  })

  return pattern
}

// Get monthly trend data
export function getMonthlyTrend(checkIns: CheckIn[], months: number = 6): Array<{ date: string; count: number }> {
  const trend: Array<{ date: string; count: number }> = []
  const today = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subDays(today, i * 30))
    const monthEnd = endOfMonth(monthStart)
    
    const monthCheckIns = checkIns.filter(ci => {
      const checkInDate = new Date(ci.created_at)
      return isWithinInterval(checkInDate, { start: monthStart, end: monthEnd })
    })

    trend.push({
      date: format(monthStart, 'MMM yyyy'),
      count: monthCheckIns.length,
    })
  }

  return trend
}

// Get habit statistics
export function getHabitStats(habit: Habit, checkIns: CheckIn[]): HabitStats {
  const habitCheckIns = checkIns.filter(ci => ci.habit_id === habit.id)
  
  return {
    completionRate: calculateCompletionRate(habit, habitCheckIns),
    totalCheckIns: habitCheckIns.length,
    streakData: calculateStreaks(habitCheckIns),
    weeklyPattern: getWeeklyPattern(habitCheckIns),
    monthlyTrend: getMonthlyTrend(habitCheckIns),
  }
}

// Get overall progress overview
export function getProgressOverview(habits: Habit[], checkIns: CheckIn[]): ProgressOverview {
  const activeHabits = habits.filter(h => h.is_active && !h.is_archived)
  let totalCurrentStreaks = 0
  let bestStreak = 0
  let totalCompletionRate = 0

  activeHabits.forEach(habit => {
    const habitCheckIns = checkIns.filter(ci => ci.habit_id === habit.id)
    const streakData = calculateStreaks(habitCheckIns)
    
    if (streakData.currentStreak > 0) {
      totalCurrentStreaks++
    }
    
    bestStreak = Math.max(bestStreak, streakData.longestStreak)
    totalCompletionRate += calculateCompletionRate(habit, habitCheckIns)
  })

  return {
    totalHabits: habits.length,
    activeHabits: activeHabits.length,
    totalCheckIns: checkIns.length,
    currentStreaks: totalCurrentStreaks,
    overallCompletionRate: activeHabits.length > 0 ? totalCompletionRate / activeHabits.length : 0,
    bestStreak,
  }
}

// Achievement definitions
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: Date
  progress?: number
  target?: number
}

// Check achievements
export function checkAchievements(habits: Habit[], checkIns: CheckIn[]): Achievement[] {
  const achievements: Achievement[] = [
    {
      id: 'first-checkin',
      name: 'First Step',
      description: 'Complete your first check-in',
      icon: '🎯',
      unlocked: checkIns.length > 0,
      unlockedAt: checkIns.length > 0 ? new Date(checkIns[0].created_at) : undefined,
    },
    {
      id: 'week-warrior',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      unlocked: false,
    },
    {
      id: 'month-master',
      name: 'Month Master',
      description: 'Maintain a 30-day streak',
      icon: '🌟',
      unlocked: false,
    },
    {
      id: 'habit-collector',
      name: 'Habit Collector',
      description: 'Track 5 or more habits',
      icon: '📚',
      unlocked: habits.filter(h => h.is_active).length >= 5,
      progress: habits.filter(h => h.is_active).length,
      target: 5,
    },
    {
      id: 'consistency-king',
      name: 'Consistency King',
      description: 'Check in every day for a week',
      icon: '👑',
      unlocked: false,
    },
    {
      id: 'century-club',
      name: 'Century Club',
      description: 'Complete 100 total check-ins',
      icon: '💯',
      unlocked: checkIns.length >= 100,
      progress: checkIns.length,
      target: 100,
    },
  ]

  // Check streak-based achievements
  habits.forEach(habit => {
    const habitCheckIns = checkIns.filter(ci => ci.habit_id === habit.id)
    const streakData = calculateStreaks(habitCheckIns)
    
    if (streakData.longestStreak >= 7) {
      const weekWarrior = achievements.find(a => a.id === 'week-warrior')
      if (weekWarrior) weekWarrior.unlocked = true
    }
    
    if (streakData.longestStreak >= 30) {
      const monthMaster = achievements.find(a => a.id === 'month-master')
      if (monthMaster) monthMaster.unlocked = true
    }
  })

  // Check consistency achievement
  const lastWeek = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i)
    return format(date, 'yyyy-MM-dd')
  })

  const checkInDates = new Set(
    checkIns.map(ci => format(new Date(ci.created_at), 'yyyy-MM-dd'))
  )

  const hasCheckedInEveryDay = lastWeek.every(date => checkInDates.has(date))
  const consistencyKing = achievements.find(a => a.id === 'consistency-king')
  if (consistencyKing && hasCheckedInEveryDay) {
    consistencyKing.unlocked = true
  }

  return achievements
}