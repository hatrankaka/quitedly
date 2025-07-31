'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckIn } from '@/types/database.types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Mic, Camera, Ruler, Smile, Meh, Frown, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface CheckInHistoryProps {
  habitId: string
  habitName?: string
  limit?: number
  showHeader?: boolean
}

const checkInTypeIcons = {
  text: <FileText className="h-4 w-4" />,
  voice: <Mic className="h-4 w-4" />,
  photo: <Camera className="h-4 w-4" />,
  measurement: <Ruler className="h-4 w-4" />,
}

const getMoodIcon = (score: number) => {
  if (score <= 2) return <Frown className="h-4 w-4" />
  if (score <= 4) return <Meh className="h-4 w-4" />
  return <Smile className="h-4 w-4" />
}

const getMoodColor = (score: number) => {
  if (score <= 2) return 'text-red-500'
  if (score <= 4) return 'text-yellow-500'
  return 'text-green-500'
}

export function CheckInHistory({ 
  habitId, 
  habitName,
  limit = 10,
  showHeader = true 
}: CheckInHistoryProps) {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchCheckIns()
  }, [habitId])

  const fetchCheckIns = async () => {
    try {
      const query = supabase
        .from('check_ins')
        .select('*')
        .eq('habit_id', habitId)
        .order('created_at', { ascending: false })

      if (!expanded) {
        query.limit(limit)
      }

      const { data, error } = await query

      if (error) throw error
      setCheckIns(data || [])
    } catch (error) {
      console.error('Error fetching check-ins:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = () => {
    setExpanded(!expanded)
    fetchCheckIns()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (checkIns.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No check-ins yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start tracking your progress with your first check-in
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <CardTitle>Check-in History</CardTitle>
          {habitName && (
            <CardDescription>Your progress for {habitName}</CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className={showHeader ? '' : 'pt-6'}>
        <div className="space-y-4">
          {checkIns.map((checkIn) => (
            <div
              key={checkIn.id}
              className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    {checkInTypeIcons[checkIn.check_in_type]}
                    {checkIn.check_in_type}
                  </Badge>
                  {checkIn.mood_score && (
                    <div className={`flex items-center gap-1 ${getMoodColor(checkIn.mood_score)}`}>
                      {getMoodIcon(checkIn.mood_score)}
                      <span className="text-sm">Mood</span>
                    </div>
                  )}
                </div>
                <time className="text-sm text-muted-foreground" title={format(new Date(checkIn.created_at), 'PPpp')}>
                  {formatDistanceToNow(new Date(checkIn.created_at), { addSuffix: true })}
                </time>
              </div>

              {/* Content based on type */}
              {checkIn.check_in_type === 'text' && checkIn.content && (
                <p className="text-sm">{checkIn.content}</p>
              )}

              {checkIn.check_in_type === 'measurement' && (
                <p className="text-2xl font-semibold">
                  {checkIn.measurement_value} {checkIn.measurement_unit}
                </p>
              )}

              {checkIn.notes && (
                <p className="text-sm text-muted-foreground italic">
                  Note: {checkIn.notes}
                </p>
              )}
            </div>
          ))}
        </div>

        {checkIns.length >= limit && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleExpanded}
              className="gap-2"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show More
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}