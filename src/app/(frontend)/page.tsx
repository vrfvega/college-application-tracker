import { redirect } from 'next/navigation'
import React from 'react'

import { LoginCard } from '@/components/auth/login-card'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function HomePage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect authenticated users to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-4 dark:from-slate-950 dark:via-blue-950/20 dark:to-purple-950/10">
      <div className="w-full max-w-md">
        <LoginCard />
      </div>
    </main>
  )
}
