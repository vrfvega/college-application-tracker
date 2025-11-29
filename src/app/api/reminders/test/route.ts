import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { sendReminderEmail } from '@/lib/email'

/**
 * Test endpoint to send a reminder email
 * POST /api/reminders/test
 * Body: { deadlineTitle, institutionName, deadlineDate, daysUntil, institutionWebsite? }
 */
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
    const { deadlineTitle, institutionName, deadlineDate, daysUntil, institutionWebsite } = body

    if (!deadlineTitle || !institutionName || !deadlineDate || daysUntil === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: deadlineTitle, institutionName, deadlineDate, daysUntil' },
        { status: 400 },
      )
    }

    const success = await sendReminderEmail({
      to: user.email,
      deadlineTitle,
      institutionName,
      deadlineDate,
      daysUntil,
      institutionWebsite,
    })

    if (!success) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      email: user.email,
    })
  } catch (error) {
    console.error('Error sending test reminder email:', error)
    return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 })
  }
}

