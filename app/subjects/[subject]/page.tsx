'use client'

import { useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserButton } from '@clerk/nextjs'
import { 
  Brain, 
  FileText,
  Plus,
  ArrowLeft,
  BookOpen,
  HelpCircle,
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  SortAsc,
  SortDesc
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import { generateSummary, generateQuiz, askQuestion, QuizQuestion } from "@/lib/ai-features"

export default function SubjectDetailPage() {
  const { user } = useUser()
  const params = useParams()
  const subject = decodeURIComponent(params.subject as string)
  const toast = useToast()
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [summary, setSummary] = useState<string>('')
  const [quiz, setQuiz] = useState<QuizQuestion[]>([])
  const [userQuestion, setUserQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<number[]>([])
  const [quizResults, setQuizResults] = useState<{ correct: number; total: number } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'processing' | 'failed'>('all')

  // Get all notes for this subject
  const allNotes = useQuery(api.notes.getNotesByUser)
  const subjectNotes = useMemo(() => {
    if (!allNotes) return []
    return allNotes.filter(note => note.subject === subject)
  }, [allNotes, subject])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="text-gray-600">You need to be signed in to view this subject.</p>
        </div>
      </div>
    )
  }

  // Filter and sort notes
  const filteredAndSortedNotes = useMemo(() => {
    if (!subjectNotes) return []
    
    let filtered = subjectNotes

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.originalContent.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(note => note.enhancementStatus === filterStatus)
    }

    // Sort notes
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'status':
          comparison = a.enhancementStatus.localeCompare(b.enhancementStatus)
          break
      }
      
      return sortOrder === 'asc' ? -comparison : comparison
    })

    return filtered
  }, [subjectNotes, searchTerm, filterStatus, sortBy, sortOrder])

  // Get subject stats
  const subjectStats = useMemo(() => {
    if (!subjectNotes) return { total: 0, completed: 0, processing: 0, failed: 0, totalWords: 0 }
    
    const total = subjectNotes.length
    const completed = subjectNotes.filter(note => note.enhancementStatus === 'completed').length
    const processing = subjectNotes.filter(note => note.enhancementStatus === 'processing').length
    const failed = subjectNotes.filter(note => note.enhancementStatus === 'failed').length
    const totalWords = subjectNotes.reduce((sum, note) => sum + (note.wordCount || 0), 0)
    
    return { total, completed, processing, failed, totalWords }
  }, [subjectNotes])

  if (!allNotes) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subject notes...</p>
        </div>
      </div>
    )
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
  const handleGenerateSummary = async () => {
    if (subjectNotes.length === 0) return
    
    setAiLoading('summary')
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
        setSummary(result.data.summary)
        toast.success("Subject summary generated successfully!")
      } else {
        toast.error(result.error || "Failed to generate summary")
      }
    } catch (error) {
      console.error("Summary generation error:", error)
      toast.error("Failed to generate summary")
    } finally {
      setAiLoading(null)
    }
  }

  // Handle subject quiz generation
  const handleGenerateQuiz = async () => {
    if (subjectNotes.length === 0) return
    
    setAiLoading('quiz')
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

      const result = await generateQuiz(allContent, subject, 10)
      if (result.success && result.data) {
        setQuiz(result.data.questions)
        setQuizAnswers(new Array(result.data.questions.length).fill(-1))
        setQuizResults(null)
        setShowQuiz(true)
        toast.success("Subject quiz generated successfully!")
      } else {
        toast.error(result.error || "Failed to generate quiz")
      }
    } catch (error) {
      console.error("Quiz generation error:", error)
      toast.error("Failed to generate quiz")
    } finally {
      setAiLoading(null)
    }
  }

  // Handle Q&A
  const handleAskQuestion = async () => {
    if (subjectNotes.length === 0 || !userQuestion.trim()) return
    
    setAiLoading('qa')
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

      const result = await askQuestion(allContent, subject, userQuestion)
      if (result.success && result.data) {
        setAnswer(result.data.answer)
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

  // Handle quiz answer selection
  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...quizAnswers]
    newAnswers[questionIndex] = answerIndex
    setQuizAnswers(newAnswers)
  }

  // Handle quiz submission
  const handleSubmitQuiz = () => {
    const correct = quizAnswers.reduce((count, answer, index) => {
      return count + (answer === quiz[index].correctAnswer ? 1 : 0)
    }, 0)
    
    setQuizResults({ correct, total: quiz.length })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">StudyBoost</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/subjects">
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Subjects
              </Button>
            </Link>
            <Link href="/enhance">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Note
              </Button>
            </Link>
            <UserButton />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Subject Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{subject}</h1>
                <p className="text-gray-600">
                  {subjectStats.total} notes • {subjectStats.totalWords} words • {subjectStats.completed} enhanced
                </p>
              </div>
              <Badge variant="outline" className="capitalize text-lg px-4 py-2">
                {subject}
              </Badge>
            </div>

            {/* Subject Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{subjectStats.total}</div>
                <div className="text-sm text-gray-600">Total Notes</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{subjectStats.completed}</div>
                <div className="text-sm text-gray-600">Enhanced</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{subjectStats.processing}</div>
                <div className="text-sm text-gray-600">Processing</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl font-bold text-red-600">{subjectStats.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>

            {/* AI Features */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="mr-2 h-5 w-5 text-purple-600" />
                  Subject AI Features
                </CardTitle>
                <CardDescription>
                  Generate summaries, quizzes, and ask questions about all notes in this subject
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex space-x-3">
                  <Button
                    onClick={handleGenerateSummary}
                    disabled={aiLoading === 'summary' || subjectStats.total === 0}
                    variant="outline"
                  >
                    {aiLoading === 'summary' ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    ) : (
                      <BookOpen className="h-4 w-4 mr-2" />
                    )}
                    Generate Summary
                  </Button>
                  
                  <Button
                    onClick={handleGenerateQuiz}
                    disabled={aiLoading === 'quiz' || subjectStats.total === 0}
                    variant="outline"
                  >
                    {aiLoading === 'quiz' ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    ) : (
                      <HelpCircle className="h-4 w-4 mr-2" />
                    )}
                    Generate Quiz
                  </Button>
                </div>

                {/* Summary Display */}
                {summary && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Subject Summary:</h4>
                    <div className="prose prose-sm max-w-none text-blue-800">
                      <div className="whitespace-pre-wrap">{summary}</div>
                    </div>
                  </div>
                )}

                {/* Quiz Display */}
                {showQuiz && quiz.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Subject Quiz:</h4>
                    {quiz.map((question, index) => (
                      <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium mb-3">Question {index + 1}: {question.question}</h5>
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <label key={optionIndex} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`question-${index}`}
                                checked={quizAnswers[index] === optionIndex}
                                onChange={() => handleQuizAnswer(index, optionIndex)}
                                className="text-blue-600"
                              />
                              <span className="text-sm">{option}</span>
                            </label>
                          ))}
                        </div>
                        {quizResults && (
                          <div className={`mt-3 p-2 rounded text-sm ${
                            quizAnswers[index] === question.correctAnswer 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            <strong>Explanation:</strong> {question.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                    {!quizResults && (
                      <Button onClick={handleSubmitQuiz} className="w-full">
                        Submit Quiz
                      </Button>
                    )}
                    {quizResults && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                        <h4 className="font-medium text-blue-900 mb-2">Quiz Results</h4>
                        <p className="text-blue-800">
                          You got {quizResults.correct} out of {quizResults.total} questions correct!
                        </p>
                        <p className="text-sm text-blue-600 mt-1">
                          Score: {Math.round((quizResults.correct / quizResults.total) * 100)}%
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Q&A */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Ask Questions About This Subject
                  </h4>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={userQuestion}
                      onChange={(e) => setUserQuestion(e.target.value)}
                      placeholder="Ask a question about this subject..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                    />
                    <Button
                      onClick={handleAskQuestion}
                      disabled={aiLoading === 'qa' || !userQuestion.trim()}
                      size="sm"
                    >
                      {aiLoading === 'qa' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        'Ask'
                      )}
                    </Button>
                  </div>
                  {answer && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2">Answer:</h4>
                      <div className="prose prose-sm max-w-none text-green-800">
                        <div className="whitespace-pre-wrap">{answer}</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Date</option>
                  <option value="title">Title</option>
                  <option value="status">Status</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Notes List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Notes ({filteredAndSortedNotes.length})</h2>
              <Link href="/enhance">
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Note
                </Button>
              </Link>
            </div>

            {filteredAndSortedNotes.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No notes found</h3>
                    <p className="text-gray-600">
                      {searchTerm || filterStatus !== 'all' 
                        ? 'Try adjusting your search or filters.' 
                        : 'Create your first note for this subject.'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredAndSortedNotes.map((note) => (
                  <Link key={note._id} href={`/enhance/${note._id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <FileText className="h-5 w-5 text-gray-500" />
                              <h3 className="font-medium text-lg">{note.title}</h3>
                              {getStatusIcon(note.enhancementStatus)}
                            </div>
                            <div className="text-sm text-gray-600 space-x-4">
                              <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
                              <span>Words: {note.wordCount || 0}</span>
                              <span className="capitalize">Status: {note.enhancementStatus}</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                              {note.originalContent.substring(0, 150)}...
                            </p>
                          </div>
                          <ArrowLeft className="h-5 w-5 text-gray-400 transform rotate-180" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
