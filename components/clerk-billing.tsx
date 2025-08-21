'use client'

import { useUser } from '@clerk/nextjs'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  CreditCard, 
  CheckCircle,
  Star,
  Zap,
  ArrowRight
} from "lucide-react"

export function ClerkBilling() {
  const { user } = useUser()

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white">
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
                <Star className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Free Plan</h3>
                <p className="text-sm text-gray-600 font-medium">5 notes per month • Basic AI features</p>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 rounded-full text-sm font-medium">
              Active
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Section */}
      <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white border-2 border-blue-200 relative">
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            Upgrade Available
          </Badge>
        </div>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-800 tracking-wide flex items-center">
            <Zap className="mr-2 h-5 w-5 text-blue-600" />
            Upgrade to Pro
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

          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            onClick={() => {
              // This will be replaced with Clerk's billing component
              window.open('/billing', '_blank')
            }}
          >
            Upgrade to Pro
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
