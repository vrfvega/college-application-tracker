# Resend Email Setup Guide

This guide will help you set up Resend to send email reminders for application deadlines.

## Required Environment Variables

Add the following to your `.env.local` file:

```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
```

Or if you have a custom domain:

```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

## Steps to Set Up

### 1. Get Your Resend API Key

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Navigate to [API Keys](https://resend.com/api-keys)
4. Create a new API key
5. Copy the API key (starts with `re_`)

### 2. Set Up Your From Email

**Option A: Use Resend's Test Domain (Quick Start)**
- Use: `onboarding@resend.dev`
- No verification needed
- Only works for development/testing

**Option B: Use Your Own Domain (Production)**
1. Go to [Domains](https://resend.com/domains) in Resend
2. Add your domain (e.g., `yourdomain.com`)
3. Add the DNS records Resend provides to your domain
4. Wait for verification (usually a few minutes)
5. Use: `noreply@yourdomain.com` or any email from your verified domain

### 3. Add Environment Variables

Add the variables to your `.env.local` file:

```env
RESEND_API_KEY=re_abc123xyz...
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### 4. Test the Email Functionality

You can test sending emails using the test endpoint:

```bash
curl -X POST http://localhost:3000/api/reminders/test \
  -H "Content-Type: application/json" \
  -d '{
    "deadlineTitle": "Early Decision Application",
    "institutionName": "Stanford University",
    "deadlineDate": "2024-12-15",
    "daysUntil": 7,
    "institutionWebsite": "https://stanford.edu"
  }'
```

Or use the browser console while logged in:

```javascript
fetch('/api/reminders/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    deadlineTitle: "Early Decision Application",
    institutionName: "Stanford University",
    deadlineDate: "2024-12-15",
    daysUntil: 7,
    institutionWebsite: "https://stanford.edu"
  })
})
```

## API Endpoints

### POST `/api/reminders/test`
Send a test reminder email to the currently logged-in user.

**Authentication:** Required (Supabase)

**Body:**
```json
{
  "deadlineTitle": "string",
  "institutionName": "string",
  "deadlineDate": "YYYY-MM-DD",
  "daysUntil": number,
  "institutionWebsite": "string (optional)"
}
```

### POST `/api/reminders/send`
Batch send reminder emails (for cron jobs).

**Authentication:** Optional (Bearer token via `CRON_SECRET`)

**Body:**
```json
{
  "reminders": [
    {
      "userEmail": "user@example.com",
      "deadlineTitle": "string",
      "institutionName": "string",
      "deadlineDate": "YYYY-MM-DD",
      "daysUntil": number,
      "institutionWebsite": "string (optional)"
    }
  ]
}
```

## Setting Up Automated Reminders (Cron Job)

To automatically send reminders, you'll need to:

1. **Store reminder preferences in a database** (currently in localStorage)
2. **Set up a cron job** to check deadlines daily
3. **Call `/api/reminders/send`** with the reminders to send

### Option 1: Vercel Cron (if deployed on Vercel)

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/reminders/send",
    "schedule": "0 9 * * *"
  }]
}
```

Set `CRON_SECRET` in Vercel environment variables for security.

### Option 2: GitHub Actions

Create `.github/workflows/reminders.yml`:

```yaml
name: Send Reminders
on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM daily
jobs:
  send:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: |
          curl -X POST https://your-app.com/api/reminders/send \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            -d '{...}'
```

## Free Tier Limits

Resend free tier includes:
- 3,000 emails/month
- 100 emails/day

Upgrade for higher limits if needed.

## Troubleshooting

### Email not sending?
1. Check `RESEND_API_KEY` is set correctly
2. Verify `RESEND_FROM_EMAIL` is from a verified domain
3. Check server logs for error messages
4. Verify the API key has permission to send emails

### "Unauthorized" error?
- Make sure you're logged in when using `/api/reminders/test`
- For `/api/reminders/send`, set `CRON_SECRET` if using authentication

### Emails going to spam?
- Use a verified custom domain
- Ensure SPF/DKIM records are set up correctly in Resend
- Avoid spam trigger words in subject/content

