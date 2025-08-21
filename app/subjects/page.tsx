'use client'

import { useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserButton } from '@clerk/nextjs'
import { 
  Brain, 
  FolderOpen,
  FileText,
  Plus,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { generateSummary, generateQuiz, askQuestion, QuizQuestion } from "@/lib/ai-features"

export default function SubjectsPage() {
  const { user } = useUser()
  const toast = useToast()
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [subjectSummary, setSubjectSummary] = useState<{[key: string]: string}>({})
  const [subjectQuiz, setSubjectQuiz] = useState<{[key: string]: QuizQuestion[]}>({})
  const [showQuiz, setShowQuiz] = useState<string | null>(null)
  const [quizAnswers, setQuizAnswers] = useState<{[key: string]: number[]}>({})
  const [quizResults, setQuizResults] = useState<{[key: string]: { correct: number; total: number }}>({})
  const [userQuestion, setUserQuestion] = useState<{[key: string]: string}>({})
  const [answer, setAnswer] = useState<{[key: string]: string}>({})
  const [expandedSubjects, setExpandedSubjects] = useState<{[key: string]: boolean}>({})

  // Get all notes
  const notes = useQuery(api.notes.getNotesByUser)

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="text-gray-600">You need to be signed in to view your subjects.</p>
        </div>
      </div>
    )
  }

  if (!notes) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your subjects...</p>
        </div>
      </div>
    )
  }

  // Group notes by subject
  const subjects = notes.reduce((acc, note) => {
    if (!acc[note.subject]) {
      acc[note.subject] = []
    }
    acc[note.subject].push(note)
    return acc
  }, {} as { [key: string]: typeof notes })

  // Get subject stats
  const getSubjectStats = (subjectNotes: typeof notes) => {
    const total = subjectNotes.length
    const completed = subjectNotes.filter(note => note.enhancementStatus === 'completed').length
    const processing = subjectNotes.filter(note => note.enhancementStatus === 'processing').length
    const failed = subjectNotes.filter(note => note.enhancementStatus === 'failed').length
    const totalWords = subjectNotes.reduce((sum, note) => sum + (note.wordCount || 0), 0)
    
    return { total, completed, processing, failed, totalWords }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-orange-600" />
    }
  }

  // Handle subject summary generation
  const handleGenerateSubjectSummary = async (subject: string) => {
    const subjectNotes = subjects[subject]
    if (!subjectNotes || subjectNotes.length === 0) return

    setAiLoading(`summary-${subject}`)
    try {
      // Combine all note content
      const allContent = subjectNotes
        .filter(note => note.originalContent)
        .map(note => `=== ${note.title} ===\n${note.originalContent}`)
        .join('\n\n')

      if (allContent.length === 0) {
        toast.error("No content available for summary generation")
        return
      }

      const result = await generateSummary(allContent, subject)
      if (result.success && result.data) {
        setSubjectSummary(prev => ({ ...prev, [subject]: result.data.summary }))
        toast.success("Subject summary generated successfully!")
      } else {
        toast.error(result.error || "Failed to generate summary")
      }
    } catch (error) {
      console.error("Subject summary generation error:", error)
      toast.error("Failed to generate summary")
    } finally {
      setAiLoading(null)
    }
  }

  // Handle subject quiz generation
  const handleGenerateSubjectQuiz = async (subject: string) => {
    const subjectNotes = subjects[subject]
    if (!subjectNotes || subjectNotes.length === 0) return

    setAiLoading(`quiz-${subject}`)
    try {
      // Combine all note content
      const allContent = subjectNotes
        .filter(note => note.originalContent)
        .map(note => `=== ${note.title} ===\n${note.originalContent}`)
        .join('\n\n')

      if (allContent.length === 0) {
        toast.error("No content available for quiz generation")
        return
      }

      const result = await generateQuiz(allContent, subject, 8)
      if (result.success && result.data) {
        setSubjectQuiz(prev => ({ ...prev, [subject]: result.data.questions }))
        setQuizAnswers(prev => ({ ...prev, [subject]: new Array(result.data.questions.length).fill(-1) }))
        setQuizResults(prev => ({ ...prev, [subject]: null }))
        setShowQuiz(subject)
        toast.success("Subject quiz generated successfully!")
      } else {
        toast.error(result.error || "Failed to generate quiz")
      }
    } catch (error) {
      console.error("Subject quiz generation error:", error)
      toast.error("Failed to generate quiz")
    } finally {
      setAiLoading(null)
    }
  }

  // Handle quiz answer selection
  const handleQuizAnswer = (subject: string, questionIndex: number, answerIndex: number) => {
    const currentAnswers = quizAnswers[subject] || []
    const newAnswers = [...currentAnswers]
    newAnswers[questionIndex] = answerIndex
    setQuizAnswers(prev => ({ ...prev, [subject]: newAnswers }))
  }

  // Handle quiz submission
  const handleSubmitQuiz = (subject: string) => {
    const questions = subjectQuiz[subject] || []
    const answers = quizAnswers[subject] || []
    
    const correct = answers.reduce((count, answer, index) => {
      return count + (answer === questions[index].correctAnswer ? 1 : 0)
    }, 0)
    
    setQuizResults(prev => ({ ...prev, [subject]: { correct, total: questions.length } }))
  }

  // Handle subject Q&A
  const handleAskQuestion = async (subject: string) => {
    const subjectNotes = subjects[subject]
    if (!subjectNotes || subjectNotes.length === 0) return
    
    const question = userQuestion[subject]
    if (!question || !question.trim()) return

    setAiLoading(`qa-${subject}`)
    try {
      // Combine all note content
      const allContent = subjectNotes
        .filter(note => note.originalContent)
        .map(note => `=== ${note.title} ===\n${note.originalContent}`)
        .join('\n\n')

      if (allContent.length === 0) {
        toast.error("No content available for Q&A")
        return
      }

      const result = await askQuestion(allContent, subject, question)
      if (result.success && result.data) {
        setAnswer(prev => ({ ...prev, [subject]: result.data.answer }))
        toast.success("Answer generated!")
      } else {
        toast.error(result.error || "Failed to get answer")
      }
    } catch (error) {
      console.error("Q&A error:", error)
      toast.error("Failed to get answer")
    } finally {
      setAiLoading(null)
    }
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">My Subjects</h1>
            <p className="text-xl text-gray-600 font-medium">
              Organize and study all your notes by subject. Hover over any subject to expand and interact with your notes.
            </p>
          </div>

          {Object.keys(subjects).length === 0 ? (
            <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FolderOpen className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects yet</h3>
                  <p className="text-gray-600 mb-6">
                    Create your first note to start organizing by subject.
                  </p>
                  <Link href="/enhance">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Note
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(subjects).map(([subject, subjectNotes]) => {
                const stats = getSubjectStats(subjectNotes)
                const currentQuiz = subjectQuiz[subject] || []
                const currentAnswers = quizAnswers[subject] || []
                const currentResults = quizResults[subject]
                const isExpanded = expandedSubjects[subject]

                return (
                  <Card 
                    key={subject} 
                    className="shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white"
                  >
                    {/* Subject Header - Click to expand */}
                    <div 
                      className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedSubjects(prev => ({ ...prev, [subject]: !prev[subject] }))}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 tracking-wide">{subject}</h3>
                            <p className="text-sm text-gray-600 font-medium">
                              {stats.total} notes • {stats.totalWords} words • {stats.completed} enhanced
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                            {stats.total} notes
                          </Badge>
                          <ArrowRight 
                            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                              isExpanded ? 'rotate-90' : ''
                            }`} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <div 
                      className={`border-t border-gray-200 bg-gray-50 transition-all duration-300 ease-in-out ${
                        isExpanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                      }`}
                    >
                      <div className="p-6 space-y-6">
                        {/* AI Features Section */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-gray-800 tracking-wide flex items-center">
                            <Sparkles className="mr-2 h-5 w-5 text-blue-600" />
                            AI Features
                          </h4>
                          
                          <div className="flex flex-wrap gap-3">
                            <Button
                              onClick={() => handleGenerateSubjectSummary(subject)}
                              disabled={aiLoading === `summary-${subject}` || stats.total === 0}
                              variant="outline"
                              size="sm"
                              className="border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold"
                            >
                              {aiLoading === `summary-${subject}` ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                              ) : (
                                <BookOpen className="h-4 w-4 mr-2" />
                              )}
                              Generate Summary
                            </Button>
                            
                            <Button
                              onClick={() => handleGenerateSubjectQuiz(subject)}
                              disabled={aiLoading === `quiz-${subject}` || stats.total === 0}
                              variant="outline"
                              size="sm"
                              className="border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold"
                            >
                              {aiLoading === `quiz-${subject}` ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                              ) : (
                                <HelpCircle className="h-4 w-4 mr-2" />
                              )}
                              Generate Quiz
                            </Button>

                            <Button
                              onClick={() => setShowQuiz(subject === showQuiz ? null : subject)}
                              disabled={stats.total === 0}
                              variant="outline"
                              size="sm"
                              className="border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold"
                            >
                              <HelpCircle className="h-4 w-4 mr-2" />
                              Ask Questions
                            </Button>
                          </div>

                          {/* Summary Display */}
                          {subjectSummary[subject] && (
                            <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
                              <h5 className="font-semibold text-blue-900 mb-3">Subject Summary:</h5>
                              <div className="prose prose-sm max-w-none text-blue-800">
                                <div className="whitespace-pre-wrap">{subjectSummary[subject]}</div>
                              </div>
                            </div>
                          )}

                          {/* Quiz Display */}
                          {showQuiz === subject && currentQuiz.length > 0 && (
                            <div className="space-y-4 max-h-none overflow-visible">
                              <h5 className="font-semibold text-gray-800">Subject Quiz:</h5>
                              {currentQuiz.map((question, index) => (
                                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                  <h6 className="font-medium mb-3">Question {index + 1}: {question.question}</h6>
                                  <div className="space-y-2">
                                    {question.options.map((option, optionIndex) => (
                                      <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`subject-${subject}-question-${index}`}
                                          checked={currentAnswers[index] === optionIndex}
                                          onChange={() => handleQuizAnswer(subject, index, optionIndex)}
                                          className="text-blue-600 border-gray-300 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">{option}</span>
                                      </label>
                                    ))}
                                  </div>
                                  {currentResults && (
                                    <div className={`mt-3 p-3 rounded-lg text-sm ${
                                      currentAnswers[index] === question.correctAnswer 
                                        ? 'bg-green-100 text-green-800 border border-green-200' 
                                        : 'bg-red-100 text-red-800 border border-red-200'
                                    }`}>
                                      <strong>Explanation:</strong> {question.explanation}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {!currentResults && (
                                <Button 
                                  onClick={() => handleSubmitQuiz(subject)} 
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                                >
                                  Submit Quiz
                                </Button>
                              )}
                              {currentResults && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                  <h5 className="font-semibold text-blue-900 mb-2">Quiz Results</h5>
                                  <p className="text-blue-800 font-medium">
                                    You got {currentResults.correct} out of {currentResults.total} questions correct!
                                  </p>
                                  <p className="text-sm text-blue-600 mt-1 font-medium">
                                    Score: {Math.round((currentResults.correct / currentResults.total) * 100)}%
                                  </p>
                                  <Button 
                                    onClick={() => setShowQuiz(null)}
                                    variant="outline"
                                    size="sm"
                                    className="mt-3 border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold"
                                  >
                                    Collapse Quiz
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Q&A Section */}
                          {showQuiz === subject && (
                            <div className="space-y-4">
                              <h5 className="font-semibold text-gray-800 flex items-center">
                                <HelpCircle className="mr-2 h-4 w-4 text-blue-600" />
                                Ask Questions About This Subject
                              </h5>
                              <div className="flex space-x-3">
                                <input
                                  type="text"
                                  value={userQuestion[subject] || ''}
                                  onChange={(e) => setUserQuestion(prev => ({ ...prev, [subject]: e.target.value }))}
                                  placeholder="Ask a question about this subject..."
                                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion(subject)}
                                />
                                <Button
                                  onClick={() => handleAskQuestion(subject)}
                                  disabled={aiLoading === `qa-${subject}` || !userQuestion[subject]?.trim()}
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg"
                                >
                                  {aiLoading === `qa-${subject}` ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  ) : (
                                    'Ask'
                                  )}
                                </Button>
                              </div>
                              {answer[subject] && (
                                <div className="bg-white border border-green-200 rounded-lg p-4 shadow-sm">
                                  <h5 className="font-semibold text-green-900 mb-3">Answer:</h5>
                                  <div className="prose prose-sm max-w-none text-green-800">
                                    <div className="whitespace-pre-wrap">{answer[subject]}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Notes Section */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold text-gray-800 tracking-wide flex items-center">
                              <FileText className="mr-2 h-5 w-5 text-blue-600" />
                              Notes ({subjectNotes.length})
                            </h4>
                            <Link href={`/subjects/${encodeURIComponent(subject)}`}>
                              <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold">
                                View All Notes
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                          
                          <div className="space-y-3">
                            {subjectNotes.slice(0, 5).map((note) => (
                              <Link 
                                key={note._id} 
                                href={`/enhance/${note._id}`}
                                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                              >
                                <div className="flex items-center space-x-4">
                                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">{note.title}</div>
                                    <div className="text-sm text-gray-500 font-medium">
                                      {new Date(note.createdAt).toLocaleDateString()} • {note.wordCount || 0} words
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  {getStatusIcon(note.enhancementStatus)}
                                  <ArrowRight className="h-4 w-4 text-gray-400" />
                                </div>
                              </Link>
                            ))}
                            {subjectNotes.length > 5 && (
                              <Link href={`/subjects/${encodeURIComponent(subject)}`}>
                                <Button variant="ghost" size="sm" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold">
                                  View all {subjectNotes.length} notes
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
