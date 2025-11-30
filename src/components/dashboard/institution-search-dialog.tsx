'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Loader2, GraduationCap, Calendar, Check } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { useTrackedDeadlines } from '@/contexts/tracked-deadlines-context'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface Deadline {
  title: string
  date: string
  id?: string | null
}

interface Institution {
  id: number
  name: string
  website: string
  timezone: string
  deadlines: Deadline[]
}

interface InstitutionSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InstitutionSearchDialog({ open, onOpenChange }: InstitutionSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [expandedInstitution, setExpandedInstitution] = useState<number | null>(null)
  const debouncedQuery = useDebounce(searchQuery, 300)
  const { addDeadline, isDeadlineTracked } = useTrackedDeadlines()

  const searchInstitutions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setInstitutions([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/institutions/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error('Failed to search institutions')
      }
      const data = await response.json()
      setInstitutions(data.institutions || [])
    } catch (error) {
      console.error('Error searching institutions:', error)
      setInstitutions([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    if (debouncedQuery) {
      searchInstitutions(debouncedQuery)
    } else {
      setInstitutions([])
    }
  }, [debouncedQuery, searchInstitutions])

  const handleAddDeadline = (institution: Institution, deadline: Deadline) => {
    const deadlineId = deadline.id || `${institution.id}-${deadline.title}-${deadline.date}`
    addDeadline({
      deadlineId,
      title: deadline.title,
      date: deadline.date,
      institutionId: institution.id,
      institutionName: institution.name,
      institutionWebsite: institution.website,
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  const handleClose = () => {
    setSearchQuery('')
    setInstitutions([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:w-full max-w-[700px] max-h-[90vh] sm:max-h-[85vh] flex flex-col p-0 gap-0 mx-4">
        <DialogHeader className="px-4 sm:px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl">Search Institutions</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Search for colleges and universities to track their application deadlines.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col flex-1 min-h-0 px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by institution name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full text-sm sm:text-base"
            />
          </div>

          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {isSearching && (
              <div className="flex items-center justify-center py-8 sm:py-12 flex-1">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isSearching && searchQuery && institutions.length === 0 && (
              <div className="py-8 sm:py-12 text-center text-sm text-muted-foreground flex-1 flex items-center justify-center">
                No institutions found. Try a different search term.
              </div>
            )}

            {!isSearching && !searchQuery && (
              <div className="py-8 sm:py-12 text-center text-sm text-muted-foreground flex-1 flex items-center justify-center">
                Start typing to search for institutions...
              </div>
            )}

            {!isSearching && institutions.length > 0 && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 -mr-1 scrollbar-thin min-h-0">
                {institutions.map((institution) => {
                  const isExpanded = expandedInstitution === institution.id
                  const hasDeadlines = institution.deadlines && institution.deadlines.length > 0

                  return (
                    <div
                      key={institution.id}
                      className="rounded-xl glass-subtle border transition-all duration-300 hover:glass-strong hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <GraduationCap className="h-5 w-5 shrink-0 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium break-words sm:truncate text-sm sm:text-base">
                              {institution.name}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground break-all sm:truncate mt-0.5">
                              {institution.website}
                            </p>
                            {hasDeadlines && (
                              <p className="text-xs text-muted-foreground mt-1.5">
                                {institution.deadlines.length} deadline{institution.deadlines.length !== 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                        {hasDeadlines && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setExpandedInstitution(isExpanded ? null : institution.id)
                            }
                            className="shrink-0"
                          >
                            {isExpanded ? 'Hide' : 'View'} Deadlines
                          </Button>
                        )}
                      </div>

                      {isExpanded && hasDeadlines && (
                        <div className="border-t border-white/10 px-3 sm:px-4 py-3 space-y-2">
                          {institution.deadlines.map((deadline) => {
                            const deadlineId = deadline.id || `${institution.id}-${deadline.title}-${deadline.date}`
                            const isTracked = isDeadlineTracked(deadlineId)

                            return (
                              <div
                                key={deadlineId}
                                className="flex items-center justify-between gap-3 rounded-lg glass-subtle border border-white/20 p-3 transition-all duration-300 hover:glass-strong hover:shadow-md"
                              >
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm break-words">{deadline.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {formatDate(deadline.date)}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant={isTracked ? 'secondary' : 'default'}
                                  onClick={() => handleAddDeadline(institution, deadline)}
                                  disabled={isTracked}
                                  className="shrink-0"
                                >
                                  {isTracked ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 mr-1" />
                                      Added
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-3.5 w-3.5 mr-1" />
                                      Add
                                    </>
                                  )}
                                </Button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

