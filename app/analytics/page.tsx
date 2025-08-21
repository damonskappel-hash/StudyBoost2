'use client'

import { useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { UserButton } from '@clerk/nextjs'
import { 
  Brain, 
  TrendingUp,
  Calendar,
  Target,
  Clock,
  BookOpen,
  Award,
  BarChart3,
  Activity,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  FileText,
  Star
} from "lucide-react"
import Link from "next/link"
import { useMemo } from "react"
import { AppLayout } from "@/components/app-layout"

export default function AnalyticsPage() {
  const { user } = useUser()
  
  // Get user data from Convex
  const convexUser = useQuery(api.users.getUserByClerkId, {
    clerkUserId: user?.id || ""
  })
  
  // Get user's notes
  const notes = useQuery(api.notes.getNotesByUser)
  
  // Get usage limit
  const usageLimit = useQuery(api.users.checkUsageLimit, {
    clerkUserId: user?.id || ""
  })

  // Calculate analytics data - moved before conditional returns
  const analytics = useMemo(() => {
    if (!notes) return {
      totalNotes: 0,
      notesThisWeek: 0,
      notesThisMonth: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalWords: 0,
      avgWordsPerNote: 0,
      completionRate: 0,
      subjectStats: {},
      noteDates: 0
    }

    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Filter notes by time periods
    const notesThisWeek = notes.filter(note => new Date(note.createdAt) >= oneWeekAgo)
    const notesThisMonth = notes.filter(note => new Date(note.createdAt) >= oneMonthAgo)

    // Calculate study streak (consecutive days with notes)
    const noteDates = [...new Set(notes.map(note => 
      new Date(note.createdAt).toDateString()
    ))].sort()

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    for (let i = 0; i < noteDates.length; i++) {
      const currentDate = new Date(noteDates[i])
      const nextDate = i < noteDates.length - 1 ? new Date(noteDates[i + 1]) : null
      
      if (nextDate) {
        const dayDiff = (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        if (dayDiff === 1) {
          tempStreak++
        } else {
          if (tempStreak > longestStreak) longestStreak = tempStreak
          tempStreak = 0
        }
      }
    }

    // Calculate current streak (from today backwards)
    const today = new Date().toDateString()
    let daysBack = 0
    while (daysBack < 365) {
      const checkDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000).toDateString()
      if (noteDates.includes(checkDate)) {
        currentStreak++
        daysBack++
      } else {
        break
      }
    }

    // Subject performance
    const subjectStats = notes.reduce((acc, note) => {
      const subject = note.subject || 'Uncategorized'
      if (!acc[subject]) {
        acc[subject] = {
          total: 0,
          completed: 0,
          processing: 0,
          failed: 0,
          totalWords: 0
        }
      }
      acc[subject].total++
      acc[subject][note.enhancementStatus]++
      acc[subject].totalWords += note.wordCount || 0
      return acc
    }, {} as Record<string, any>)

    // Calculate total words and average words per note
    const totalWords = notes.reduce((sum, note) => sum + (note.wordCount || 0), 0)
    const avgWordsPerNote = notes.length > 0 ? Math.round(totalWords / notes.length) : 0

    // Calculate completion rate
    const completedNotes = notes.filter(note => note.enhancementStatus === 'completed').length
    const completionRate = notes.length > 0 ? Math.round((completedNotes / notes.length) * 100) : 0

    return {
      totalNotes: notes.length,
      notesThisWeek: notesThisWeek.length,
      notesThisMonth: notesThisMonth.length,
      currentStreak,
      longestStreak,
      totalWords,
      avgWordsPerNote,
      completionRate,
      subjectStats,
      noteDates: noteDates.length
    }
  }, [notes])

  // Get top subjects by note count
  const topSubjects = useMemo(() => {
    return Object.entries(analytics.subjectStats)
      .sort(([,a], [,b]) => b.total - a.total)
      .slice(0, 5)
  }, [analytics.subjectStats])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="text-gray-600">You need to be signed in to view your analytics.</p>
        </div>
      </div>
    )
  }

  if (!notes || !convexUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Track your study progress, performance, and learning patterns
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Notes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalNotes}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.notesThisWeek} this week
                </p>
              </CardContent>
            </Card>

            {/* Study Streak */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.currentStreak} days</div>
                <p className="text-xs text-muted-foreground">
                  Longest: {analytics.longestStreak} days
                </p>
              </CardContent>
            </Card>

            {/* Total Words */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Words</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalWords.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  ~{analytics.avgWordsPerNote} per note
                </p>
              </CardContent>
            </Card>

            {/* Completion Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.completionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Notes enhanced
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Usage Progress */}
          {usageLimit && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="mr-2 h-5 w-5" />
                  Monthly Usage
                </CardTitle>
                <CardDescription>
                  Track your AI enhancement usage this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Free Tier</span>
                    <span>{usageLimit.currentUsage || 0}/{usageLimit.limit}</span>
                  </div>
                  <Progress value={((usageLimit.currentUsage || 0) / usageLimit.limit) * 100} />
                  <p className="text-xs text-muted-foreground">
                    {usageLimit.canUse ? 
                      `${usageLimit.limit - (usageLimit.currentUsage || 0)} notes remaining` : 
                      "You've reached your monthly limit"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subject Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Top Subjects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Top Subjects
                </CardTitle>
                <CardDescription>
                  Your most active subjects by note count
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topSubjects.map(([subject, stats]) => (
                    <div key={subject} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{subject}</p>
                          <p className="text-xs text-gray-500">{stats.totalWords.toLocaleString()} words</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{stats.total} notes</p>
                        <p className="text-xs text-gray-500">
                          {Math.round((stats.completed / stats.total) * 100)}% complete
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Study Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  Study Activity
                </CardTitle>
                <CardDescription>
                  Your note creation activity over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">This Week</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{analytics.notesThisWeek}</span>
                      <Badge variant="outline" className="text-xs">
                        {analytics.notesThisWeek > 0 ? 'Active' : 'No activity'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">This Month</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{analytics.notesThisMonth}</span>
                      <Badge variant="outline" className="text-xs">
                        {analytics.notesThisMonth > 5 ? 'High Activity' : 'Moderate'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Study Days</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{analytics.noteDates}</span>
                      <Badge variant="outline" className="text-xs">
                        {analytics.noteDates > 10 ? 'Consistent' : 'Getting Started'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Achievements & Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="mr-2 h-5 w-5" />
                  Achievements
                </CardTitle>
                <CardDescription>
                  Milestones and accomplishments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.totalNotes >= 10 && (
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <Star className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-sm text-green-900">Note Collector</p>
                        <p className="text-xs text-green-700">Created 10+ notes</p>
                      </div>
                    </div>
                  )}
                  {analytics.currentStreak >= 7 && (
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-sm text-blue-900">Study Streak</p>
                        <p className="text-xs text-blue-700">7+ day study streak</p>
                      </div>
                    </div>
                  )}
                  {analytics.totalWords >= 10000 && (
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <BookOpen className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium text-sm text-purple-900">Word Master</p>
                        <p className="text-xs text-purple-700">10,000+ words written</p>
                      </div>
                    </div>
                  )}
                  {analytics.completionRate >= 80 && (
                    <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-sm text-orange-900">Completionist</p>
                        <p className="text-xs text-orange-700">80%+ notes enhanced</p>
                      </div>
                    </div>
                  )}
                  {analytics.totalNotes < 10 && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Target className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-sm text-gray-900">Getting Started</p>
                        <p className="text-xs text-gray-700">Create more notes to unlock achievements</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Insights & Recommendations
                </CardTitle>
                <CardDescription>
                  AI-powered study insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.currentStreak === 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Tip:</strong> Start a study streak by creating a note today!
                      </p>
                    </div>
                  )}
                  {analytics.notesThisWeek === 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Tip:</strong> No notes this week. Try uploading a lecture recording or image!
                      </p>
                    </div>
                  )}
                  {analytics.completionRate < 50 && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800">
                        <strong>Tip:</strong> Enhance more notes to unlock AI features like summaries and quizzes.
                      </p>
                    </div>
                  )}
                  {topSubjects.length > 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Great job!</strong> You're most active in <strong>{topSubjects[0][0]}</strong>. 
                        Consider using subject-level AI features for comprehensive review.
                      </p>
                    </div>
                  )}
                  {analytics.totalWords > 5000 && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm text-purple-800">
                        <strong>Impressive!</strong> You've written {analytics.totalWords.toLocaleString()} words. 
                        Use AI summaries to condense your knowledge.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
