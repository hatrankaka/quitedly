'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn, signUp } from '@/utils/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validation
    if (!email || !password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const result = mode === 'login' 
        ? await signIn(email, password)
        : await signUp(email, password)

      if (result.error) {
        setError(result.error)
      } else {
        if (mode === 'login') {
          router.push('/dashboard')
          router.refresh()
        } else {
          // For signup, we might want to show a success message
          router.push('/login?message=Check your email to confirm your account')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">
          {mode === 'login' ? 'Welcome back' : 'Create an account'}
        </CardTitle>
        <CardDescription>
          {mode === 'login'
            ? 'Enter your email and password to sign in'
            : 'Enter your email and password to create your account'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          )}
          
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading
              ? mode === 'login'
                ? 'Signing in...'
                : 'Creating account...'
              : mode === 'login'
              ? 'Sign in'
              : 'Create account'}
          </Button>
        </CardContent>
      </form>
      <CardFooter className="flex flex-col space-y-2">
        {mode === 'login' && (
          <Link
            href="/forgot-password"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Forgot your password?
          </Link>
        )}
        <div className="text-sm text-muted-foreground">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <Link
            href={mode === 'login' ? '/signup' : '/login'}
            className="font-medium text-primary hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}