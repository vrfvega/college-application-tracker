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
    <main className="relative flex min-h-screen items-center justify-center p-4 selection:bg-primary/20">
      {/* Elegant Background */}
      <div className="fixed inset-0 -z-10 h-full w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black">
        {/* Subtle accent lights */}
        <div className="absolute -left-[10%] -top-[10%] h-[600px] w-[600px] rounded-full bg-indigo-500/5 blur-[120px]" />
        <div className="absolute -right-[10%] top-[20%] h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute bottom-0 left-[20%] h-[500px] w-[500px] rounded-full bg-slate-500/5 blur-[100px]" />
      </div>

      <div className="w-full max-w-md">
        <LoginCard />
      </div>
    </main>
  )
}
