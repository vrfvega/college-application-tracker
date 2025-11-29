'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'

const STORAGE_KEY = 'tracked-deadlines'

export interface TrackedDeadline {
  deadlineId: string
  title: string
  date: string
  institutionId: number
  institutionName: string
  institutionWebsite: string
  reminderEnabled?: boolean
  reminderDaysBefore?: number
}

interface TrackedDeadlinesContextType {
  trackedDeadlines: TrackedDeadline[]
  addDeadline: (deadline: TrackedDeadline) => void
  removeDeadline: (deadlineId: string) => void
  updateDeadline: (deadlineId: string, updates: Partial<TrackedDeadline>) => void
  isDeadlineTracked: (deadlineId: string) => boolean
  isLoading: boolean
}

const TrackedDeadlinesContext = createContext<TrackedDeadlinesContextType | undefined>(undefined)

export function TrackedDeadlinesProvider({ children }: { children: React.ReactNode }) {
  const [trackedDeadlines, setTrackedDeadlines] = useState<TrackedDeadline[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const isInitialMount = useRef(true)

  // Load from localStorage on mount
  useEffect(() => {
    const loadDeadlines = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as TrackedDeadline[]
          setTrackedDeadlines(parsed)
        }
      } catch (error) {
        console.error('Error loading tracked deadlines:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDeadlines()

    // Listen for storage events from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as TrackedDeadline[]
          setTrackedDeadlines(parsed)
        } catch (error) {
          console.error('Error loading tracked deadlines from storage event:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Save to localStorage whenever trackedDeadlines changes (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trackedDeadlines))
      } catch (error) {
        console.error('Error saving tracked deadlines:', error)
      }
    }
  }, [trackedDeadlines, isLoading])

  const addDeadline = useCallback((deadline: TrackedDeadline) => {
    setTrackedDeadlines((prev) => {
      // Check if already tracked
      if (prev.some((d) => d.deadlineId === deadline.deadlineId)) {
        return prev
      }
      // Set default reminder settings (disabled by default)
      return [
        ...prev,
        {
          ...deadline,
          reminderEnabled: deadline.reminderEnabled ?? false,
          reminderDaysBefore: deadline.reminderDaysBefore ?? 7,
        },
      ]
    })
  }, [])

  const removeDeadline = useCallback((deadlineId: string) => {
    setTrackedDeadlines((prev) => prev.filter((d) => d.deadlineId !== deadlineId))
  }, [])

  const updateDeadline = useCallback((deadlineId: string, updates: Partial<TrackedDeadline>) => {
    setTrackedDeadlines((prev) =>
      prev.map((d) => (d.deadlineId === deadlineId ? { ...d, ...updates } : d)),
    )
  }, [])

  const isDeadlineTracked = useCallback(
    (deadlineId: string) => {
      return trackedDeadlines.some((d) => d.deadlineId === deadlineId)
    },
    [trackedDeadlines],
  )

  return (
    <TrackedDeadlinesContext.Provider
      value={{
        trackedDeadlines,
        addDeadline,
        removeDeadline,
        updateDeadline,
        isDeadlineTracked,
        isLoading,
      }}
    >
      {children}
    </TrackedDeadlinesContext.Provider>
  )
}

export function useTrackedDeadlines() {
  const context = useContext(TrackedDeadlinesContext)
  if (context === undefined) {
    throw new Error('useTrackedDeadlines must be used within a TrackedDeadlinesProvider')
  }
  return context
}

