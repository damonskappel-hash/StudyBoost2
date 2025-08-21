'use client'

import { useUser, useAuth } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserButton } from '@clerk/nextjs'
import { 
  Brain, 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Plus,
  ArrowRight,
  BookOpen,
  BarChart3,
  TrendingUp,
  Calendar,
  Target,
  Award
} from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { AppLayout } from "@/components/app-layout"

export default function Dashboard() {
  const { user } = useUser()
  const { has } = useAuth()
  const toast = useToast()
  const hasAttemptedCreation = useRef(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('free')
  const [refreshKey, setRefreshKey] = useState(0)
  
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
  // Activity: streak and goals
  const activityStats = useQuery(api.activity.getStreakAndGoals, user?.id ? {} : "skip")

  // Update subscription mutation
  const updateSubscription = useMutation(api.users.updateSubscription)

  // Check user's subscription using Clerk's has() method
  useEffect(() => {
    if (has) {
      // Check subscription plans using Clerk's has() method
      const hasStudentPlan = has({ plan: 'student' })
      const hasProPlan = has({ plan: 'pro' })
      const hasPremiumPlan = has({ plan: 'premium' })
      
      console.log('Clerk plan access:', { hasStudentPlan, hasProPlan, hasPremiumPlan })
      
      // Determine subscription status
      let subscription = 'free'
      if (hasProPlan || hasPremiumPlan) {
        subscription = 'pro'
      } else if (hasStudentPlan) {
        subscription = 'student'
      }
      
      setSubscriptionStatus(subscription)
    }
  }, [has])

  // Create user mutation
  const createUser = useMutation(api.users.createUser)

  // Create user in Convex if they don't exist
  useEffect(() => {
    if (user && !convexUser && !hasAttemptedCreation.current) {
      hasAttemptedCreation.current = true
      
      createUser({
        clerkUserId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        name: user.fullName || undefined,
      }).then(() => {
        toast.success("Account created successfully!")
      }).catch((error) => {
        console.error("Failed to create user:", error)
        hasAttemptedCreation.current = false // Reset on error
      })
    }
  }, [user, convexUser, createUser, toast])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4 text-foreground">Please sign in</h1>
          <p className="text-muted-foreground">You need to be signed in to access the dashboard.</p>
        </div>
      </div>
    )
  }

  const recentNotes = notes?.slice(0, 5) || []
  const completedNotes = notes?.filter(note => note.enhancementStatus === "completed").length || 0
  const pendingNotes = notes?.filter(note => note.enhancementStatus === "pending").length || 0

  return (
    <AppLayout>
      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2 tracking-tight">
            Welcome back, {user.firstName || user.username || "Student"}!
          </h1>
          <p className="text-muted-foreground text-base">
            Ready to enhance your notes and study smarter?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border border-border bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Completed</CardTitle>
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <CheckCircle className="h-3.5 w-3.5 text-primary" />
                </div>
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">{completedNotes}</div>
              <p className="text-sm text-muted-foreground">
                Enhanced notes
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Pending</CardTitle>
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <AlertCircle className="h-3.5 w-3.5 text-primary" />
                </div>
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">{pendingNotes}</div>
              <p className="text-sm text-muted-foreground">
                Waiting to start
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Usage Meter and Quick Upload - Side by Side */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Usage Meter for Free Users, Study Analytics for Paid Users */}
          {(subscriptionStatus === 'free') && usageLimit ? (
            <Card className="border border-border bg-card shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-base font-medium text-foreground">
                  <span>Monthly Usage</span>
                  <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
                    {usageLimit?.currentUsage || 0}/{usageLimit?.limit || 0}
                  </span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  You've used {usageLimit?.currentUsage || 0} of {usageLimit?.limit || 0} notes this month
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Enhanced progress bar */}
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 transition-all duration-500 ease-out"
                      style={{ width: `${((usageLimit?.currentUsage || 0) / (usageLimit?.limit || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {usageLimit?.canUse ? `${(usageLimit?.limit || 0) - (usageLimit?.currentUsage || 0)} notes remaining` : "Limit reached"}
                    </span>
                    <span className="text-sm font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md">
                      {Math.round(((usageLimit?.currentUsage || 0) / (usageLimit?.limit || 1)) * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-base font-medium text-foreground">
                  <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                  Study Progress
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Track your learning journey
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Goals Met</span>
                    <span className="text-sm font-semibold text-foreground">
                      {activityStats?.goalsMet || 0}/5
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Day Streak</span>
                    <span className="text-sm font-semibold text-foreground">
                      {activityStats?.streak || 0} days
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Upload */}
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-base font-medium text-foreground">
                <Upload className="mr-2 h-4 w-4 text-primary" />
                Quick Upload
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Enhance a new note in seconds
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/enhance">
                <Button size="sm" className="w-full h-9">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Note
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Notes */}
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-base font-medium text-foreground">
              <span>Recent Notes</span>
              <Link href="/subjects">
                <Button variant="ghost" size="sm" className="h-8 text-sm">
                  View All
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {recentNotes.length > 0 ? (
              <div className="space-y-3">
                {recentNotes.map((note) => (
                  <div key={note._id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{note.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {note.subject || 'No subject'} • {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={note.enhancementStatus === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {note.enhancementStatus}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-sm font-medium text-foreground">No notes yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Get started by uploading your first note.
                </p>
                <Link href="/enhance">
                  <Button size="sm" className="mt-4 h-8">
                    <Plus className="mr-2 h-3 w-3" />
                    Upload Note
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
