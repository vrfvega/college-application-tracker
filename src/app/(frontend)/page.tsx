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
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-blue-950/20 dark:to-purple-950/10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="mx-auto h-full max-w-5xl bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 blur-3xl opacity-60 animate-pulse" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-16 lg:flex-row lg:items-center">
        <section className="flex-1 space-y-6 text-center lg:text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            College Application Tracker
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            Stay on top of every deadline with one secure sign-in.
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Use Google to sync your checklist, essays, and reminders across every device. No manual
            password management, just seamless authentication powered by Supabase.
          </p>
        </section>

        <section className="flex-1">
          <LoginCard />
        </section>
      </div>
    </main>
  )
}
