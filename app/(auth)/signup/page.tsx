import { AuthForm } from '@/components/auth/auth-form'

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <AuthForm mode="signup" />
      </div>
    </div>
  )
}