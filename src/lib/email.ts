/**
 * Email utility functions using Resend
 * 
 * Required environment variables:
 * - RESEND_API_KEY: Your Resend API key from https://resend.com/api-keys
 * - RESEND_FROM_EMAIL: The email address to send from (e.g., 'onboarding@resend.dev' or 'noreply@yourdomain.com')
 */

import { Resend } from 'resend'

interface ReminderEmailData {
  to: string
  deadlineTitle: string
  institutionName: string
  deadlineDate: string
  daysUntil: number
  institutionWebsite?: string
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendReminderEmail(data: ReminderEmailData): Promise<boolean> {
  try {
    if (!resend) {
      console.error('Resend not configured: RESEND_API_KEY is missing')
      return false
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const subject = `Reminder: ${data.deadlineTitle} deadline in ${data.daysUntil} day${data.daysUntil !== 1 ? 's' : ''}`
    
    const deadlineDate = formatDeadlineDate(data.deadlineDate)
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎓 Application Deadline Reminder</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              This is a reminder that <strong style="color: #667eea;">${data.deadlineTitle}</strong> for <strong>${data.institutionName}</strong> is due in <strong style="color: #ef4444;">${data.daysUntil} day${data.daysUntil !== 1 ? 's' : ''}</strong>.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Deadline Date</p>
              <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: 600; color: #111827;">${deadlineDate}</p>
            </div>
            
            ${data.institutionWebsite ? `
              <div style="margin: 25px 0;">
                <a href="${data.institutionWebsite}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">Visit Institution Website</a>
              </div>
            ` : ''}
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 25px;">
              Don't forget to submit your application on time! Good luck! 🍀
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #9ca3af;">
              This email was sent from College Application Tracker
            </p>
          </div>
        </body>
      </html>
    `

    const { data: emailData, error } = await resend.emails.send({
      from: fromEmail,
      to: data.to,
      subject,
      html,
    })

    if (error) {
      console.error('Error sending email via Resend:', error)
      return false
    }

    console.log('Email sent successfully:', emailData?.id)
    return true
  } catch (error) {
    console.error('Error sending reminder email:', error)
    return false
  }
}

/**
 * Formats the deadline date for display in emails
 */
export function formatDeadlineDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

