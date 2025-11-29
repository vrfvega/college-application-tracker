import { NextResponse } from 'next/server'
import { sendReminderEmail } from '@/lib/email'

// This endpoint will be called by a cron job or scheduled task
// to check deadlines and send reminder emails
// 
// Note: Since reminders are currently stored in localStorage,
// you'll need to either:
// 1. Store reminder preferences in a database
// 2. Have a client-side component periodically check and send reminders
// 3. Use a service like Vercel Cron or GitHub Actions to call this endpoint
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET

    // Verify this request is coming from a cron job (optional but recommended)
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Expected format:
    // {
    //   reminders: [
    //     {
    //       userEmail: string,
    //       deadlineTitle: string,
    //       institutionName: string,
    //       deadlineDate: string,
    //       daysUntil: number,
    //       institutionWebsite?: string
    //     }
    //   ]
    // }

    if (!body.reminders || !Array.isArray(body.reminders)) {
      return NextResponse.json(
        { error: 'Invalid request: expected { reminders: [...] }' },
        { status: 400 },
      )
    }

    let successCount = 0
    let failCount = 0

    for (const reminder of body.reminders) {
      try {
        const success = await sendReminderEmail({
          to: reminder.userEmail,
          deadlineTitle: reminder.deadlineTitle,
          institutionName: reminder.institutionName,
          deadlineDate: reminder.deadlineDate,
          daysUntil: reminder.daysUntil,
          institutionWebsite: reminder.institutionWebsite,
        })

        if (success) {
          successCount++
        } else {
          failCount++
        }
      } catch (error) {
        console.error(`Error sending reminder to ${reminder.userEmail}:`, error)
        failCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder check completed',
      remindersSent: successCount,
      remindersFailed: failCount,
      total: body.reminders.length,
    })
  } catch (error) {
    console.error('Error sending reminders:', error)
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 })
  }
}

