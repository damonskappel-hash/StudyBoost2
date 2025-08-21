'use client'

import { useUser, useAuth } from '@clerk/nextjs'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserButton } from '@clerk/nextjs'
import { 
  Brain, 
  FileText, 
  Download, 
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
  Printer,
  FileDown,
  Sparkles,
  HelpCircle,
  BookOpen,
  Plus
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import ReactMarkdown from "react-markdown"
import { downloadAsPDF } from "@/lib/pdf-utils"
import { generateSummary, generateQuiz, askQuestion, QuizQuestion } from "@/lib/ai-features"

export default function EnhancedNotePage() {
  const { user } = useUser()
  const { has } = useAuth()
  const params = useParams()
  const noteId = params.noteId as string
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<'original' | 'enhanced' | 'split' | 'ai'>('split')
  const [aiLoading, setAiLoading] = useState(false)
  const [summary, setSummary] = useState<string>('')
  const [quiz, setQuiz] = useState<QuizQuestion[]>([])
  const [userQuestion, setUserQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<number[]>([])
  const [quizResults, setQuizResults] = useState<{ correct: number; total: number } | null>(null)

  // Get note data
  const note = useQuery(api.notes.getNoteById, { noteId })
  
  // Mutations and Actions
  const createFlashcards = useMutation(api.flashcards.createFlashcards)
  const generateFlashcardsAction = useAction(api.actions.generateFlashcardsAction)

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="text-gray-600">You need to be signed in to view notes.</p>
        </div>
      </div>
    )
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Note not found</h1>
          <p className="text-gray-600">The note you're looking for doesn't exist or you don't have access to it.</p>
          <Link href="/dashboard">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const getStatusIcon = () => {
    switch (note.enhancementStatus) {
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

  const getStatusColor = () => {
    switch (note.enhancementStatus) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-orange-100 text-orange-800'
    }
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Copied to clipboard!")
    } catch (error) {
      toast.error("Failed to copy")
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = async (content: string, filename: string, title?: string) => {
    // Check if user has access to downloads
    const hasStudentPlan = has?.({ plan: 'student' })
    const hasProPlan = has?.({ plan: 'pro' })
    
    if (!hasStudentPlan && !hasProPlan) {
      toast.error('Downloads are only available for Student and Pro plans. Upgrade to download your notes!')
      return
    }
    
    try {
      toast.info("Generating PDF...")
      await downloadAsPDF(content, filename, title)
      toast.success("PDF downloaded successfully!")
    } catch (error) {
      console.error("PDF download error:", error)
      toast.error("Failed to download PDF. Please try again.")
    }
  }

  const handleGenerateSummary = async () => {
    if (!note?.originalContent) return
    
    setAiLoading(true)
    try {
      const result = await generateSummary(note.originalContent, note.subject)
      if (result.success && result.data) {
        setSummary(result.data.summary)
        toast.success("Summary generated successfully!")
      } else {
        toast.error(result.error || "Failed to generate summary")
      }
    } catch (error) {
      console.error("Summary generation error:", error)
      toast.error("Failed to generate summary")
    } finally {
      setAiLoading(false)
    }
  }

  const handleGenerateQuiz = async () => {
    if (!note?.originalContent) return
    
    setAiLoading(true)
    try {
      const result = await generateQuiz(note.originalContent, note.subject, 5)
      if (result.success && result.data) {
        setQuiz(result.data.questions)
        setQuizAnswers(new Array(result.data.questions.length).fill(-1))
        setQuizResults(null)
        setShowQuiz(true)
        toast.success("Quiz generated successfully!")
      } else {
        toast.error(result.error || "Failed to generate quiz")
      }
    } catch (error) {
      console.error("Quiz generation error:", error)
      toast.error("Failed to generate quiz")
    } finally {
      setAiLoading(false)
    }
  }

  const handleAskQuestion = async () => {
    if (!note?.originalContent || !userQuestion.trim()) return
    
    setAiLoading(true)
    try {
      const result = await askQuestion(note.originalContent, note.subject, userQuestion)
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
      setAiLoading(false)
    }
  }

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...quizAnswers]
    newAnswers[questionIndex] = answerIndex
    setQuizAnswers(newAnswers)
  }

  const handleSubmitQuiz = () => {
    const correct = quizAnswers.reduce((count, answer, index) => {
      return count + (answer === quiz[index].correctAnswer ? 1 : 0)
    }, 0)
    
    setQuizResults({ correct, total: quiz.length })
  }

  const handleGenerateFlashcards = async () => {
    if (!note?.originalContent) return
    
    setAiLoading(true)
    try {
      // Generate flashcards using the action
      const result = await generateFlashcardsAction({
        content: note.enhancedContent || note.originalContent,
        subject: note.subject || 'General',
        numCards: 5
      })

      if (result.success && result.data?.flashcards) {
        // Create flashcards in the database
        await createFlashcards({
          noteId: note._id,
          subject: note.subject || 'General',
          flashcards: result.data.flashcards
        })
        toast.success("Flashcards generated successfully!")
      } else {
        throw new Error('Failed to generate flashcards')
      }
    } catch (error) {
      console.error("Flashcard generation error:", error)
      toast.error("Failed to generate flashcards")
    } finally {
      setAiLoading(false)
    }
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
            <Link href="/dashboard">
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <UserButton />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Note Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{note.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Subject: {note.subject}</span>
                  <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
                  {note.wordCount && <span>Words: {note.wordCount}</span>}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor()}>
                  {getStatusIcon()}
                  <span className="ml-1 capitalize">{note.enhancementStatus}</span>
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant={activeTab === 'original' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('original')}
              >
                Original
              </Button>
              <Button
                variant={activeTab === 'enhanced' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('enhanced')}
                disabled={note.enhancementStatus !== 'completed'}
              >
                Enhanced
              </Button>
              <Button
                variant={activeTab === 'split' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('split')}
                disabled={note.enhancementStatus !== 'completed'}
              >
                Split View
              </Button>
              <Button
                variant={activeTab === 'ai' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('ai')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                AI Features
              </Button>
            </div>
          </div>

          {/* Content */}
          {note.enhancementStatus === 'processing' && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Your Note</h3>
                  <p className="text-gray-600">
                    Our AI is enhancing your content. This may take a few minutes...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {note.enhancementStatus === 'failed' && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Enhancement Failed</h3>
                  <p className="text-gray-600 mb-4">
                    We encountered an error while processing your note. Please try again.
                  </p>
                  <Link href="/enhance">
                    <Button>Try Again</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content Display */}
          {note.enhancementStatus === 'completed' && (
            <div className="space-y-6">
              {activeTab === 'split' && (
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Original Content */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Original Content</span>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(note.originalContent)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(note.originalContent, `${note.title}_original`, `${note.title} - Original`)}
                            title="Download as PDF"
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                          {note.originalContent}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enhanced Content */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Enhanced Content</span>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(note.enhancedContent || '')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(note.enhancedContent || '', `${note.title}_enhanced`, `${note.title} - Enhanced`)}
                            title="Download as PDF"
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handlePrint}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none markdown-content">
                        <ReactMarkdown>
                          {note.enhancedContent || ''}
                        </ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'original' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Original Content</span>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(note.originalContent)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(note.originalContent, `${note.title}_original`, `${note.title} - Original`)}
                          title="Download as PDF"
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                        {note.originalContent}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'enhanced' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Enhanced Content</span>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(note.enhancedContent || '')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(note.enhancedContent || '', `${note.title}_enhanced`, `${note.title} - Enhanced`)}
                          title="Download as PDF"
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handlePrint}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none markdown-content">
                      <ReactMarkdown>
                        {note.enhancedContent || ''}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* AI Features */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="mr-2 h-5 w-5 text-purple-600" />
                    AI Study Assistant
                  </CardTitle>
                  <CardDescription>
                    Use AI to generate summaries, quizzes, and get answers about your notes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Summary Generation */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium flex items-center">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Smart Summary
                      </h3>
                      <Button
                        onClick={handleGenerateSummary}
                        disabled={aiLoading || !note.originalContent}
                        size="sm"
                      >
                        {aiLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        Generate Summary
                      </Button>
                    </div>
                    {summary && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">Summary:</h4>
                        <div className="prose prose-sm max-w-none text-blue-800">
                          <ReactMarkdown>{summary}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quiz Generation */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium flex items-center">
                        <HelpCircle className="mr-2 h-4 w-4" />
                        Interactive Quiz
                      </h3>
                      <Button
                        onClick={handleGenerateQuiz}
                        disabled={aiLoading || !note.originalContent}
                        size="sm"
                      >
                        {aiLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        Generate Quiz
                      </Button>
                    </div>
                    {showQuiz && quiz.length > 0 && (
                      <div className="space-y-4">
                        {quiz.map((question, index) => (
                          <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium mb-3">Question {index + 1}: {question.question}</h4>
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
                  </div>

                  {/* Q&A */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Ask Questions
                    </h3>
                    <div className="space-y-3">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={userQuestion}
                          onChange={(e) => setUserQuestion(e.target.value)}
                          placeholder="Ask a question about your notes..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                        />
                        <Button
                          onClick={handleAskQuestion}
                          disabled={aiLoading || !userQuestion.trim()}
                          size="sm"
                        >
                          {aiLoading ? (
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
                            <ReactMarkdown>{answer}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Flashcard Generation */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium flex items-center">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Generate Flashcards
                      </h3>
                      <Button
                        onClick={handleGenerateFlashcards}
                        disabled={aiLoading || !note.originalContent}
                        size="sm"
                      >
                        {aiLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Create Flashcards
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">
                      Generate AI-powered flashcards from this note for spaced repetition review.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Enhancement Settings Used */}
          {note.enhancementStatus === 'completed' && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Enhancement Settings Used</CardTitle>
                <CardDescription>
                  These settings were applied to enhance your note
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Structure Level:</span>
                      <Badge variant="outline" className="capitalize">
                        {note.enhancementSettings.structureLevel}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Include Definitions:</span>
                      <Badge variant={note.enhancementSettings.includeDefinitions ? "default" : "secondary"}>
                        {note.enhancementSettings.includeDefinitions ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Generate Questions:</span>
                      <Badge variant={note.enhancementSettings.generateQuestions ? "default" : "secondary"}>
                        {note.enhancementSettings.generateQuestions ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Add Examples:</span>
                      <Badge variant={note.enhancementSettings.addExamples ? "default" : "secondary"}>
                        {note.enhancementSettings.addExamples ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <style jsx global>{`
        .markdown-content {
          line-height: 1.6;
        }
        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 600;
        }
        .markdown-content h1 { font-size: 1.5em; }
        .markdown-content h2 { font-size: 1.3em; }
        .markdown-content h3 { font-size: 1.1em; }
        .markdown-content p {
          margin-bottom: 1em;
        }
        .markdown-content ul,
        .markdown-content ol {
          margin-bottom: 1em;
          padding-left: 1.5em;
        }
        .markdown-content li {
          margin-bottom: 0.25em;
        }
        .markdown-content strong {
          font-weight: 600;
        }
        .markdown-content em {
          font-style: italic;
        }
        .markdown-content blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
        }
        .markdown-content code {
          background-color: #f3f4f6;
          padding: 0.125em 0.25em;
          border-radius: 0.25em;
          font-family: monospace;
          font-size: 0.875em;
        }
        .markdown-content pre {
          background-color: #f3f4f6;
          padding: 1em;
          border-radius: 0.5em;
          overflow-x: auto;
          margin: 1em 0;
        }
        .markdown-content pre code {
          background-color: transparent;
          padding: 0;
        }
      `}</style>
    </div>
  )
}
