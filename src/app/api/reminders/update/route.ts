import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { sendReminderConfirmationEmail } from '@/lib/email'

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

    // If reminders are enabled, send a test/confirmation email to verify Resend is configured
    if (reminderEnabled && reminderDaysBefore && deadlineDate) {
      try {
        // Calculate when the reminder would be sent
        const deadline = new Date(deadlineDate)
        const today = new Date()
        const diffTime = deadline.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        // Only send confirmation email if the deadline is in the future
        if (diffDays > 0) {
          // Send a confirmation email about the scheduled reminder
          // The actual reminder will be sent X days before the deadline via cron job
          const emailSent = await sendReminderConfirmationEmail({
            to: user.email,
            deadlineTitle: deadlineTitle || 'Application Deadline',
            institutionName: institutionName || 'Institution',
            deadlineDate,
            reminderDaysBefore,
            institutionWebsite,
          })

          if (!emailSent) {
            return NextResponse.json(
              {
                success: false,
                message: 'Failed to send test email. Please check your Resend configuration.',
                error: 'RESEND_NOT_CONFIGURED',
              },
              { status: 500 },
            )
          }

          return NextResponse.json({
            success: true,
            message: 'Reminder settings updated and confirmation email sent',
            emailSent: true,
          })
        } else {
          // Deadline is in the past, don't send email but still save settings
          return NextResponse.json({
            success: true,
            message: 'Reminder settings updated (deadline is in the past)',
            emailSent: false,
          })
        }
      } catch (error) {
        console.error('Error sending confirmation email:', error)
        return NextResponse.json(
          {
            success: false,
            message: 'Failed to send confirmation email. Please check your Resend configuration.',
            error: 'EMAIL_SEND_FAILED',
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
