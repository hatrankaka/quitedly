'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { HabitInsert, CommitmentMode, HabitCategory } from '@/types/database.types'
import { ArrowLeft, Sparkles, Heart, Target } from 'lucide-react'
import Link from 'next/link'

interface HabitFormProps {
  userId: string
  initialData?: Partial<HabitInsert>
  habitId?: string
}

const commitmentModes = [
  {
    value: 'free_flow' as CommitmentMode,
    label: 'Free Flow',
    icon: Sparkles,
    description: 'Check in whenever you feel like it. No pressure, just progress.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    value: 'gentle_rhythm' as CommitmentMode,
    label: 'Gentle Rhythm',
    icon: Heart,
    description: 'Get friendly suggestions for check-ins with full flexibility.',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    value: 'committed_path' as CommitmentMode,
    label: 'Committed Path',
    icon: Target,
    description: 'Set a schedule and receive reminders to stay on track.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
]

const categories: { value: HabitCategory; label: string }[] = [
  { value: 'health', label: 'Health & Fitness' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'personal', label: 'Personal Growth' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'finance', label: 'Finance' },
  { value: 'learning', label: 'Learning' },
  { value: 'creative', label: 'Creative' },
  { value: 'other', label: 'Other' },
]

const daysOfWeek = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

export function HabitForm({ userId, initialData, habitId }: HabitFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<HabitInsert>>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || 'personal',
    commitment_mode: initialData?.commitment_mode || 'free_flow',
    target_frequency: initialData?.target_frequency || '',
    preferred_days: initialData?.preferred_days || [],
    reminder_time: initialData?.reminder_time || '',
    user_id: userId,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (habitId) {
        // Update existing habit
        const { error } = await supabase
          .from('habits')
          .update(formData)
          .eq('id', habitId)

        if (error) throw error
      } else {
        // Create new habit
        const { error } = await supabase
          .from('habits')
          .insert([formData])

        if (error) throw error
      }

      router.push('/dashboard/habits')
      router.refresh()
    } catch (error) {
      console.error('Error saving habit:', error)
      alert('Failed to save habit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDayToggle = (day: number) => {
    const days = formData.preferred_days || []
    if (days.includes(day)) {
      setFormData({ ...formData, preferred_days: days.filter(d => d !== day) })
    } else {
      setFormData({ ...formData, preferred_days: [...days, day].sort() })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/habits">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {habitId ? 'Edit Habit' : 'Create New Habit'}
          </h1>
          <p className="text-muted-foreground">
            {habitId ? 'Update your habit details' : 'Start building a positive habit'}
          </p>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Give your habit a name and description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Habit Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Morning meditation, Daily walk, Read 10 pages"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what this habit means to you..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value: HabitCategory) => 
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Commitment Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Your Commitment Mode</CardTitle>
          <CardDescription>
            Select how you want to track this habit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.commitment_mode}
            onValueChange={(value: CommitmentMode) => 
              setFormData({ ...formData, commitment_mode: value })
            }
          >
            <div className="space-y-3">
              {commitmentModes.map((mode) => (
                <label
                  key={mode.value}
                  htmlFor={mode.value}
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    formData.commitment_mode === mode.value
                      ? `${mode.bgColor} border-current ${mode.color}`
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem value={mode.value} id={mode.value} className="mt-1" />
                  <mode.icon className={`h-5 w-5 mt-0.5 ${mode.color}`} />
                  <div className="flex-1">
                    <div className="font-medium">{mode.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {mode.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Schedule (for Gentle Rhythm and Committed Path) */}
      {formData.commitment_mode !== 'free_flow' && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule (Optional)</CardTitle>
            <CardDescription>
              Set your preferred check-in days and time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Preferred Days</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {daysOfWeek.map((day) => (
                  <label
                    key={day.value}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={formData.preferred_days?.includes(day.value) || false}
                      onCheckedChange={() => handleDayToggle(day.value)}
                    />
                    <span className="text-sm">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {formData.commitment_mode === 'committed_path' && (
              <div className="space-y-2">
                <Label htmlFor="reminder_time">Reminder Time</Label>
                <Input
                  id="reminder_time"
                  type="time"
                  value={formData.reminder_time || ''}
                  onChange={(e) => 
                    setFormData({ ...formData, reminder_time: e.target.value })
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="target_frequency">Target Frequency (optional)</Label>
              <Input
                id="target_frequency"
                placeholder="e.g., Daily, 3 times per week"
                value={formData.target_frequency || ''}
                onChange={(e) => 
                  setFormData({ ...formData, target_frequency: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading || !formData.name}
          className="flex-1"
        >
          {loading ? 'Saving...' : habitId ? 'Update Habit' : 'Create Habit'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/habits')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}