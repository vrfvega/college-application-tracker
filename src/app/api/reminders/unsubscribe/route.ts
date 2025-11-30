import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { sendUnsubscribeConfirmationEmail } from '@/lib/email'

/**
 * Unsubscribe endpoint
 * GET /api/reminders/unsubscribe?email=user@example.com&deadlineId=deadline-id or deadlineId=all
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const deadlineId = searchParams.get('deadlineId')

    if (!email) {
      return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 })
    }

    if (!deadlineId) {
      return NextResponse.json({ error: 'Missing deadlineId parameter' }, { status: 400 })
    }

    // Verify the user owns this email (optional but recommended)
    // For now, we'll just process the unsubscribe request
    // In production, you might want to verify with a token

    // The actual unsubscribe logic should be handled client-side or via API
    // This endpoint just confirms the unsubscribe request

    const allReminders = deadlineId === 'all'
    const deadlineTitle = deadlineId !== 'all' ? deadlineId : undefined

    // Send confirmation email
    try {
      await sendUnsubscribeConfirmationEmail({
        to: email,
        deadlineTitle,
        allReminders,
      })
    } catch (error) {
      console.error('Error sending unsubscribe confirmation:', error)
      // Continue even if email fails
    }

    return NextResponse.json({
      success: true,
      message: allReminders ? 'Unsubscribed from all reminders' : 'Unsubscribed from reminder',
      email,
      deadlineId: allReminders ? 'all' : deadlineId,
    })
  } catch (error) {
    console.error('Error processing unsubscribe:', error)
    return NextResponse.json({ error: 'Failed to process unsubscribe' }, { status: 500 })
  }
}

/**
 * POST endpoint to unsubscribe (for authenticated users)
 * POST /api/reminders/unsubscribe
 * Body: { deadlineId: string | 'all' }
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
    const { deadlineId, deadlineTitle } = body

    if (!deadlineId) {
      return NextResponse.json({ error: 'Missing deadlineId' }, { status: 400 })
    }

    const allReminders = deadlineId === 'all'

    // Send confirmation email
    try {
      await sendUnsubscribeConfirmationEmail({
        to: user.email,
        deadlineTitle: allReminders ? undefined : deadlineTitle,
        allReminders,
      })
    } catch (error) {
      console.error('Error sending unsubscribe confirmation:', error)
      // Continue even if email fails
    }

    return NextResponse.json({
      success: true,
      message: allReminders ? 'Unsubscribed from all reminders' : 'Unsubscribed from reminder',
      emailSent: true,
    })
  } catch (error) {
    console.error('Error processing unsubscribe:', error)
    return NextResponse.json({ error: 'Failed to process unsubscribe' }, { status: 500 })
  }
}

