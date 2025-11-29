import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { deadlineId, reminderEnabled, reminderDaysBefore } = body

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

