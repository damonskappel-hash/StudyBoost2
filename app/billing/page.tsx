'use client'

'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  CreditCard, 
  CheckCircle,
  Star,
  Zap,
  ArrowRight,
  Settings,
  FileText,
  Calendar
} from "lucide-react"
import Link from "next/link"

export default function BillingManagementPage() {
  const { user } = useUser()
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Get user's subscription from Clerk
  useEffect(() => {
    if (user) {
      // Check user's subscription status from Clerk
      const checkSubscription = async () => {
        try {
          // Get subscription from user's public metadata
          const userSubscription = user.publicMetadata?.subscription || 'free'
          setSubscription(userSubscription)
        } catch (error) {
          console.error('Error fetching subscription:', error)
          setSubscription('free')
        } finally {
          setLoading(false)
        }
      }
      
      checkSubscription()
    }
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="text-gray-600">You need to be signed in to view billing.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading subscription...</span>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">Billing & Subscription</h1>
            <p className="text-xl text-gray-600 font-medium">
              Manage your subscription, payment methods, and billing history.
            </p>
          </div>

          {/* Current Plan Status */}
          <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-800 tracking-wide flex items-center">
                <CreditCard className="mr-2 h-5 w-5 text-blue-600" />
                Current Plan
              </CardTitle>
              <CardDescription className="text-gray-600">
                Your current subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    {subscription === 'free' ? (
                      <Star className="h-6 w-6 text-blue-600" />
                    ) : (
                      <Zap className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {subscription === 'free' ? 'Free Plan' : 
                       subscription === 'student' ? 'Student Plan' : 
                       subscription === 'pro' ? 'Pro Plan' : 'Free Plan'}
                    </h3>
                    <p className="text-sm text-gray-600 font-medium">
                      {subscription === 'free' ? '5 notes per month • Basic AI features' :
                       subscription === 'student' ? 'Unlimited notes • Advanced AI features' :
                       subscription === 'pro' ? 'Unlimited notes • All premium features' : '5 notes per month • Basic AI features'}
                    </p>
                  </div>
                </div>
                <Badge className={`px-3 py-1 rounded-full text-sm font-medium ${
                  subscription === 'free' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  subscription === 'student' ? 'bg-green-100 text-green-800 border-green-200' :
                  subscription === 'pro' ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-blue-100 text-blue-800 border-blue-200'
                }`}>
                  {subscription === 'free' ? 'Active' :
                   subscription === 'student' ? 'Student' :
                   subscription === 'pro' ? 'Pro' : 'Active'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Billing Management Options */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Payment Methods */}
            <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-800 tracking-wide flex items-center">
                  <CreditCard className="mr-2 h-5 w-5 text-blue-600" />
                  Payment Methods
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Manage your payment methods and billing information
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-4">
                  Update your payment methods and billing address for seamless subscription management.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold"
                  onClick={() => {
                    // Open Clerk's billing management page
                    window.open('/user/billing', '_blank')
                  }}
                >
                  Manage Payment Methods
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-800 tracking-wide flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-blue-600" />
                  Billing History
                </CardTitle>
                <CardDescription className="text-gray-600">
                  View your past invoices and payment history
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-4">
                  Access your billing history, download invoices, and track your payment history.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold"
                  onClick={() => {
                    // Open Clerk's billing history page
                    window.open('/user/billing', '_blank')
                  }}
                >
                  View Billing History
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Upgrade Section - Only show for free users */}
          {subscription === 'free' && (
            <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white border-2 border-blue-200 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                Upgrade Available
              </Badge>
            </div>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-800 tracking-wide flex items-center">
                <Zap className="mr-2 h-5 w-5 text-blue-600" />
                Upgrade Your Plan
              </CardTitle>
              <CardDescription className="text-gray-600">
                Unlock unlimited notes and advanced AI features
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mb-6">
                <div className="text-3xl font-bold text-gray-900">$9.99</div>
                <div className="text-sm text-gray-600">per month</div>
              </div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Unlimited notes</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Advanced AI features</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Subject summaries & quizzes</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Advanced flashcards</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Audio upload support</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Priority support</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Analytics dashboard</span>
                </li>
              </ul>

              <Link href="/pricing">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  View All Plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
          )}

          {/* Account Settings */}
          <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white mt-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-800 tracking-wide flex items-center">
                <Settings className="mr-2 h-5 w-5 text-blue-600" />
                Account Settings
              </CardTitle>
              <CardDescription className="text-gray-600">
                Manage your account preferences and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 mb-4">
                Update your account settings, manage your profile, and control your privacy preferences.
              </p>
              <Button 
                variant="outline" 
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold"
                onClick={() => {
                  // Open Clerk's user profile page
                  window.open('/user', '_blank')
                }}
              >
                Manage Account Settings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
