'use client'

import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/utils/auth'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function UserAvatar() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
          {user.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {user.email}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
      >
        Sign out
      </Button>
    </div>
  )
}