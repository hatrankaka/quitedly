'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Habit, CommitmentMode } from '@/types/database.types'
import { isToday, parseISO, format, getDay, setHours, setMinutes, isAfter, isBefore } from 'date-fns'

interface Reminder {
  habitId: string
  habitName: string
  type: 'gentle' | 'regular'
  message: string
  time?: string
}

export function useCheckInReminders(userId: string) {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const supabase = createClient()

  // Fetch user's active habits
  useEffect(() => {
    if (!userId) return

    const fetchHabits = async () => {
      const { data } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('is_archived', false)

      if (data) {
        setHabits(data)
      }
    }

    fetchHabits()
  }, [userId])

  // Check for check-ins today
  const hasCheckedInToday = useCallback(async (habitId: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data } = await supabase
      .from('check_ins')
      .select('id')
      .eq('habit_id', habitId)
      .gte('created_at', today.toISOString())
      .limit(1)

    return !!data && data.length > 0
  }, [supabase])

  // Generate reminders based on commitment mode
  const generateReminders = useCallback(async () => {
    const now = new Date()
    const currentDay = getDay(now)
    const currentTime = format(now, 'HH:mm')
    const pendingReminders: Reminder[] = []

    for (const habit of habits) {
      // Skip if already checked in today
      const checkedIn = await hasCheckedInToday(habit.id)
      if (checkedIn) continue

      switch (habit.commitment_mode) {
        case 'free_flow':
          // No reminders for free flow mode
          break

        case 'gentle_rhythm':
          // Check if today is a preferred day
          if (habit.preferred_days?.includes(currentDay)) {
            // Only show reminder once per day, around midday if no specific time
            const reminderTime = habit.reminder_time || '12:00'
            if (currentTime >= reminderTime && currentTime <= '23:59') {
              pendingReminders.push({
                habitId: habit.id,
                habitName: habit.name,
                type: 'gentle',
                message: `Time for your ${habit.name} check-in! No pressure, just a gentle reminder.`,
                time: reminderTime
              })
            }
          }
          break

        case 'committed_path':
          // Regular reminders on preferred days
          if (habit.preferred_days?.includes(currentDay)) {
            const reminderTime = habit.reminder_time || '09:00'
            
            // Show reminder if it's past the reminder time
            if (currentTime >= reminderTime) {
              pendingReminders.push({
                habitId: habit.id,
                habitName: habit.name,
                type: 'regular',
                message: `Don't forget your ${habit.name} check-in today!`,
                time: reminderTime
              })
            }
          }
          break
      }
    }

    setReminders(pendingReminders)
  }, [habits, hasCheckedInToday])

  // Check for reminders every minute
  useEffect(() => {
    if (habits.length === 0) return

    generateReminders()
    const interval = setInterval(generateReminders, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [habits, generateReminders])

  // Function to dismiss a reminder
  const dismissReminder = useCallback((habitId: string) => {
    setReminders(prev => prev.filter(r => r.habitId !== habitId))
  }, [])

  // Function to check if browser notifications are supported and enabled
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }, [])

  // Send browser notification (if enabled)
  const sendBrowserNotification = useCallback(async (reminder: Reminder) => {
    const hasPermission = await requestNotificationPermission()
    if (!hasPermission) return

    const notification = new Notification('Quitedly Reminder', {
      body: reminder.message,
      icon: '/icon-192x192.png', // You'll need to add this to your public folder
      badge: '/icon-192x192.png',
      tag: reminder.habitId,
      requireInteraction: reminder.type === 'regular',
    })

    notification.onclick = () => {
      window.focus()
      // Navigate to the habit or open check-in modal
      notification.close()
    }
  }, [requestNotificationPermission])

  return {
    reminders,
    dismissReminder,
    requestNotificationPermission,
    sendBrowserNotification,
  }
}