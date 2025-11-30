/**
 * Email utility functions using Resend (Vercel Optimized)
 *
 * This implementation is optimized for Vercel serverless functions.
 *
 * Setup via Vercel Marketplace (Recommended):
 * 1. Install Resend integration: https://vercel.com/marketplace/resend
 * 2. This automatically sets RESEND_API_KEY environment variable
 *
 * Or manually:
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

interface ConfirmationEmailData {
  to: string
  deadlineTitle: string
  institutionName: string
  deadlineDate: string
  reminderDaysBefore: number
  institutionWebsite?: string
}

interface UnsubscribeConfirmationEmailData {
  to: string
  deadlineTitle?: string
  allReminders: boolean
}

// Create Resend client per request for serverless optimization
// Vercel serverless functions benefit from creating fresh instances
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return null
  }
  return new Resend(apiKey)
}

export async function sendReminderEmail(data: ReminderEmailData): Promise<boolean> {
  try {
    const resend = getResendClient()
    if (!resend) {
      console.error('Resend not configured: RESEND_API_KEY is missing')
      console.error(
        'Install the Resend integration from Vercel Marketplace: https://vercel.com/marketplace/resend',
      )
      return false
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const subject = `Reminder: ${data.deadlineTitle} deadline in ${data.daysUntil} day${data.daysUntil !== 1 ? 's' : ''}`
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'
    const deadlineDate = formatDeadlineDate(data.deadlineDate)

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #d4d4d8; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000000;">
          <div style="background: radial-gradient(ellipse at top, #171717, #0a0a0a); padding: 40px 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
            
            <div style="text-align: center; margin-bottom: 40px;">
               <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">
                Application Deadline Reminder
              </h1>
            </div>

            <div style="text-align: center; margin-bottom: 40px;">
              <p style="font-size: 17px; margin-bottom: 0; color: #d4d4d8; line-height: 1.6;">
                This is a reminder that <strong style="color: #ffffff;">${data.deadlineTitle}</strong> for <strong>${data.institutionName}</strong> is due in <strong style="color: #ffffff;">${data.daysUntil} day${data.daysUntil !== 1 ? 's' : ''}</strong>.
              </p>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.03); padding: 24px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 20px; border-left: 4px solid #ffffff;">
              <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; font-weight: 500;">Deadline Date</p>
              <p style="margin: 6px 0 0 0; font-size: 20px; font-weight: 600; color: #fafafa;">${deadlineDate}</p>
            </div>
            
            ${
              data.institutionWebsite
                ? `
              <div style="margin: 40px 0; text-align: center;">
                <a href="${data.institutionWebsite}" style="display: inline-block; background: #ffffff; color: #000000; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);">Visit Institution Website</a>
              </div>
            `
                : ''
            }
            
            <p style="font-size: 14px; color: #71717a; margin-top: 40px; text-align: center;">
              Don't forget to submit your application on time! Good luck! 🍀
            </p>
            
            <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
              <p style="font-size: 12px; color: #52525b; margin-bottom: 12px;">
                This email was sent from College Application Tracker
              </p>
              <p style="font-size: 11px; color: #52525b;">
                <a href="${appUrl}/reminders/unsubscribe?email=${encodeURIComponent(data.to)}&deadlineId=${encodeURIComponent(data.deadlineTitle)}" style="color: #71717a; text-decoration: underline;">Unsubscribe from this reminder</a> | 
                <a href="${appUrl}/dashboard" style="color: #71717a; text-decoration: underline;">Manage all reminders</a>
              </p>
            </div>
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

/**
 * Sends a confirmation email when a reminder is scheduled
 */
export async function sendReminderConfirmationEmail(data: ConfirmationEmailData): Promise<boolean> {
  try {
    const resend = getResendClient()
    if (!resend) {
      console.error('Resend not configured: RESEND_API_KEY is missing')
      return false
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'
    const deadlineDate = formatDeadlineDate(data.deadlineDate)

    // Calculate when the reminder will be sent
    const deadline = new Date(data.deadlineDate)
    const reminderDate = new Date(deadline)
    reminderDate.setDate(reminderDate.getDate() - data.reminderDaysBefore)
    const reminderDateFormatted = formatDeadlineDate(reminderDate.toISOString().split('T')[0])

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #d4d4d8; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000000;">
          <div style="background: radial-gradient(ellipse at top, #171717, #0a0a0a); padding: 40px 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
            
            <div style="text-align: center; margin-bottom: 40px;">
               <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">
                Reminder Scheduled
              </h1>
            </div>

            <div style="text-align: center; margin-bottom: 40px;">
              <p style="font-size: 17px; margin-bottom: 0; color: #d4d4d8; line-height: 1.6;">
                Your email reminder has been successfully scheduled for <strong style="color: #ffffff;">${data.deadlineTitle}</strong> at <strong>${data.institutionName}</strong>.
              </p>
            </div>

            <div style="background: rgba(255, 255, 255, 0.03); padding: 24px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 20px; border-left: 4px solid #ffffff;">
              <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; font-weight: 500;">You'll receive a reminder on</p>
              <p style="margin: 6px 0 0 0; font-size: 20px; font-weight: 600; color: #fafafa;">${reminderDateFormatted}</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #71717a;">(${data.reminderDaysBefore} day${data.reminderDaysBefore !== 1 ? 's' : ''} before the deadline)</p>
            </div>

            <div style="background: rgba(255, 255, 255, 0.03); padding: 24px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 20px; border-left: 4px solid #ffffff;">
              <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; font-weight: 500;">Application Deadline</p>
              <p style="margin: 6px 0 0 0; font-size: 20px; font-weight: 600; color: #fafafa;">${deadlineDate}</p>
            </div>
            
            ${
              data.institutionWebsite
                ? `
              <div style="margin: 40px 0; text-align: center;">
                <a href="${data.institutionWebsite}" style="display: inline-block; background: #ffffff; color: #000000; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);">Visit Institution Website</a>
              </div>
            `
                : ''
            }
            
            <p style="font-size: 14px; color: #71717a; margin-top: 40px; text-align: center;">
              We'll send you a reminder email ${data.reminderDaysBefore} day${data.reminderDaysBefore !== 1 ? 's' : ''} before the deadline to help you stay on track! 📅
            </p>
            
            <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
              <p style="font-size: 12px; color: #52525b; margin-bottom: 12px;">
                This email was sent from College Application Tracker
              </p>
              <p style="font-size: 11px; color: #52525b;">
                You can manage your reminders in your <a href="${appUrl}/dashboard" style="color: #71717a; text-decoration: underline;">dashboard</a> or 
                <a href="${appUrl}/reminders/unsubscribe?email=${encodeURIComponent(data.to)}&deadlineId=all" style="color: #71717a; text-decoration: underline;">unsubscribe from all reminders</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const { data: emailData, error } = await resend.emails.send({
      from: fromEmail,
      to: data.to,
      subject: `Reminder scheduled: ${data.deadlineTitle} at ${data.institutionName}`,
      html,
    })

    if (error) {
      console.error('Error sending confirmation email via Resend:', error)
      return false
    }

    console.log('Confirmation email sent successfully:', emailData?.id)
    return true
  } catch (error) {
    console.error('Error sending confirmation email:', error)
    return false
  }
}

/**
 * Sends a confirmation email when a user unsubscribes from reminders
 */
export async function sendUnsubscribeConfirmationEmail(
  data: UnsubscribeConfirmationEmailData,
): Promise<boolean> {
  try {
    const resend = getResendClient()
    if (!resend) {
      console.error('Resend not configured: RESEND_API_KEY is missing')
      return false
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #d4d4d8; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000000;">
          <div style="background: radial-gradient(ellipse at top, #171717, #0a0a0a); padding: 40px 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
            
            <div style="text-align: center; margin-bottom: 40px;">
               <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">
                Unsubscribed
              </h1>
            </div>

            <div style="text-align: center; margin-bottom: 40px;">
              <p style="font-size: 17px; margin-bottom: 0; color: #d4d4d8; line-height: 1.6;">
                You have successfully unsubscribed from ${
                  data.allReminders
                    ? 'all email reminders'
                    : `reminders for <strong style="color: #ffffff;">${data.deadlineTitle}</strong>`
                }.
              </p>
            </div>

            <div style="background: rgba(255, 255, 255, 0.03); padding: 24px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 20px; border-left: 4px solid #ffffff;">
              <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; font-weight: 500;">
                ${data.allReminders ? 'All reminders have been disabled' : 'This reminder has been disabled'}
              </p>
              <p style="margin: 4px 0 0 0; font-size: 15px; color: #d4d4d8;">
                You will no longer receive email notifications ${
                  data.allReminders ? 'for any deadline reminders.' : 'for this deadline.'
                }
              </p>
            </div>
            
            <div style="margin: 40px 0; text-align: center;">
              <a href="${appUrl}/dashboard" style="display: inline-block; background: #ffffff; color: #000000; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);">Manage Reminders in Dashboard</a>
            </div>
            
            <p style="font-size: 14px; color: #71717a; margin-top: 40px; text-align: center;">
              You can always re-enable reminders from your dashboard. We're here to help you stay on top of your deadlines! 📅
            </p>
            
            <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
              <p style="font-size: 12px; color: #52525b;">
                This email was sent from College Application Tracker
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const { data: emailData, error } = await resend.emails.send({
      from: fromEmail,
      to: data.to,
      subject: data.allReminders
        ? 'Unsubscribed from all reminders'
        : `Unsubscribed from ${data.deadlineTitle} reminders`,
      html,
    })

    if (error) {
      console.error('Error sending unsubscribe confirmation email via Resend:', error)
      return false
    }

    console.log('Unsubscribe confirmation email sent successfully:', emailData?.id)
    return true
  } catch (error) {
    console.error('Error sending unsubscribe confirmation email:', error)
    return false
  }
}
