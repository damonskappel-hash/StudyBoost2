'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SignInButton, UserButton } from '@clerk/nextjs'
import { Authenticated, Unauthenticated } from 'convex/react'
import { ArrowRight, Brain, FileText, Sparkles, Zap, BookOpen, Users, Star } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <>
      <Authenticated>
        <UserButton />
        <DashboardRedirect />
      </Authenticated>
      <Unauthenticated>
        <LandingPage />
      </Unauthenticated>
    </>
  )
}

function DashboardRedirect() {
  // Redirect to dashboard immediately
  if (typeof window !== 'undefined') {
    window.location.href = '/dashboard'
  }
  
  // Fallback loading state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 tracking-tight">StudyBoost</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/pricing">
              <Button variant="ghost" className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium">Pricing</Button>
            </Link>
            <SignInButton>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">Get Started</Button>
            </SignInButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24 text-center">
        <Badge variant="secondary" className="mb-6 bg-blue-100 text-blue-800 border-blue-200 px-4 py-2 rounded-full font-medium">
          <Sparkles className="mr-2 h-4 w-4" />
          AI-Powered Note Enhancement
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 tracking-tight">
          Transform Messy Notes Into
          <span className="text-blue-600 block">Organized Study Materials</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto font-medium leading-relaxed">
          Upload your lecture notes and let AI enhance them with definitions, 
          study questions, summaries, and examples. Perfect for students who want 
          to study smarter, not harder.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <SignInButton>
            <Button size="lg" className="text-lg px-10 py-6 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
              Try Free - No Credit Card
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </SignInButton>
          <Button variant="outline" size="lg" className="text-lg px-10 py-6 border-gray-300 text-gray-700 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 font-semibold rounded-lg transition-all duration-200">
            Watch Demo
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-gray-900 mb-6 tracking-tight">
            Everything You Need to Study Better
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Our AI understands your notes and enhances them with educational features 
            that actually help you learn and retain information.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-800 tracking-wide">AI Enhancement</CardTitle>
              <CardDescription className="text-gray-600">
                Intelligent analysis and improvement of your notes with context-aware suggestions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-800 tracking-wide">Smart Organization</CardTitle>
              <CardDescription className="text-gray-600">
                Automatic structuring with clear headings, bullet points, and logical flow
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-800 tracking-wide">Study Questions</CardTitle>
              <CardDescription className="text-gray-600">
                Generate practice questions to test your understanding and retention
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-800 tracking-wide">Definitions & Examples</CardTitle>
              <CardDescription className="text-gray-600">
                Clear explanations of technical terms with relevant examples and analogies
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-800 tracking-wide">Multiple Formats</CardTitle>
              <CardDescription className="text-gray-600">
                Support for text files, PDFs, images, and Word documents
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-800 tracking-wide">Export Options</CardTitle>
              <CardDescription className="text-gray-600">
                Download enhanced notes as PDF, Word, or Markdown files
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-white py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-6 tracking-tight">
              Loved by Students Worldwide
            </h2>
            <p className="text-xl text-gray-600 font-medium">
              Join thousands of students who have improved their study habits
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 font-medium leading-relaxed">
                  "StudyBoost transformed my messy lecture notes into comprehensive study guides. 
                  The AI-generated questions helped me ace my finals!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-semibold">S</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Sarah M.</p>
                    <p className="text-sm text-gray-500">Computer Science Student</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 font-medium leading-relaxed">
                  "The definitions and examples feature is incredible. It makes complex 
                  concepts so much easier to understand and remember."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-semibold">M</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Mike R.</p>
                    <p className="text-sm text-gray-500">Medical Student</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 font-medium leading-relaxed">
                  "I love how it organizes my notes with clear sections and bullet points. 
                  It saves me hours of manual formatting!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-semibold">E</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Emma L.</p>
                    <p className="text-sm text-gray-500">Business Student</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 py-24">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6 tracking-tight">
            Ready to Transform Your Study Habits?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
            Join thousands of students who are already studying smarter with StudyBoost. 
            Start with 5 free notes today.
          </p>
          <SignInButton>
            <Button size="lg" className="text-lg px-10 py-6 bg-white text-blue-600 hover:bg-gray-50 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
              Start Enhancing Your Notes
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </SignInButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <Brain className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-bold tracking-tight">StudyBoost</span>
            </div>
            <div className="flex space-x-8 text-sm text-gray-400">
              <Link href="/pricing" className="hover:text-white font-medium transition-colors">Pricing</Link>
              <Link href="#" className="hover:text-white font-medium transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white font-medium transition-colors">Terms</Link>
              <Link href="#" className="hover:text-white font-medium transition-colors">Support</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 StudyBoost. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}