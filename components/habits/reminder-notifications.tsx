'use client'

import { useEffect } from 'react'
import { useCheckInReminders } from '@/hooks/use-check-in-reminders'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, X, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { CheckInModal } from './check-in-modal'

interface ReminderNotificationsProps {
  userId: string
}

export function ReminderNotifications({ userId }: ReminderNotificationsProps) {
  const { reminders, dismissReminder, requestNotificationPermission } = useCheckInReminders(userId)
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null)
  const [checkInModalOpen, setCheckInModalOpen] = useState(false)

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission()
  }, [requestNotificationPermission])

  const handleCheckIn = (habitId: string, habitName: string) => {
    setSelectedHabitId(habitId)
    setCheckInModalOpen(true)
  }

  const handleCheckInSuccess = () => {
    if (selectedHabitId) {
      dismissReminder(selectedHabitId)
    }
  }

  if (reminders.length === 0) return null

  const selectedReminder = reminders.find(r => r.habitId === selectedHabitId)

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
        {reminders.map((reminder) => (
          <Card 
            key={reminder.habitId} 
            className={`animate-in slide-in-from-right shadow-lg ${
              reminder.type === 'regular' 
                ? 'border-purple-500/20 bg-purple-50 dark:bg-purple-950/20' 
                : 'border-green-500/20 bg-green-50 dark:bg-green-950/20'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  reminder.type === 'regular' 
                    ? 'bg-purple-500/20 text-purple-700 dark:text-purple-400' 
                    : 'bg-green-500/20 text-green-700 dark:text-green-400'
                }`}>
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{reminder.habitName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {reminder.message}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => handleCheckIn(reminder.habitId, reminder.habitName)}
                      className="gap-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Check In
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => dismissReminder(reminder.habitId)}
                    >
                      Later
                    </Button>
                  </div>
                </div>
                <button
                  onClick={() => dismissReminder(reminder.habitId)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedReminder && (
        <CheckInModal
          open={checkInModalOpen}
          onOpenChange={setCheckInModalOpen}
          habitId={selectedReminder.habitId}
          habitName={selectedReminder.habitName}
          userId={userId}
          onSuccess={handleCheckInSuccess}
        />
      )}
    </>
  )
}