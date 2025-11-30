import { NextResponse } from 'next/server'
import { sendReminderEmail } from '@/lib/email'

/**
 * Endpoint to check and send reminders for a specific user
 * This can be called client-side or from a cron job that iterates through users
 * 
 * POST /api/reminders/check
 * Body: { userEmail: string, trackedDeadlines: TrackedDeadline[] }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userEmail, trackedDeadlines } = body

    if (!userEmail || !trackedDeadlines || !Array.isArray(trackedDeadlines)) {
      return NextResponse.json(
        { error: 'Missing required fields: userEmail, trackedDeadlines' },
        { status: 400 },
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let remindersSent = 0
    const remindersToSend: Array<{
      deadlineTitle: string
      institutionName: string
      deadlineDate: string
      daysUntil: number
    }> = []

    // Check each tracked deadline
    for (const deadline of trackedDeadlines) {
      // Skip if reminder is not enabled
      if (!deadline.reminderEnabled || !deadline.reminderDaysBefore) {
        continue
      }

      const deadlineDate = new Date(deadline.date)
      deadlineDate.setHours(0, 0, 0, 0)

      // Calculate days until deadline
      const diffTime = deadlineDate.getTime() - today.getTime()
      const daysUntilDeadline = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      // Check if we should send the reminder today
      // We send it when daysUntilDeadline equals reminderDaysBefore
      if (daysUntilDeadline === deadline.reminderDaysBefore && daysUntilDeadline > 0) {
        remindersToSend.push({
          deadlineTitle: deadline.title,
          institutionName: deadline.institutionName,
          deadlineDate: deadline.date,
          daysUntil: daysUntilDeadline,
        })

        try {
          const success = await sendReminderEmail({
            to: userEmail,
            deadlineTitle: deadline.title,
            institutionName: deadline.institutionName,
            deadlineDate: deadline.date,
            daysUntil: daysUntilDeadline,
            institutionWebsite: deadline.institutionWebsite,
          })

          if (success) {
            remindersSent++
          }
        } catch (error) {
          console.error(`Error sending reminder for ${deadline.title}:`, error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent,
      totalChecked: trackedDeadlines.filter((d) => d.reminderEnabled).length,
      remindersToSend: remindersToSend.length,
    })
  } catch (error) {
    console.error('Error checking reminders:', error)
    return NextResponse.json({ error: 'Failed to check reminders' }, { status: 500 })
  }
}

