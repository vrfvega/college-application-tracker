'use client'

import { useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'tracked-institutions'

export interface TrackedInstitution {
  id: number
  name: string
  website: string
  timezone: string
}

export function useTrackedInstitutions() {
  const [trackedInstitutions, setTrackedInstitutions] = useState<TrackedInstitution[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as TrackedInstitution[]
        setTrackedInstitutions(parsed)
      }
    } catch (error) {
      console.error('Error loading tracked institutions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save to localStorage whenever trackedInstitutions changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trackedInstitutions))
      } catch (error) {
        console.error('Error saving tracked institutions:', error)
      }
    }
  }, [trackedInstitutions, isLoading])

  const addInstitution = useCallback((institution: TrackedInstitution) => {
    setTrackedInstitutions((prev) => {
      // Check if already tracked
      if (prev.some((inst) => inst.id === institution.id)) {
        return prev
      }
      return [...prev, institution]
    })
  }, [])

  const removeInstitution = useCallback((id: number) => {
    setTrackedInstitutions((prev) => prev.filter((inst) => inst.id !== id))
  }, [])

  const isTracked = useCallback(
    (id: number) => {
      return trackedInstitutions.some((inst) => inst.id === id)
    },
    [trackedInstitutions],
  )

  return {
    trackedInstitutions,
    addInstitution,
    removeInstitution,
    isTracked,
    isLoading,
  }
}

