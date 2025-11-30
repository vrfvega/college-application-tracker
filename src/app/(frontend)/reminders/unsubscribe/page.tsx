'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { useTrackedDeadlines } from '@/contexts/tracked-deadlines-context'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { trackedDeadlines, updateDeadline } = useTrackedDeadlines()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const email = searchParams.get('email')
    const deadlineId = searchParams.get('deadlineId')

    if (!email || !deadlineId) {
      setStatus('error')
      setMessage('Invalid unsubscribe link. Missing required parameters.')
      return
    }

    const unsubscribeFromDeadline = async () => {
      try {
        const allReminders = deadlineId === 'all'

        if (allReminders) {
          // Disable all reminders
          trackedDeadlines.forEach((deadline) => {
            updateDeadline(deadline.deadlineId, {
              reminderEnabled: false,
            })
          })
          setMessage('You have been unsubscribed from all email reminders.')
        } else {
          // Find and disable the specific deadline reminder
          const deadline = trackedDeadlines.find((d) => d.deadlineId === deadlineId || d.title === deadlineId)
          if (deadline) {
            updateDeadline(deadline.deadlineId, {
              reminderEnabled: false,
            })
            setMessage(`You have been unsubscribed from reminders for "${deadline.title}".`)
          } else {
            // Deadline not found in tracked deadlines, but still send confirmation
            setMessage(`Unsubscribe request processed. If you were subscribed, you have been unsubscribed.`)
          }
        }

        // Call API to send confirmation email
        try {
          await fetch('/api/reminders/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              deadlineId,
              deadlineTitle: allReminders ? undefined : trackedDeadlines.find((d) => d.deadlineId === deadlineId || d.title === deadlineId)?.title,
            }),
          })
        } catch (error) {
          console.error('Error sending unsubscribe confirmation:', error)
          // Continue even if API call fails
        }

        setStatus('success')
      } catch (error) {
        console.error('Error unsubscribing:', error)
        setStatus('error')
        setMessage('An error occurred while processing your unsubscribe request. Please try again or contact support.')
      }
    }

    unsubscribeFromDeadline()
  }, [searchParams, trackedDeadlines, updateDeadline])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-blue-950/20 dark:to-purple-950/10 flex items-center justify-center p-4">
      <Card className="glass-card w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
              <CardTitle>Processing Unsubscribe...</CardTitle>
              <CardDescription>Please wait while we process your request.</CardDescription>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <CardTitle>Successfully Unsubscribed</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <CardTitle>Error</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
        </CardHeader>
        {status === 'success' && (
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
              <p className="text-sm text-green-800 dark:text-green-200">
                A confirmation email has been sent to your inbox.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => router.push('/dashboard')} className="w-full">
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={() => router.push('/')} className="w-full">
                Return Home
              </Button>
            </div>
          </CardContent>
        )}
        {status === 'error' && (
          <CardContent>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-blue-950/20 dark:to-purple-950/10 flex items-center justify-center">
          <Card className="glass-card w-full max-w-md">
            <CardHeader className="text-center">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  )
}

