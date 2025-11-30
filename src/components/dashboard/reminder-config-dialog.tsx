'use client'

import React, { useState } from 'react'
import { Bell, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTrackedDeadlines, type TrackedDeadline } from '@/contexts/tracked-deadlines-context'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'

interface ReminderConfigDialogProps {
  deadline: TrackedDeadline
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReminderConfigDialog({ deadline, open, onOpenChange }: ReminderConfigDialogProps) {
  const { updateDeadline } = useTrackedDeadlines()
  const [reminderEnabled, setReminderEnabled] = useState(deadline.reminderEnabled ?? false)
  const [reminderDaysBefore, setReminderDaysBefore] = useState(deadline.reminderDaysBefore ?? 7)
  const [daysInputValue, setDaysInputValue] = useState(String(deadline.reminderDaysBefore ?? 7))
  const [isSaving, setIsSaving] = useState(false)

  // Update local state when deadline changes
  React.useEffect(() => {
    if (open && typeof window !== 'undefined') {
      const defaultDays = deadline.reminderDaysBefore ?? 7
      setReminderEnabled(deadline.reminderEnabled ?? false)
      setReminderDaysBefore(defaultDays)
      setDaysInputValue(String(defaultDays))
    }
  }, [deadline, open])

  const handleSave = async () => {
    // Validate that if reminders are enabled, we have a valid number
    if (reminderEnabled) {
      const parsedValue = parseInt(daysInputValue, 10)
      if (isNaN(parsedValue) || parsedValue < 1 || parsedValue > 365) {
        // Invalid input - don't save
        return
      }
      // Ensure reminderDaysBefore is updated with the current input value
      setReminderDaysBefore(parsedValue)
    }

    setIsSaving(true)
    try {
      const finalDaysBefore = reminderEnabled ? parseInt(daysInputValue, 10) : undefined

      updateDeadline(deadline.deadlineId, {
        reminderEnabled,
        reminderDaysBefore: finalDaysBefore,
      })

      // Sync with backend and send test email via Resend
      try {
        const response = await fetch('/api/reminders/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deadlineId: deadline.deadlineId,
            reminderEnabled,
            reminderDaysBefore: finalDaysBefore,
            deadlineTitle: deadline.title,
            institutionName: deadline.institutionName,
            deadlineDate: deadline.date,
            institutionWebsite: deadline.institutionWebsite,
          }),
        })

        const data = await response.json()

        if (response.ok && data.success) {
          if (reminderEnabled) {
            if (data.emailSent) {
              toast.success('Reminder scheduled! Confirmation sent.', {
                description: `Check your inbox for confirmation. You'll receive a reminder ${finalDaysBefore} day${finalDaysBefore !== 1 ? 's' : ''} before the deadline.`,
              })
            } else {
              toast.success('Reminder scheduled', {
                description: `You'll receive a reminder email ${finalDaysBefore} day${finalDaysBefore !== 1 ? 's' : ''} before the deadline.`,
              })
            }
          } else {
            // Reminder disabled - send unsubscribe confirmation
            try {
              const unsubscribeResponse = await fetch('/api/reminders/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  deadlineId: deadline.deadlineId,
                  deadlineTitle: deadline.title,
                }),
              })

              if (unsubscribeResponse.ok) {
                toast.success('Reminders disabled and confirmation sent', {
                  description:
                    'Check your inbox for confirmation. You will no longer receive email reminders for this deadline.',
                })
              } else {
                toast.success('Email reminders disabled', {
                  description: 'You will no longer receive email reminders for this deadline.',
                })
              }
            } catch (error) {
              console.error('Error sending unsubscribe confirmation:', error)
              toast.success('Email reminders disabled', {
                description: 'You will no longer receive email reminders for this deadline.',
              })
            }
          }
        } else {
          // Handle specific error cases
          if (data.error === 'RESEND_NOT_CONFIGURED' || data.error === 'EMAIL_SEND_FAILED') {
            toast.error('Resend not configured', {
              description:
                'Please set up Resend API key in your environment variables. Check RESEND_SETUP.md for instructions.',
            })
            // Settings still saved locally even if email fails
            setIsSaving(false)
            return // Don't close dialog on error, let user see the error
          }

          // Settings saved locally, but backend sync failed
          toast.warning('Settings saved locally', {
            description: reminderEnabled
              ? `Email reminder scheduled (${finalDaysBefore} day${finalDaysBefore !== 1 ? 's' : ''} before), but couldn't verify email service.`
              : 'Email reminders disabled.',
          })
        }
      } catch (error) {
        // Settings saved locally, but backend sync failed
        console.error('Backend sync error:', error)
        toast.warning('Settings saved locally', {
          description: reminderEnabled
            ? `Email reminder scheduled (${finalDaysBefore} day${finalDaysBefore !== 1 ? 's' : ''} before), but couldn't verify email service.`
            : 'Email reminders disabled.',
        })
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Error saving reminder settings:', error)
      toast.error('Failed to save reminder settings', {
        description: 'There was an error saving your reminder preferences. Please try again.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] flex flex-col p-0 gap-0 mx-4">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bell className="h-5 w-5 text-primary" />
            Email Reminder Settings
          </DialogTitle>
          <DialogDescription className="text-sm mt-2">
            Configure when you want to receive email reminders for{' '}
            <span className="font-semibold text-foreground">{deadline.title}</span> at{' '}
            <span className="font-medium">{deadline.institutionName}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col flex-1 min-h-0 px-6 pb-6 space-y-6 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="space-y-1 flex-1">
              <Label htmlFor="reminder-enabled" className="text-base font-medium">
                Enable Email Reminders
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications before this deadline
              </p>
            </div>
            <Switch
              id="reminder-enabled"
              checked={reminderEnabled}
              onCheckedChange={setReminderEnabled}
              className="shrink-0"
            />
          </div>

          {reminderEnabled && (
            <div className="space-y-3 p-4 rounded-lg glass-subtle border border-white/20">
              <div className="space-y-2">
                <Label htmlFor="reminder-days" className="text-sm font-medium">
                  Days Before Deadline
                </Label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Input
                        id="reminder-days"
                        type="number"
                        min="1"
                        max="365"
                        value={daysInputValue}
                        onChange={(e) => {
                          const inputValue = e.target.value
                          // Allow empty string or any input while typing
                          setDaysInputValue(inputValue)

                          // Parse and validate only if it's a valid number
                          if (inputValue !== '') {
                            const value = parseInt(inputValue, 10)
                            if (!isNaN(value) && value > 0 && value <= 365) {
                              setReminderDaysBefore(value)
                            }
                          }
                        }}
                        onBlur={(e) => {
                          // Validate and set default when user leaves the field
                          const value = parseInt(e.target.value, 10)
                          if (isNaN(value) || value < 1) {
                            const defaultDays = 7
                            setDaysInputValue(String(defaultDays))
                            setReminderDaysBefore(defaultDays)
                          } else if (value > 365) {
                            setDaysInputValue('365')
                            setReminderDaysBefore(365)
                          } else {
                            // Ensure the input value matches the valid number
                            setDaysInputValue(String(value))
                          }
                        }}
                        className={`w-20 sm:w-24 ${
                          reminderEnabled &&
                          (daysInputValue === '' ||
                            isNaN(parseInt(daysInputValue, 10)) ||
                            parseInt(daysInputValue, 10) < 1 ||
                            parseInt(daysInputValue, 10) > 365)
                            ? 'border-destructive focus-visible:ring-destructive'
                            : ''
                        }`}
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        day{reminderDaysBefore !== 1 ? 's' : ''} before
                      </span>
                    </div>
                    {reminderEnabled &&
                      (daysInputValue === '' ||
                        isNaN(parseInt(daysInputValue, 10)) ||
                        parseInt(daysInputValue, 10) < 1 ||
                        parseInt(daysInputValue, 10) > 365) && (
                        <p className="text-xs text-destructive">
                          Please enter a number between 1 and 365
                        </p>
                      )}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-white/10">
                <p className="text-sm text-muted-foreground">
                  You&apos;ll receive an email{' '}
                  {daysInputValue !== '' &&
                  !isNaN(parseInt(daysInputValue, 10)) &&
                  parseInt(daysInputValue, 10) > 0 &&
                  parseInt(daysInputValue, 10) <= 365 ? (
                    <>
                      <span className="font-semibold text-foreground">
                        {parseInt(daysInputValue, 10)} day
                        {parseInt(daysInputValue, 10) !== 1 ? 's' : ''}
                      </span>{' '}
                      before the deadline on{' '}
                      <span className="font-medium text-foreground">
                        {(() => {
                          const date = new Date(deadline.date)
                          // Use consistent formatting to avoid hydration mismatch
                          return date.toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                            timeZone: 'UTC',
                          })
                        })()}
                      </span>
                      .
                    </>
                  ) : (
                    <span className="text-muted-foreground">
                      Enter a valid number of days to see when you&apos;ll receive the reminder.
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="px-6 pb-6 pt-4 border-t border-white/10">
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto sm:ml-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                isSaving ||
                (reminderEnabled &&
                  (daysInputValue === '' ||
                    isNaN(parseInt(daysInputValue, 10)) ||
                    parseInt(daysInputValue, 10) < 1 ||
                    parseInt(daysInputValue, 10) > 365))
              }
              className="w-full sm:w-auto"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
