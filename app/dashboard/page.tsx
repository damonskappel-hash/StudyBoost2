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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="text-gray-600">You need to be signed in to access the dashboard.</p>
        </div>
      </div>
    )
  }

  const recentNotes = notes?.slice(0, 5) || []
  const completedNotes = notes?.filter(note => note.enhancementStatus === "completed").length || 0
  const pendingNotes = notes?.filter(note => note.enhancementStatus === "pending").length || 0

  return (
    <AppLayout>
      <div className="p-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            Welcome back, {user.firstName || user.username || "Student"}!
          </h1>
          <p className="text-gray-600 text-lg font-medium">
            Ready to enhance your notes and study smarter?
          </p>
        </div>





        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700 tracking-wide uppercase">Completed</CardTitle>
              <div className="p-2 bg-blue-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-blue-600 mb-1">{completedNotes}</div>
              <p className="text-sm text-gray-500 font-medium">
                Enhanced notes
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700 tracking-wide uppercase">Pending</CardTitle>
              <div className="p-2 bg-blue-50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-blue-500 mb-1">{pendingNotes}</div>
              <p className="text-sm text-gray-500 font-medium">
                Waiting to start
              </p>
            </CardContent>
          </Card>
        </div>



        {/* Usage Meter and Quick Upload - Side by Side */}
        <div className="grid md:grid-cols-2 gap-8 mb-10">
          {/* Usage Meter for Free Users, Study Analytics for Paid Users */}
          {(subscriptionStatus === 'free') && usageLimit ? (
            <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-800 tracking-wide">
                  <span>Monthly Usage</span>
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {usageLimit?.currentUsage || 0}/{usageLimit?.limit || 0}
                  </span>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  You've used {usageLimit?.currentUsage || 0} of {usageLimit?.limit || 0} notes this month
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Enhanced progress bar */}
                  <div className="w-full h-4 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-4 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                      style={{ width: `${((usageLimit?.currentUsage || 0) / (usageLimit?.limit || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {usageLimit?.canUse ? `${(usageLimit?.limit || 0) - (usageLimit?.currentUsage || 0)} notes remaining` : "Limit reached"}
                    </span>
                    <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                      {Math.round(((usageLimit?.currentUsage || 0) / (usageLimit?.limit || 1)) * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Study Analytics for Paid Users */
            <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-blue-500" />
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-800 tracking-wide">
                  <span>Study Progress</span>
                  <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                    {subscriptionStatus === 'student' ? 'Student' : 
                     subscriptionStatus === 'pro' ? 'Pro' : 'Student'}
                  </span>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Track your learning progress and study habits
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4">
                  {/* Study Streak */}
                  <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-600 mb-1">
                      {activityStats?.streak ?? 0}
                    </div>
                    <div className="text-xs text-emerald-700 font-medium">Day Streak</div>
                  </div>

                  {/* Notes This Week */}
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {notes?.filter(note => {
                        const noteDate = new Date(note.createdAt)
                        const weekAgo = new Date()
                        weekAgo.setDate(weekAgo.getDate() - 7)
                        return noteDate > weekAgo
                      }).length || 0}
                    </div>
                    <div className="text-xs text-blue-700 font-medium">Notes This Week</div>
                  </div>

                  {/* Subjects Covered */}
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <BookOpen className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {notes ? new Set(notes.map(note => note.subject)).size : 0}
                    </div>
                    <div className="text-xs text-purple-700 font-medium">Subjects</div>
                  </div>

                  {/* Study Goals */}
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Target className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="text-2xl font-bold text-orange-600 mb-1">
                      {activityStats ? `${activityStats.goalsMet}/${activityStats.goalsTotal}` : '0/0'}
                    </div>
                    <div className="text-xs text-orange-700 font-medium">Goals Met</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Upload */}
          <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-blue-500" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-800 tracking-wide">Quick Upload</CardTitle>
              <CardDescription className="text-gray-600">
                Upload a new note to get started with AI enhancement
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/enhance">
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12 text-base font-semibold rounded-lg"
                  size="lg"
                >
                  <Upload className="mr-3 h-5 w-5" />
                  Upload Note
                  <ArrowRight className="ml-3 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Notes */}
        <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-800 tracking-wide">Recent Notes</CardTitle>
            <CardDescription className="text-gray-600">
              Your recently uploaded and enhanced notes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentNotes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>
                <p className="text-gray-600 mb-4">
                  Upload your first note to see it here
                </p>
                <Link href="/enhance">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                    <Plus className="mr-2 h-4 w-4" />
                    Upload First Note
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentNotes.map((note) => (
                  <div key={note._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{note.title}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        className={
                          note.enhancementStatus === "completed" ? "bg-blue-100 text-blue-800 border-blue-200" :
                          note.enhancementStatus === "processing" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          note.enhancementStatus === "failed" ? "bg-red-100 text-red-800 border-red-200" : 
                          "bg-gray-100 text-gray-700 border-gray-200"
                        }
                      >
                        {note.enhancementStatus}
                      </Badge>
                      <Link href={`/enhance/${note._id}`}>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
