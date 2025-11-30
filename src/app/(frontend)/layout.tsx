import React from 'react'
import { TrackedDeadlinesProviderWrapper } from '@/components/providers/tracked-deadlines-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

export const metadata = {
  description: 'A blank template using Payload in a Next.js app.',
  title: 'Payload Blank Template',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <TrackedDeadlinesProviderWrapper>
          <main>{children}</main>
          <Toaster />
        </TrackedDeadlinesProviderWrapper>
      </body>
    </html>
  )
}
