'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckInType, CheckInInsert } from '@/types/database.types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Camera, FileText, Mic, Ruler, Smile, Meh, Frown } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CheckInModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  habitId: string
  habitName: string
  userId: string
  onSuccess?: () => void
}

const checkInTypes: { value: CheckInType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'text',
    label: 'Text',
    icon: <FileText className="h-4 w-4" />,
    description: 'Write a quick note about your progress'
  },
  {
    value: 'voice',
    label: 'Voice',
    icon: <Mic className="h-4 w-4" />,
    description: 'Record a voice message (coming soon)'
  },
  {
    value: 'photo',
    label: 'Photo',
    icon: <Camera className="h-4 w-4" />,
    description: 'Upload a photo (coming soon)'
  },
  {
    value: 'measurement',
    label: 'Measurement',
    icon: <Ruler className="h-4 w-4" />,
    description: 'Track a specific metric'
  },
]

const moodOptions = [
  { value: 1, icon: <Frown className="h-6 w-6" />, label: 'Not great' },
  { value: 3, icon: <Meh className="h-6 w-6" />, label: 'Okay' },
  { value: 5, icon: <Smile className="h-6 w-6" />, label: 'Great' },
]

export function CheckInModal({
  open,
  onOpenChange,
  habitId,
  habitName,
  userId,
  onSuccess,
}: CheckInModalProps) {
  const [checkInType, setCheckInType] = useState<CheckInType>('text')
  const [content, setContent] = useState('')
  const [measurementValue, setMeasurementValue] = useState('')
  const [measurementUnit, setMeasurementUnit] = useState('')
  const [moodScore, setMoodScore] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)

    try {
      const checkInData: CheckInInsert = {
        habit_id: habitId,
        user_id: userId,
        check_in_type: checkInType,
        mood_score: moodScore,
        notes: notes || null,
      }

      // Add type-specific data
      if (checkInType === 'text') {
        if (!content.trim()) {
          throw new Error('Please enter some text')
        }
        checkInData.content = content
      } else if (checkInType === 'measurement') {
        if (!measurementValue || !measurementUnit) {
          throw new Error('Please enter both value and unit')
        }
        checkInData.measurement_value = parseFloat(measurementValue)
        checkInData.measurement_unit = measurementUnit
      }

      const { error: insertError } = await supabase
        .from('check_ins')
        .insert(checkInData)

      if (insertError) throw insertError

      // Reset form
      setContent('')
      setMeasurementValue('')
      setMeasurementUnit('')
      setMoodScore(null)
      setNotes('')
      setCheckInType('text')
      
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save check-in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Check In - {habitName}</DialogTitle>
          <DialogDescription>
            Record your progress and how you're feeling
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Check-in Type Selection */}
          <div className="space-y-3">
            <Label>Check-in Type</Label>
            <RadioGroup value={checkInType} onValueChange={(value) => setCheckInType(value as CheckInType)}>
              <div className="grid grid-cols-2 gap-3">
                {checkInTypes.map((type) => (
                  <label
                    key={type.value}
                    htmlFor={type.value}
                    className={`flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-accent ${
                      checkInType === type.value ? 'border-primary bg-accent' : ''
                    } ${type.value === 'voice' || type.value === 'photo' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <RadioGroupItem 
                      value={type.value} 
                      id={type.value} 
                      disabled={type.value === 'voice' || type.value === 'photo'}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {type.icon}
                        <span className="font-medium">{type.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Type-specific inputs */}
          {checkInType === 'text' && (
            <div className="space-y-2">
              <Label htmlFor="content">What's on your mind?</Label>
              <Textarea
                id="content"
                placeholder="Share your thoughts, progress, or reflections..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
            </div>
          )}

          {checkInType === 'measurement' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  type="number"
                  placeholder="0"
                  value={measurementValue}
                  onChange={(e) => setMeasurementValue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  placeholder="e.g., miles, minutes, pounds"
                  value={measurementUnit}
                  onChange={(e) => setMeasurementUnit(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Mood Tracking */}
          <div className="space-y-3">
            <Label>How are you feeling?</Label>
            <div className="flex justify-around">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setMoodScore(mood.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors ${
                    moodScore === mood.value
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  {mood.icon}
                  <span className="text-xs">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any other thoughts or context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save Check-In'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}