'use client'

import React from 'react'
import { TrackedDeadlinesProvider } from '@/contexts/tracked-deadlines-context'

export function TrackedDeadlinesProviderWrapper({ children }: { children: React.ReactNode }) {
  return <TrackedDeadlinesProvider>{children}</TrackedDeadlinesProvider>
}

