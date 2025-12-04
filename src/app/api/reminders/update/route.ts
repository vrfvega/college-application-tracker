import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { scheduleReminderEmail, sendReminderConfirmationEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      reminderEnabled,
      reminderDaysBefore,
      deadlineTitle,
      institutionName,
      deadlineDate,
      institutionWebsite,
    } = body

    console.log('=== REMINDER UPDATE REQUEST ===')
    console.log('User email:', user.email)
    console.log('Request body:', JSON.stringify(body, null, 2))

    // If reminders are enabled, schedule the actual reminder email via Resend
    if (reminderEnabled && reminderDaysBefore && deadlineDate) {
      console.log('Reminders enabled, attempting to schedule...')
      try {
        // Calculate when the reminder would be sent
        // Parse the date - handle both ISO format and YYYY-MM-DD
        const deadline = new Date(deadlineDate)
        console.log('Parsed deadline:', deadline.toISOString())
        const today = new Date()
        today.setUTCHours(0, 0, 0, 0)
        const diffTime = deadline.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        console.log('Days until deadline:', diffDays)

        // Only schedule reminder if the deadline is in the future
        if (diffDays > 0) {
          console.log('Deadline is in future, scheduling reminder...')
          
          // Schedule the actual reminder email using Resend's scheduling feature
          const scheduleResult = await scheduleReminderEmail({
            to: user.email,
            deadlineTitle: deadlineTitle || 'Application Deadline',
            institutionName: institutionName || 'Institution',
            deadlineDate,
            reminderDaysBefore,
            institutionWebsite,
          })
          console.log('Schedule result:', JSON.stringify(scheduleResult, null, 2))

          // Always send confirmation email first
          console.log('Sending confirmation email...')
          const confirmationSent = await sendReminderConfirmationEmail({
            to: user.email,
            deadlineTitle: deadlineTitle || 'Application Deadline',
            institutionName: institutionName || 'Institution',
            deadlineDate,
            reminderDaysBefore,
            institutionWebsite,
          })
          console.log('Confirmation email sent:', confirmationSent)

          if (!scheduleResult.success) {
            // Handle specific error cases
            if (scheduleResult.error === 'RESEND_NOT_CONFIGURED') {
              return NextResponse.json(
                {
                  success: false,
                  message: 'Resend is not configured. Please check your API key.',
                  error: 'RESEND_NOT_CONFIGURED',
                },
                { status: 500 },
              )
            }

            if (scheduleResult.error === 'REMINDER_DATE_IN_PAST') {
              return NextResponse.json({
                success: true,
                message: 'Reminder date has already passed. Confirmation email sent.',
                emailSent: confirmationSent,
                scheduledEmailId: null,
              })
            }

            // Check if it's a paid feature error (scheduling requires paid plan)
            const errorLower = (scheduleResult.error || '').toLowerCase()
            if (errorLower.includes('upgrade') || errorLower.includes('paid') || errorLower.includes('plan')) {
              console.log('Scheduling requires paid Resend plan. Confirmation email sent instead.')
              return NextResponse.json({
                success: true,
                message: 'Reminder saved. Note: Email scheduling requires a paid Resend plan. Confirmation email sent.',
                emailSent: confirmationSent,
                scheduledEmailId: null,
                schedulingError: scheduleResult.error,
              })
            }

            // Other scheduling errors - still return success if confirmation was sent
            console.error('Failed to schedule email:', scheduleResult.error)
            return NextResponse.json({
              success: confirmationSent,
              message: confirmationSent 
                ? `Reminder saved. Scheduling failed: ${scheduleResult.error}. Confirmation email sent.`
                : `Failed to schedule reminder email: ${scheduleResult.error}`,
              emailSent: confirmationSent,
              scheduledEmailId: null,
              schedulingError: scheduleResult.error,
            })
          }

          return NextResponse.json({
            success: true,
            message: 'Reminder email scheduled successfully',
            emailSent: confirmationSent,
            scheduledEmailId: scheduleResult.emailId,
            scheduledAt: scheduleResult.scheduledAt,
          })
        } else {
          // Deadline is in the past, don't schedule but still save settings
          return NextResponse.json({
            success: true,
            message: 'Reminder settings updated (deadline is in the past)',
            emailSent: false,
          })
        }
      } catch (error) {
        console.error('Error scheduling reminder email:', error)
        return NextResponse.json(
          {
            success: false,
            message: 'Failed to schedule reminder email. Please check your Resend configuration.',
            error: 'EMAIL_SCHEDULE_FAILED',
          },
          { status: 500 },
        )
      }
    }

    // Store reminder preferences (this could be stored in a database in the future)
    // For now, we'll just return success as the settings are stored in localStorage
    // In a production app, you'd store this in a database associated with the user

    return NextResponse.json({
      success: true,
      message: 'Reminder settings updated',
    })
  } catch (error) {
    console.error('Error updating reminder settings:', error)
    return NextResponse.json({ error: 'Failed to update reminder settings' }, { status: 500 })
  }
}
