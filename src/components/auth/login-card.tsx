'use client'

import { useCallback, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export function LoginCard() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createSupabaseBrowserClient()
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback?next=/dashboard`
          : undefined

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: { prompt: 'select_account' },
        },
      })

      if (signInError) {
        throw signInError
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong while trying to sign you in.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <Card className="w-full max-w-md glass-card shadow-2xl transition-all duration-300 hover:shadow-3xl">
      <CardHeader>
        <CardTitle>Sign in to continue</CardTitle>
        <CardDescription>
          Connect with your Google account to access your application tracker and sync progress
          across devices.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button
          className="w-full"
          disabled={isLoading}
          onClick={handleGoogleLogin}
          size="lg"
          variant="default"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirecting to Google...
            </>
          ) : (
            <>
              <GoogleIcon className="h-5 w-5" />
              Continue with Google
            </>
          )}
        </Button>
        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 text-xs text-muted-foreground">
        <p>By continuing you agree to share your name and email with this application.</p>
      </CardFooter>
    </Card>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.24 10.285v3.705h5.342c-.214 1.19-1.294 3.484-5.342 3.484-3.217 0-5.843-2.665-5.843-5.974s2.626-5.974 5.843-5.974c1.83 0 3.058.776 3.755 1.444l2.56-2.468C16.664 3.198 14.666 2.3 12.24 2.3 6.879 2.3 2.5 6.66 2.5 12s4.379 9.7 9.74 9.7c5.62 0 9.34-3.961 9.34-9.54 0-.64-.07-1.128-.155-1.605H12.24z"
        fill="currentColor"
      />
    </svg>
  )
}
