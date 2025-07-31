'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckInType, CheckInInsert, Habit } from '@/types/database.types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Camera, FileText, Mic, Ruler, Smile, Meh, Frown, CheckCircle } from 'lucide-react'
import Link from 'next/link'

const checkInTypes: { value: CheckInType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'text',
    label: 'Text',
    icon: <FileText className="h-5 w-5" />,
    description: 'Write a detailed reflection about your progress'
  },
  {
    value: 'voice',
    label: 'Voice',
    icon: <Mic className="h-5 w-5" />,
    description: 'Record a voice message (coming soon)'
  },
  {
    value: 'photo',
    label: 'Photo',
    icon: <Camera className="h-5 w-5" />,
    description: 'Upload a photo (coming soon)'
  },
  {
    value: 'measurement',
    label: 'Measurement',
    icon: <Ruler className="h-5 w-5" />,
    description: 'Track a specific metric or measurement'
  },
]

const moodOptions = [
  { value: 1, icon: <Frown className="h-8 w-8" />, label: 'Struggling', description: 'Having a tough time' },
  { value: 2, icon: <Frown className="h-8 w-8" />, label: 'Difficult', description: 'Facing challenges' },
  { value: 3, icon: <Meh className="h-8 w-8" />, label: 'Okay', description: 'Managing alright' },
  { value: 4, icon: <Smile className="h-8 w-8" />, label: 'Good', description: 'Feeling positive' },
  { value: 5, icon: <Smile className="h-8 w-8" />, label: 'Great', description: 'Doing excellent' },
]

export default function CheckInPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [habit, setHabit] = useState<Habit | null>(null)
  const [user, setUser] = useState<any>(null)
  const [checkInType, setCheckInType] = useState<CheckInType>('text')
  const [content, setContent] = useState('')
  const [measurementValue, setMeasurementValue] = useState('')
  const [measurementUnit, setMeasurementUnit] = useState('')
  const [moodScore, setMoodScore] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    fetchHabitAndUser()
  }, [params.id])

  const fetchHabitAndUser = async () => {
    // Get user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/signin')
      return
    }
    setUser(user)

    // Get habit
    const { data: habitData, error } = await supabase
      .from('habits')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !habitData) {
      router.push('/dashboard')
      return
    }

    setHabit(habitData)
  }

  const handleSubmit = async () => {
    if (!user || !habit) return

    setError(null)
    setLoading(true)

    try {
      const checkInData: CheckInInsert = {
        habit_id: habit.id,
        user_id: user.id,
        check_in_type: checkInType,
        mood_score: moodScore,
        notes: notes || null,
      }

      // Add type-specific data
      if (checkInType === 'text') {
        if (!content.trim()) {
          throw new Error('Please enter some text for your reflection')
        }
        checkInData.content = content
      } else if (checkInType === 'measurement') {
        if (!measurementValue || !measurementUnit) {
          throw new Error('Please enter both value and unit for your measurement')
        }
        checkInData.measurement_value = parseFloat(measurementValue)
        checkInData.measurement_unit = measurementUnit
      }

      const { error: insertError } = await supabase
        .from('check_ins')
        .insert(checkInData)

      if (insertError) throw insertError

      setSuccess(true)
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/dashboard/habits/${habit.id}`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save check-in')
    } finally {
      setLoading(false)
    }
  }

  if (!habit) {
    return (
      <div className="container max-w-2xl mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-pulse">
              <div className="h-6 bg-muted rounded w-1/2 mx-auto mb-4"></div>
              <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="container max-w-2xl mx-auto p-4">
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Check-in Saved!</h2>
            <p className="text-muted-foreground">
              Great job keeping up with your habit. Redirecting you back...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/habits/${habit.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {habit.name}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Check In - {habit.name}</CardTitle>
          <CardDescription>
            Take a moment to reflect on your progress and how you're feeling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Check-in Type Selection */}
          <div className="space-y-3">
            <Label>How would you like to check in?</Label>
            <RadioGroup value={checkInType} onValueChange={(value) => setCheckInType(value as CheckInType)}>
              <div className="grid gap-3">
                {checkInTypes.map((type) => (
                  <label
                    key={type.value}
                    htmlFor={type.value}
                    className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors ${
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
                      <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Type-specific inputs */}
          {checkInType === 'text' && (
            <div className="space-y-2">
              <Label htmlFor="content">Your Reflection</Label>
              <Textarea
                id="content"
                placeholder="Share your thoughts, progress, challenges, or victories..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Take your time to reflect deeply on your journey
              </p>
            </div>
          )}

          {checkInType === 'measurement' && (
            <div className="space-y-4">
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
              <p className="text-xs text-muted-foreground">
                Track any metric that matters to your progress
              </p>
            </div>
          )}

          {/* Mood Tracking */}
          <div className="space-y-3">
            <Label>How are you feeling about your progress?</Label>
            <div className="grid grid-cols-5 gap-2">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setMoodScore(mood.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                    moodScore === mood.value
                      ? 'bg-primary text-primary-foreground scale-105'
                      : 'hover:bg-accent hover:scale-105'
                  }`}
                >
                  {mood.icon}
                  <span className="text-xs font-medium">{mood.label}</span>
                  <span className="text-xs opacity-75">{mood.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any other thoughts, context, or observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/habits/${habit.id}`)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !moodScore}
              className="flex-1"
            >
              {loading ? 'Saving...' : 'Save Check-In'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}