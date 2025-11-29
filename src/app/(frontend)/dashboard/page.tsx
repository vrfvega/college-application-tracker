import { redirect } from 'next/navigation'

import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { NavHeader } from '@/components/dashboard/nav-header'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <NavHeader userEmail={user?.email ?? null} />
      <DashboardContent userEmail={user?.email ?? null} />
    </div>
  )
}

