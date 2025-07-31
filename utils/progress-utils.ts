import { CheckIn, Habit } from '@/types/database.types'
import { startOfDay, endOfDay, differenceInDays, format, subDays, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isAfter, isBefore, isEqual } from 'date-fns'

export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastCheckIn: Date | null
  streakStartDate: Date | null
}

export interface HabitStats {
  totalCheckIns: number
  completionRate: number
  averageCheckInsPerWeek: number
  mostActiveDay: string | null
  mostActiveHour: number | null
}

export interface ProgressReport {
  period: 'weekly' | 'monthly'
  startDate: Date
  endDate: Date
  totalCheckIns: number
  habitsCount: number
  completionRate: number
  mostConsistentHabit: {
    habitId: string
    habitName: string
    completionRate: number
  } | null
  leastConsistentHabit: {
    habitId: string
    habitName: string
    completionRate: number
  } | null
  streakSummary: {
    maintained: number
    improved: number
    broken: number
  }
}

// Calculate streak data for a habit
export function calculateStreak(checkIns: CheckIn[]): StreakData {
  if (checkIns.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCheckIn: null,
      streakStartDate: null,
    }
  }

  // Sort check-ins by date (newest first)
  const sortedCheckIns = [...checkIns].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  // Get unique dates (one check-in per day)
  const uniqueDates = new Map<string, Date>()
  sortedCheckIns.forEach(checkIn => {
    const dateKey = format(new Date(checkIn.created_at), 'yyyy-MM-dd')
    if (!uniqueDates.has(dateKey)) {
      uniqueDates.set(dateKey, new Date(checkIn.created_at))
    }
  })

  const dates = Array.from(uniqueDates.values()).sort((a, b) => b.getTime() - a.getTime())
  
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 1
  let streakStartDate: Date | null = null

  // Check if the most recent check-in was today or yesterday
  const today = startOfDay(new Date())
  const lastCheckInDate = startOfDay(dates[0])
  const daysSinceLastCheckIn = differenceInDays(today, lastCheckInDate)

  if (daysSinceLastCheckIn <= 1) {
    currentStreak = 1
    streakStartDate = lastCheckInDate
  }

  // Calculate streaks
  for (let i = 0; i < dates.length - 1; i++) {
    const currentDate = startOfDay(dates[i])
    const nextDate = startOfDay(dates[i + 1])
    const daysDiff = differenceInDays(currentDate, nextDate)

    if (daysDiff === 1) {
      tempStreak++
      if (i === 0 && daysSinceLastCheckIn <= 1) {
        currentStreak = tempStreak
        streakStartDate = nextDate
      }
    } else {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 1
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak)

  return {
    currentStreak,
    longestStreak,
    lastCheckIn: dates[0],
    streakStartDate,
  }
}

// Calculate habit statistics
export function calculateHabitStats(habit: Habit, checkIns: CheckIn[]): HabitStats {
  if (checkIns.length === 0) {
    return {
      totalCheckIns: 0,
      completionRate: 0,
      averageCheckInsPerWeek: 0,
      mostActiveDay: null,
      mostActiveHour: null,
    }
  }

  const habitCreatedDate = new Date(habit.created_at)
  const today = new Date()
  const daysSinceCreation = differenceInDays(today, habitCreatedDate) + 1
  const weeksSinceCreation = Math.max(1, Math.ceil(daysSinceCreation / 7))

  // Calculate completion rate based on target frequency
  let expectedCheckIns = daysSinceCreation // Default to daily
  if (habit.target_frequency) {
    const frequency = habit.target_frequency.toLowerCase()
    if (frequency.includes('week')) {
      const timesPerWeek = parseInt(frequency.match(/\d+/)?.[0] || '1')
      expectedCheckIns = Math.floor((daysSinceCreation / 7) * timesPerWeek)
    } else if (frequency.includes('month')) {
      const timesPerMonth = parseInt(frequency.match(/\d+/)?.[0] || '1')
      expectedCheckIns = Math.floor((daysSinceCreation / 30) * timesPerMonth)
    }
  }

  const completionRate = Math.min(100, (checkIns.length / expectedCheckIns) * 100)

  // Calculate most active day of week
  const dayFrequency: Record<string, number> = {}
  checkIns.forEach(checkIn => {
    const day = format(new Date(checkIn.created_at), 'EEEE')
    dayFrequency[day] = (dayFrequency[day] || 0) + 1
  })

  const mostActiveDay = Object.entries(dayFrequency).reduce((a, b) => 
    a[1] > b[1] ? a : b
  )?.[0] || null

  // Calculate most active hour
  const hourFrequency: Record<number, number> = {}
  checkIns.forEach(checkIn => {
    const hour = new Date(checkIn.created_at).getHours()
    hourFrequency[hour] = (hourFrequency[hour] || 0) + 1
  })

  const mostActiveHour = Object.entries(hourFrequency).reduce((a, b) => 
    a[1] > b[1] ? a : b
  )?.[0] ? parseInt(Object.entries(hourFrequency).reduce((a, b) => 
    a[1] > b[1] ? a : b
  )[0]) : null

  return {
    totalCheckIns: checkIns.length,
    completionRate,
    averageCheckInsPerWeek: checkIns.length / weeksSinceCreation,
    mostActiveDay,
    mostActiveHour,
  }
}

// Generate progress report for a period
export function generateProgressReport(
  habits: Habit[],
  checkIns: CheckIn[],
  period: 'weekly' | 'monthly',
  referenceDate: Date = new Date()
): ProgressReport {
  let startDate: Date
  let endDate: Date
  let previousStartDate: Date
  let previousEndDate: Date

  if (period === 'weekly') {
    startDate = startOfWeek(referenceDate, { weekStartsOn: 1 })
    endDate = endOfWeek(referenceDate, { weekStartsOn: 1 })
    previousStartDate = startOfWeek(subDays(referenceDate, 7), { weekStartsOn: 1 })
    previousEndDate = endOfWeek(subDays(referenceDate, 7), { weekStartsOn: 1 })
  } else {
    startDate = startOfMonth(referenceDate)
    endDate = endOfMonth(referenceDate)
    previousStartDate = startOfMonth(subDays(referenceDate, 30))
    previousEndDate = endOfMonth(subDays(referenceDate, 30))
  }

  // Filter check-ins for current period
  const periodCheckIns = checkIns.filter(checkIn => {
    const checkInDate = new Date(checkIn.created_at)
    return checkInDate >= startDate && checkInDate <= endDate
  })

  // Filter check-ins for previous period
  const previousPeriodCheckIns = checkIns.filter(checkIn => {
    const checkInDate = new Date(checkIn.created_at)
    return checkInDate >= previousStartDate && checkInDate <= previousEndDate
  })

  // Calculate habit-specific stats
  const habitStats = habits.map(habit => {
    const habitCheckIns = periodCheckIns.filter(ci => ci.habit_id === habit.id)
    const previousHabitCheckIns = previousPeriodCheckIns.filter(ci => ci.habit_id === habit.id)
    
    const daysInPeriod = differenceInDays(endDate, startDate) + 1
    let expectedCheckIns = daysInPeriod

    if (habit.target_frequency) {
      const frequency = habit.target_frequency.toLowerCase()
      if (frequency.includes('week')) {
        const timesPerWeek = parseInt(frequency.match(/\d+/)?.[0] || '1')
        expectedCheckIns = period === 'weekly' ? timesPerWeek : timesPerWeek * 4
      } else if (frequency.includes('month')) {
        const timesPerMonth = parseInt(frequency.match(/\d+/)?.[0] || '1')
        expectedCheckIns = period === 'monthly' ? timesPerMonth : timesPerMonth / 4
      }
    }

    const completionRate = Math.min(100, (habitCheckIns.length / expectedCheckIns) * 100)
    const previousCompletionRate = Math.min(100, (previousHabitCheckIns.length / expectedCheckIns) * 100)

    return {
      habitId: habit.id,
      habitName: habit.name,
      completionRate,
      previousCompletionRate,
      checkInsCount: habitCheckIns.length,
    }
  })

  // Find most and least consistent habits
  const sortedByCompletion = [...habitStats].sort((a, b) => b.completionRate - a.completionRate)
  const mostConsistentHabit = sortedByCompletion[0] && sortedByCompletion[0].completionRate > 0
    ? {
        habitId: sortedByCompletion[0].habitId,
        habitName: sortedByCompletion[0].habitName,
        completionRate: sortedByCompletion[0].completionRate,
      }
    : null

  const leastConsistentHabit = sortedByCompletion.length > 1 && sortedByCompletion[sortedByCompletion.length - 1].completionRate < 100
    ? {
        habitId: sortedByCompletion[sortedByCompletion.length - 1].habitId,
        habitName: sortedByCompletion[sortedByCompletion.length - 1].habitName,
        completionRate: sortedByCompletion[sortedByCompletion.length - 1].completionRate,
      }
    : null

  // Calculate streak summary
  const streakSummary = habitStats.reduce(
    (acc, stat) => {
      if (stat.completionRate > stat.previousCompletionRate) {
        acc.improved++
      } else if (stat.completionRate === stat.previousCompletionRate && stat.completionRate > 0) {
        acc.maintained++
      } else if (stat.previousCompletionRate > 0 && stat.completionRate === 0) {
        acc.broken++
      }
      return acc
    },
    { maintained: 0, improved: 0, broken: 0 }
  )

  const overallCompletionRate = habits.length > 0
    ? habitStats.reduce((sum, stat) => sum + stat.completionRate, 0) / habits.length
    : 0

  return {
    period,
    startDate,
    endDate,
    totalCheckIns: periodCheckIns.length,
    habitsCount: habits.length,
    completionRate: overallCompletionRate,
    mostConsistentHabit,
    leastConsistentHabit,
    streakSummary,
  }
}

// Get chart data for habit progress
export function getHabitProgressChartData(
  habit: Habit,
  checkIns: CheckIn[],
  days: number = 30
): Array<{ date: string; completed: number; expected: number }> {
  const endDate = new Date()
  const startDate = subDays(endDate, days - 1)
  
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate })
  
  // Create a map of check-ins by date
  const checkInMap = new Map<string, number>()
  checkIns.forEach(checkIn => {
    const dateKey = format(new Date(checkIn.created_at), 'yyyy-MM-dd')
    checkInMap.set(dateKey, (checkInMap.get(dateKey) || 0) + 1)
  })

  // Calculate expected check-ins per day
  let expectedPerDay = 1 // Default to daily
  if (habit.target_frequency) {
    const frequency = habit.target_frequency.toLowerCase()
    if (frequency.includes('week')) {
      const timesPerWeek = parseInt(frequency.match(/\d+/)?.[0] || '1')
      expectedPerDay = timesPerWeek / 7
    } else if (frequency.includes('month')) {
      const timesPerMonth = parseInt(frequency.match(/\d+/)?.[0] || '1')
      expectedPerDay = timesPerMonth / 30
    }
  }

  return dateRange.map(date => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return {
      date: format(date, 'MMM dd'),
      completed: checkInMap.get(dateKey) || 0,
      expected: expectedPerDay,
    }
  })
}

// Get overall progress chart data
export function getOverallProgressChartData(
  habits: Habit[],
  checkIns: CheckIn[],
  days: number = 30
): Array<{ date: string; checkIns: number; habits: number }> {
  const endDate = new Date()
  const startDate = subDays(endDate, days - 1)
  
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate })
  
  // Create a map of check-ins by date
  const checkInMap = new Map<string, Set<string>>()
  checkIns.forEach(checkIn => {
    const dateKey = format(new Date(checkIn.created_at), 'yyyy-MM-dd')
    if (!checkInMap.has(dateKey)) {
      checkInMap.set(dateKey, new Set())
    }
    checkInMap.get(dateKey)?.add(checkIn.habit_id)
  })

  return dateRange.map(date => {
    const dateKey = format(date, 'yyyy-MM-dd')
    const habitIds = checkInMap.get(dateKey) || new Set()
    return {
      date: format(date, 'MMM dd'),
      checkIns: habitIds.size,
      habits: habits.length,
    }
  })
}

// Calculate habit completion patterns
export function getHabitPatterns(checkIns: CheckIn[]): {
  hourlyDistribution: Array<{ hour: string; count: number }>
  weeklyDistribution: Array<{ day: string; count: number }>
} {
  const hourlyCount: Record<number, number> = {}
  const dailyCount: Record<string, number> = {}

  checkIns.forEach(checkIn => {
    const date = new Date(checkIn.created_at)
    const hour = date.getHours()
    const day = format(date, 'EEEE')

    hourlyCount[hour] = (hourlyCount[hour] || 0) + 1
    dailyCount[day] = (dailyCount[day] || 0) + 1
  })

  const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({
    hour: i < 12 ? `${i === 0 ? 12 : i}am` : `${i === 12 ? 12 : i - 12}pm`,
    count: hourlyCount[i] || 0,
  }))

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const weeklyDistribution = weekDays.map(day => ({
    day: day.slice(0, 3),
    count: dailyCount[day] || 0,
  }))

  return { hourlyDistribution, weeklyDistribution }
}