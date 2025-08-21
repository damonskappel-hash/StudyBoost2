'use client'

import { useUser, useAuth } from '@clerk/nextjs'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { UserButton } from '@clerk/nextjs'
import { 
  Brain, 
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  BarChart3,
  Plus,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Zap,
  Target,
  TrendingUp,
  Play,
  Info
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import ReactMarkdown from "react-markdown"
import { AppLayout } from "@/components/app-layout"

export default function FlashcardsPage() {
  const { user } = useUser()
  const { has } = useAuth()
  const toast = useToast()
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)

  const [reviewMode, setReviewMode] = useState<'review' | 'results'>('review')
  const [userAnswers, setUserAnswers] = useState<Record<string, boolean>>({})
  const [sessionCards, setSessionCards] = useState<any[]>([])

  // Get flashcard data - only query when user is authenticated
  const dueFlashcards = useQuery(api.flashcards.getDueFlashcards, 
    user?.id ? {
      subject: selectedSubject || undefined
    } : "skip"
  )
  const allFlashcards = useQuery(api.flashcards.getAllFlashcards, 
    user?.id ? {
      subject: selectedSubject || undefined
    } : "skip"
  )
  const flashcardStats = useQuery(api.flashcards.getFlashcardStats, 
    user?.id ? {} : "skip"
  )
  const notes = useQuery(api.notes.getNotesByUser, 
    user?.id ? {} : "skip"
  )

  // Mutations and Actions
  const reviewFlashcard = useMutation(api.flashcards.reviewFlashcard)
  const createFlashcards = useMutation(api.flashcards.createFlashcards)
  const deleteAllFlashcards = useMutation(api.flashcards.deleteAllFlashcards)
  const generateFlashcardsAction = useAction(api.actions.generateFlashcardsAction)
  const logActivity = useMutation(api.activity.logActivity)


  if (!user || !user.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="text-gray-600">You need to be signed in to access flashcards.</p>
        </div>
      </div>
    )
  }

  if (!dueFlashcards || !allFlashcards || !flashcardStats || !notes) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your flashcards...</p>
        </div>
      </div>
    )
  }

  const currentCard = reviewMode === 'review' ? sessionCards[currentCardIndex] : dueFlashcards[currentCardIndex]
  const hasCards = dueFlashcards.length > 0
  const hasSessionCards = sessionCards.length > 0

  // Get unique subjects from all notes (not just flashcards)
  const subjects = [...new Set(notes.map(note => note.subject).filter((subject): subject is string => Boolean(subject)))]

  // Get notes that don't have flashcards yet
  const notesWithoutFlashcards = notes.filter(note => {
    // Check if any flashcards exist for this note
    return !allFlashcards.some(flashcard => flashcard.noteId === note._id)
  })

  const handleReview = async (isCorrect: boolean) => {
    if (!currentCard) return

    // Track user's answer
    setUserAnswers(prev => ({
      ...prev,
      [currentCard._id]: isCorrect
    }))

    if (isCorrect) {
      // Move to next card if correct
      if (currentCardIndex < sessionCards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1)
        setShowAnswer(false)
        toast.success('Correct! Moving to next card.')
      } else {
        // End of session
        endReviewSession()
        toast.success('Review session complete!')
        // Log activity: review session completion counts as 1
        await logActivity({ kind: 'review', count: 1 })
      }
    } else {
      // If incorrect, keep the same card but hide answer for retry
      setShowAnswer(false)
      toast.error('Incorrect. Try again!')
    }
  }

  const handleGenerateFlashcards = async (noteId: any, subject: string) => {
    setIsGenerating(true)
    try {
      // First, get the note content
      const note = notes.find(n => n._id === noteId)
      if (!note) {
        throw new Error('Note not found')
      }

      // Generate flashcards using the action
      const result = await generateFlashcardsAction({
        content: note.enhancedContent || note.originalContent,
        subject: subject,
        numCards: 5
      })

      if (!result.success || !result.data?.flashcards) {
        throw new Error('Failed to generate flashcards')
      }

      // Create flashcards in the database
      await createFlashcards({
        noteId,
        subject,
        flashcards: result.data.flashcards
      })
      
      toast.success('Flashcards generated successfully!')
    } catch (error) {
      console.error('Flashcard generation error:', error)
      toast.error('Failed to generate flashcards')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDeleteAllFlashcards = async () => {
    if (confirm('Are you sure you want to delete ALL your flashcards? This action cannot be undone.')) {
      try {
        const result = await deleteAllFlashcards({})
        toast.success(`Deleted ${result.deletedCount} flashcards successfully!`)
      } catch (error) {
        console.error('Delete flashcards error:', error)
        toast.error('Failed to delete flashcards')
      }
    }
  }

  const startReviewSession = (useAllCards = false) => {
    const cardsToReview = useAllCards ? allFlashcards : dueFlashcards
    setSessionCards([...cardsToReview])
    setCurrentCardIndex(0)
    setUserAnswers({})
    setReviewMode('review')
    setShowAnswer(false)
  }

  const endReviewSession = () => {
    setReviewMode('results')
  }

  const saveReviewResults = async () => {
    try {
      // Save all the review results
      for (const [cardId, isCorrect] of Object.entries(userAnswers)) {
        await reviewFlashcard({
          flashcardId: cardId as any,
          isCorrect
        })
      }
      toast.success('Review results saved!')
      
      // Reset for next session
      setReviewMode('review')
      setUserAnswers({})
      setSessionCards([])
      setCurrentCardIndex(0)
    } catch (error) {
      console.error('Error saving review results:', error)
      toast.error('Failed to save results')
    }
  }

  const getNextReviewText = (timestamp: number) => {
    const now = Date.now()
    const diff = timestamp - now
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    
    if (days <= 0) return 'Due now'
    if (days === 1) return 'Due tomorrow'
    if (days < 7) return `Due in ${days} days`
    if (days < 30) return `Due in ${Math.ceil(days / 7)} weeks`
    return `Due in ${Math.ceil(days / 30)} months`
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Flashcards</h1>
                <p className="text-muted-foreground">
                  Review your flashcards with Quizlet-style learning. Get it wrong? You'll see it again until you get it right!
                </p>
              </div>
              {allFlashcards.length > 0 && (
                <Button
                  onClick={handleDeleteAllFlashcards}
                  variant="destructive"
                  size="sm"
                  className="ml-4"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Delete All Flashcards
                </Button>
              )}
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{flashcardStats.totalCards}</div>
                <p className="text-xs text-muted-foreground">
                  Across all subjects
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Due Today</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{flashcardStats.dueCards}</div>
                <p className="text-xs text-muted-foreground">
                  Ready for review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{flashcardStats.totalReviews}</div>
                <p className="text-xs text-muted-foreground">
                  All time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Streak</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{flashcardStats.avgConsecutiveCorrect}</div>
                <p className="text-xs text-muted-foreground">
                  Consecutive correct
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How It Works */}
          {hasCards && (
            <div className="mb-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-900 mb-1">How to Study</h3>
                      <p className="text-sm text-blue-800">
                        1. Choose "Review Due Cards" or "Review All Cards" • 2. Read the question and think of your answer • 
                        3. Click "Show Answer" to reveal the correct answer • 4. Click "Correct" or "Incorrect" • 
                        5. Complete all cards to see your results at the end!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Subject Filter */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Filter by Subject</CardTitle>
                <CardDescription>
                  Review flashcards from specific subjects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedSubject === '' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSubject('')}
                  >
                    All Subjects
                  </Button>
                  {subjects.map((subject) => (
                    <Button
                      key={subject}
                      variant={selectedSubject === subject ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedSubject(subject)}
                    >
                      {subject}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

                    {/* Flashcard Review */}
          {reviewMode === 'review' && hasSessionCards ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Review Interface */}
              <div className="lg:col-span-2">
                <Card className="min-h-[600px] shadow-md border-blue-200">
                  <CardHeader className="border-b border-blue-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                          <CardTitle className="text-lg font-semibold">Review Card {currentCardIndex + 1} of {sessionCards.length}</CardTitle>
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                          {currentCard?.subject}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium text-blue-600">
                        {Math.round(((currentCardIndex + 1) / sessionCards.length) * 100)}% Complete
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {currentCard ? (
                      <div className="space-y-8">
                        {/* Question Section */}
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <h3 className="text-lg font-semibold text-blue-900">Question</h3>
                          </div>
                                                      <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-sm">
                              <div className="prose prose-lg max-w-none text-blue-900">
                                <ReactMarkdown>{currentCard.question}</ReactMarkdown>
                              </div>
                            </div>
                        </div>

                        {/* Answer Section */}
                        {showAnswer && (
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <h3 className="text-lg font-semibold text-blue-900">Answer</h3>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 shadow-sm">
                              <div className="prose prose-lg max-w-none text-blue-900">
                                <ReactMarkdown>{currentCard.answer}</ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 pt-8">
                          {/* Show/Hide Answer Button */}
                          <Button
                            onClick={() => setShowAnswer(!showAnswer)}
                            variant="outline"
                            size="lg"
                            className="min-w-[140px] border-blue-300 bg-white hover:bg-blue-50 text-blue-700"
                          >
                            {showAnswer ? (
                              <>
                                <EyeOff className="mr-2 h-4 w-4" />
                                Hide Answer
                              </>
                            ) : (
                              <>
                                <Eye className="mr-2 h-4 w-4" />
                                Show Answer
                              </>
                            )}
                          </Button>

                          {/* Correct/Incorrect Buttons */}
                          {showAnswer && (
                            <div className="flex space-x-4">
                              <Button
                                onClick={() => handleReview(false)}
                                variant="destructive"
                                size="lg"
                                className="min-w-[120px] bg-red-500 hover:bg-red-600 border-red-500"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Incorrect
                              </Button>
                              <Button
                                onClick={() => handleReview(true)}
                                size="lg"
                                className="min-w-[120px] bg-green-500 hover:bg-green-600 border-green-500"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Correct
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64">
                        <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg">No cards available for review</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Card Info */}
              <div className="space-y-6">
                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <CardTitle className="text-base flex items-center">
                      <Info className="mr-2 h-4 w-4" />
                      Card Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Reviews</p>
                        <p className="text-2xl font-bold text-blue-900">{currentCard?.reviewCount || 0}</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Streak</p>
                        <p className="text-2xl font-bold text-green-900">{currentCard?.consecutiveCorrect || 0}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">Difficulty</span>
                        <Badge variant="outline" className="capitalize">
                          {currentCard?.difficulty || 'new'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">Next Review</span>
                        <span className="text-xs text-muted-foreground">
                          {getNextReviewText(currentCard?.nextReview || 0)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Progress */}
                <Card className="shadow-md">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                    <CardTitle className="text-base flex items-center">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Session Progress</span>
                        <span className="text-sm font-bold text-purple-600">
                          {currentCardIndex + 1} / {sessionCards.length}
                        </span>
                      </div>
                      <Progress 
                        value={((currentCardIndex + 1) / sessionCards.length) * 100} 
                        className="h-2"
                      />
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">
                          {Math.round(((currentCardIndex + 1) / sessionCards.length) * 100)}% Complete
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : reviewMode === 'results' ? (
            /* Results View */
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Review Results
                  </CardTitle>
                  <CardDescription>
                    Here are your answers and the correct answers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sessionCards.map((card, index) => {
                      const userAnswer = userAnswers[card._id]
                      return (
                        <div key={card._id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">Question {index + 1}</h4>
                            <Badge variant={userAnswer ? "default" : "destructive"}>
                              {userAnswer ? "Correct" : "Incorrect"}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Question:</p>
                            <p className="text-sm">{card.question}</p>
                            <p className="text-sm font-medium">Your Answer:</p>
                            <p className="text-sm">{userAnswer ? "Correct" : "Incorrect"}</p>
                            <p className="text-sm font-medium">Correct Answer:</p>
                            <p className="text-sm font-bold text-green-600">{card.answer}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-6 flex space-x-4">
                    <Button onClick={saveReviewResults} className="flex-1">
                      Save Results & Continue
                    </Button>
                    <Button onClick={() => startReviewSession(false)} variant="outline">
                      Review Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
                      ) : (
              /* Start Session or No Cards State */
              <div className="text-center py-12">
                {(hasCards || allFlashcards.length > 0) ? (
                  <div>
                    <BookOpen className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Review!</h3>
                    <p className="text-gray-600 mb-6">
                      {hasCards 
                        ? `You have ${dueFlashcards.length} flashcards due for review, and ${allFlashcards.length} total cards.`
                        : `You have ${allFlashcards.length} flashcards available for review.`
                      }
                      Choose your review mode and complete the session to see your results at the end.
                    </p>
                    <div className="space-y-3">
                      {hasCards && (
                        <Button onClick={() => startReviewSession(false)} size="lg" className="w-full">
                          <Play className="mr-2 h-4 w-4" />
                          Review Due Cards ({dueFlashcards.length})
                        </Button>
                      )}
                      <Button onClick={() => startReviewSession(true)} variant={hasCards ? "outline" : "default"} size="lg" className="w-full">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Review All Cards ({allFlashcards.length})
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {selectedSubject 
                        ? `No flashcards in ${selectedSubject}`
                        : "No flashcards due for review"
                      }
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {allFlashcards.length === 0 
                        ? selectedSubject
                          ? `You don't have any flashcards in ${selectedSubject} yet. Create some from your notes!`
                          : "Create your first flashcards from your notes to get started."
                        : selectedSubject
                          ? `You have ${allFlashcards.length} flashcards in ${selectedSubject}, but none are due for review.`
                          : "Great job! You're all caught up with your reviews."
                      }
                    </p>
                    
                    {notesWithoutFlashcards.length > 0 && (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-500">
                          {selectedSubject 
                            ? `Generate flashcards from your ${selectedSubject} notes:`
                            : "Generate flashcards from your notes:"
                          }
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {notesWithoutFlashcards
                            .filter(note => !selectedSubject || note.subject === selectedSubject)
                            .slice(0, 5)
                            .map((note) => (
                            <Button
                              key={note._id}
                              onClick={() => handleGenerateFlashcards(note._id, note.subject || 'General')}
                              disabled={isGenerating}
                              variant="outline"
                              size="sm"
                            >
                              {isGenerating ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                              ) : (
                                <Plus className="h-4 w-4 mr-2" />
                              )}
                              {note.title}
                            </Button>
                          ))}
                        </div>
                        {selectedSubject && notesWithoutFlashcards.filter(note => note.subject === selectedSubject).length === 0 && (
                          <p className="text-sm text-gray-500 text-center">
                            No {selectedSubject} notes found. Create some notes in this subject first!
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          {/* Generate More Flashcards Section */}
          {notesWithoutFlashcards.length > 0 ? (
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plus className="mr-2 h-5 w-5 text-green-600" />
                    Generate More Flashcards
                  </CardTitle>
                  <CardDescription>
                    Create additional flashcard sets from your notes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      {selectedSubject 
                        ? `Available ${selectedSubject} notes:`
                        : "Available notes:"
                      }
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {notesWithoutFlashcards
                        .filter(note => !selectedSubject || note.subject === selectedSubject)
                        .slice(0, 8)
                        .map((note) => (
                        <Button
                          key={note._id}
                          onClick={() => handleGenerateFlashcards(note._id, note.subject || 'General')}
                          disabled={isGenerating}
                          variant="outline"
                          size="sm"
                        >
                          {isGenerating ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          ) : (
                            <Plus className="h-4 w-4 mr-2" />
                          )}
                          {note.title}
                        </Button>
                      ))}
                    </div>
                    {selectedSubject && notesWithoutFlashcards.filter(note => note.subject === selectedSubject).length === 0 && (
                      <p className="text-sm text-gray-500 text-center">
                        No {selectedSubject} notes found. Create some notes in this subject first!
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : notes.length > 0 && (
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                    All Notes Have Flashcards
                  </CardTitle>
                  <CardDescription>
                    Great job! You've created flashcards for all your notes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 text-center">
                    All your notes already have flashcards generated. You can review them above or create new notes to generate more flashcards.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Subject Stats */}
          {Object.keys(flashcardStats.subjectStats).length > 0 && (
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Subject Performance</CardTitle>
                  <CardDescription>
                    Flashcard statistics by subject
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(flashcardStats.subjectStats).map(([subject, stats]) => (
                      <div key={subject} className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">{subject}</h4>
                        <div className="space-y-1 text-sm">
                          <p>Total: {stats.total} cards</p>
                          <p>Due: {stats.due} cards</p>
                          <p>Reviews: {stats.reviews}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
