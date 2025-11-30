'use client'

import { useState } from 'react'
import { Calendar, ExternalLink, GraduationCap, Plus, X, Bell, CalendarClock } from 'lucide-react'

import { InstitutionSearchDialog } from '@/components/dashboard/institution-search-dialog'
import { ReminderConfigDialog } from '@/components/dashboard/reminder-config-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTrackedDeadlines } from '@/contexts/tracked-deadlines-context'

interface Deadline {
  title: string
  date: string
  id?: string | null
}

interface DeadlineWithInstitution extends Deadline {
  institution: {
    id: number
    name: string
    website: string
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function getDaysUntilDeadline(dateString: string): number {
  const deadline = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  deadline.setHours(0, 0, 0, 0)
  const diffTime = deadline.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

function getDeadlineStatus(daysUntil: number): {
  label: string
  variant: 'default' | 'destructive' | 'secondary' | 'outline'
} {
  if (daysUntil < 0) {
    return { label: 'Past Due', variant: 'destructive' }
  }
  if (daysUntil === 0) {
    return { label: 'Due Today', variant: 'destructive' }
  }
  if (daysUntil <= 7) {
    return { label: 'Due Soon', variant: 'destructive' }
  }
  if (daysUntil <= 30) {
    return { label: 'Upcoming', variant: 'secondary' }
  }
  return { label: 'Future', variant: 'outline' }
}

export function DashboardContent() {
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
  const [reminderConfigDeadline, setReminderConfigDeadline] = useState<string | null>(null)
  const { trackedDeadlines, removeDeadline, isLoading: isLoadingTracked } = useTrackedDeadlines()

  // Convert tracked deadlines to display format
  const allDeadlines: DeadlineWithInstitution[] = trackedDeadlines.map((tracked) => ({
    title: tracked.title,
    date: tracked.date,
    id: tracked.deadlineId,
    institution: {
      id: tracked.institutionId,
      name: tracked.institutionName,
      website: tracked.institutionWebsite,
    },
  }))

  // Sort deadlines by date (upcoming first)
  allDeadlines.sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return dateA - dateB
  })

  const isLoading = isLoadingTracked

  if (isLoadingTracked || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <GraduationCap className="h-8 w-8 animate-pulse text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Application Deadlines
              </h1>
            <Button onClick={() => setIsSearchDialogOpen(true)} size="lg" variant="default" className="gap-2">
              <Plus className="h-5 w-5" />
              Add Institution
            </Button>
          </div>
        </div>

        {trackedDeadlines.length === 0 ? (
          <Card className="glass-card border-dashed transition-all duration-300 hover:shadow-xl">
            <CardHeader className="text-center">
              <CalendarClock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle>No Deadlines Tracked</CardTitle>
              <CardDescription>
                Start tracking application deadlines by searching for institutions and selecting deadlines.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => setIsSearchDialogOpen(true)} size="lg" variant="default" className="gap-2">
                <Plus className="h-5 w-5" />
                Add Your First Deadline
              </Button>
            </CardContent>
          </Card>
        ) : allDeadlines.length === 0 ? (
          <Card className="glass-card transition-all duration-300">
            <CardHeader>
              <CardTitle>No Deadlines Found</CardTitle>
              <CardDescription>
                The institutions you&apos;re tracking don&apos;t have any deadlines in the system yet. Check back later or
                contact an administrator.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {allDeadlines.map((deadline, index) => {
                const daysUntil = getDaysUntilDeadline(deadline.date)
                const status = getDeadlineStatus(daysUntil)
                const isPastDue = daysUntil < 0

                return (
                  <Card
                    key={`${deadline.institution.id}-${deadline.id || index}`}
                    className={`glass-card transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                      isPastDue ? 'border-destructive/50' : ''
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg leading-tight mb-1">{deadline.title}</CardTitle>
                          <CardDescription className="flex items-center gap-1.5 mt-1">
                            <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{deadline.institution.name}</span>
                          </CardDescription>
                        </div>
                        <Badge variant={status.variant} className="shrink-0">
                          {status.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <time dateTime={deadline.date} className="font-medium">
                            {formatDate(deadline.date)}
                          </time>
                        </div>
                        {daysUntil >= 0 && (
                          <span className="text-xs text-muted-foreground">
                            {daysUntil === 0
                              ? 'Today'
                              : daysUntil === 1
                                ? '1 day left'
                                : `${daysUntil} days left`}
                          </span>
                        )}
                        {isPastDue && (
                          <span className="text-xs text-destructive font-medium">
                            {Math.abs(daysUntil)} day{Math.abs(daysUntil) !== 1 ? 's' : ''} ago
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <a
                          href={deadline.institution.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                        >
                          Visit website
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deadline.id && setReminderConfigDeadline(deadline.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            title={
                              trackedDeadlines.find((d) => d.deadlineId === deadline.id)
                                ?.reminderEnabled
                                ? 'Email reminder enabled'
                                : 'Configure email reminder'
                            }
                          >
                            <Bell
                              className={`h-4 w-4 ${
                                trackedDeadlines.find((d) => d.deadlineId === deadline.id)
                                  ?.reminderEnabled
                                  ? 'fill-current'
                                  : ''
                              }`}
                            />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deadline.id && removeDeadline(deadline.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title="Remove deadline"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p>
                Showing {allDeadlines.length} tracked deadline{allDeadlines.length !== 1 ? 's' : ''}
              </p>
            </div>
          </>
        )}
      </div>

      <InstitutionSearchDialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen} />
      {reminderConfigDeadline && (
        <ReminderConfigDialog
          deadline={
            trackedDeadlines.find((d) => d.deadlineId === reminderConfigDeadline)!
          }
          open={!!reminderConfigDeadline}
          onOpenChange={(open) => !open && setReminderConfigDeadline(null)}
        />
      )}
    </div>
  )
}

