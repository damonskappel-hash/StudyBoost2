'use client'

import { useState } from 'react'
import { useUser, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { UserButton } from '@clerk/nextjs'
import { 
  Brain, 
  Upload, 
  FileText, 
  Settings,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Mic
} from "lucide-react"
import Link from "next/link"
import { useNotes } from "@/hooks/use-notes"
import { useSubscription } from "@/hooks/use-subscription"
import { useMutation, useAction } from "convex/react"
import { api } from "../../convex/_generated/api"
import { SUBJECT_OPTIONS, EnhancementSettings } from "@/lib/types"
import { validateFile, extractTextFromFile } from "@/lib/openai"
import { AppLayout } from "@/components/app-layout"
import { useToast } from "@/hooks/use-toast"

export default function EnhancePage() {
  const { user } = useUser()
  const { has } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const { createNewNote, updateStatus, enhanceNote } = useNotes()
  const { incrementUserUsageCount } = useSubscription()
  const createFlashcards = useMutation(api.flashcards.createFlashcards)
  const generateFlashcardsAction = useAction(api.actions.generateFlashcardsAction)
  const logActivity = useMutation(api.activity.logActivity)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [subject, setSubject] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isFileProcessing, setIsFileProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [enhancementSettings, setEnhancementSettings] = useState<EnhancementSettings>({
    includeDefinitions: true,
    generateQuestions: false,
    createSummary: false,
    addExamples: false,
    structureLevel: "basic",
    autoGenerateFlashcards: false
  })

  // Check content length (using GPT-3.5-turbo limits by default)
  const estimatedTokens = Math.ceil(content.length / 4)
  const isContentTooLong = estimatedTokens > 12000 // GPT-3.5-turbo limit

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    console.log('File selected:', {
      name: selectedFile.name,
      type: selectedFile.type,
      size: selectedFile.size,
      lastModified: new Date(selectedFile.lastModified).toISOString()
    })

    // Check file size limits based on subscription
    const hasStudentPlan = has?.({ plan: 'student' })
    const hasProPlan = has?.({ plan: 'pro' })
    
    const maxFileSize = hasProPlan ? 100 * 1024 * 1024 : // 100MB for Pro
                       hasStudentPlan ? 50 * 1024 * 1024 : // 50MB for Student
                       10 * 1024 * 1024 // 10MB for Free
    
    if (selectedFile.size > maxFileSize) {
      const maxSizeMB = maxFileSize / (1024 * 1024)
      toast.error(`File size exceeds limit. Maximum size: ${maxSizeMB}MB. Upgrade for larger file support!`)
      return
    }

    const validation = validateFile(selectedFile)
    if (!validation.valid) {
      toast.error(validation.error || "Invalid file")
      return
    }

    setIsFileProcessing(true)
    setFile(selectedFile)
    setTitle(selectedFile.name.replace(/\.[^/.]+$/, "")) // Remove file extension

    try {
      console.log('Starting file text extraction...')
      const extractedText = await extractTextFromFile(selectedFile)
      console.log('Text extraction completed, length:', extractedText.length)
      setContent(extractedText)
      toast.success("File processed successfully!")
    } catch (error: any) {
      console.error('File upload error details:', {
        error: error.message,
        stack: error.stack,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size
      })
      
      // Provide more specific error messages
      let errorMessage = error.message || "Failed to extract text from file"
      
      if (error.message?.includes('DOCX')) {
        errorMessage = "Failed to process DOCX file. This might be due to file corruption or format issues. Please try opening and resaving the file in Microsoft Word or Google Docs."
      } else if (error.message?.includes('500')) {
        errorMessage = "Server error occurred while processing the file. Please try again or contact support if the issue persists."
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage = "Network error occurred. Please check your internet connection and try again."
      }
      
      toast.error(errorMessage)
      setFile(null)
    } finally {
      setIsFileProcessing(false)
    }
  }

  const handleEnhance = async () => {
    if (!user) {
      toast.error("Please sign in to enhance notes")
      return
    }

    if (!title.trim() || !content.trim() || !subject) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsProcessing(true)
    setProgress(10)

    try {
      // Create note in database
      const noteId = await createNewNote(
        title,
        content,
        subject,
        enhancementSettings,
        undefined, // fileId
        file?.name,
        file?.type
      )

      setProgress(30)

      // Update status to processing
      await updateStatus(noteId, "processing")
      setProgress(50)

      // Call the API to enhance the note
      const response = await fetch('/api/enhance-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noteId,
          originalContent: content,
          subject,
          enhancementSettings,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to enhance note')
      }

      const enhancementRes = await response.json()

      if (!enhancementRes.success) {
        throw new Error(enhancementRes.error || 'Enhancement failed')
      }

      setProgress(80)

      // Update note with enhanced content
      await enhanceNote(noteId, enhancementRes.enhancedContent, enhancementRes.processingTime)
      setProgress(85)

      // Automatically generate flashcards if enabled
      if (enhancementSettings.autoGenerateFlashcards && (has?.({ plan: 'student' }) || has?.({ plan: 'pro' }))) {
        try {
          // Generate flashcards using the action
          const flashResult = await generateFlashcardsAction({
            content: enhancementRes.enhancedContent,
            subject: subject,
            numCards: 10 // Generate 10 flashcards automatically
          })

          if (flashResult.success && flashResult.data?.flashcards) {
            // Create flashcards in the database
            await createFlashcards({
              noteId: noteId,
              subject: subject,
              flashcards: flashResult.data.flashcards
            })
            toast.success('Generated flashcards automatically!')
          }
        } catch (flashcardError) {
          console.error("Flashcard generation error:", flashcardError)
          // Don't fail the entire process if flashcard generation fails
        }
      }

      setProgress(90)

      // Increment user usage
      await incrementUserUsageCount(user.id)
      // Log activity: enhance
      await logActivity({ kind: 'enhance', count: 1 })
      setProgress(100)

      toast.success("Note enhanced successfully!")
      
      // Redirect to the enhanced note
      router.push(`/enhance/${noteId}`)
    } catch (error) {
      console.error("Enhancement error:", error)
      toast.error("Failed to enhance note")
      setIsProcessing(false)
      setProgress(0)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4 text-foreground">Please sign in</h1>
          <p className="text-muted-foreground">You need to be signed in to enhance notes.</p>
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-foreground mb-2 tracking-tight">
              Enhance Your Notes
            </h1>
            <p className="text-base text-muted-foreground">
              Upload your lecture notes and let AI transform them into organized study materials
            </p>
          </div>

          {/* Processing Progress */}
          {isProcessing && (
            <Card className="mb-8 border border-border bg-card shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-base font-medium text-foreground">
                  <Brain className="mr-2 h-4 w-4 text-primary" />
                  Enhancing Your Note
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Our AI is analyzing and improving your content...
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-4">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {progress < 30 && "Creating note..."}
                  {progress >= 30 && progress < 50 && "Processing content..."}
                  {progress >= 50 && progress < 70 && "Applying AI enhancements..."}
                  {progress >= 70 && progress < 85 && "Finalizing..."}
                  {progress >= 85 && progress < 90 && enhancementSettings.autoGenerateFlashcards && "Generating flashcards..."}
                  {progress >= 85 && progress < 90 && !enhancementSettings.autoGenerateFlashcards && "Completing..."}
                  {progress >= 90 && progress < 100 && "Completing..."}
                  {progress === 100 && "Complete! Redirecting..."}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* File Upload */}
              <Card className="border border-border bg-card shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-base font-medium text-foreground">
                    <Upload className="mr-2 h-4 w-4 text-primary" />
                    Upload Note
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Upload a file or paste your notes directly
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors bg-muted/30">
                    {file?.type.startsWith('audio/') ? (
                      <Mic className="h-12 w-12 text-primary mx-auto mb-4" />
                    ) : (
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    )}
                    <p className="text-muted-foreground mb-4">
                      Drag and drop your file here, or click to browse
                    </p>
                    <Input
                      type="file"
                      accept=".txt,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp,.mp3,.wav,.m4a,.aac,.ogg,.webm"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      disabled={isFileProcessing}
                    />
                    <label htmlFor="file-upload">
                      <Button variant="outline" asChild disabled={isFileProcessing} className="h-9">
                        <span>{isFileProcessing ? "Processing..." : "Choose File"}</span>
                      </Button>
                    </label>
                    <p className="text-xs text-muted-foreground mt-2">
                      Supporting: TXT, DOCX, Images, Audio - max {has?.({ plan: 'pro' }) ? '100MB' : has?.({ plan: 'student' }) ? '50MB' : '10MB'}
                    </p>
                    
                    {isFileProcessing && (
                      <div className="flex items-center space-x-2 p-4 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                        <span className="text-sm font-medium text-primary">
                          {file?.type.startsWith('image/')
                            ? 'Extracting text from image (this may take a moment)...'
                            : file?.type.startsWith('audio/')
                            ? 'Transcribing audio (this may take 2-10 minutes)...'
                            : 'Processing file...'
                          }
                        </span>
                      </div>
                    )}
                    
                    {file && !isFileProcessing && (
                      <div className="flex items-center space-x-2 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm font-medium text-green-500">
                          {file.name}
                          {file.type.startsWith('audio/') && ' (Transcribed successfully)'}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Note Details */}
              <Card className="border border-border bg-card shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-medium text-foreground">Note Details</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Provide information about your note
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-0">
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-3">
                      Title *
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter note title"
                      className="border-border focus:border-primary focus:ring-primary rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-3">
                      Subject *
                    </label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger className="border-border focus:border-primary focus:ring-primary rounded-lg">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <span className="mr-2">{option.icon}</span>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-3">
                      Content *
                    </label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Paste your notes here or upload a file above..."
                      rows={10}
                      className="border-border focus:border-primary focus:ring-primary rounded-lg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 You can also paste text manually or upload files above
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhancement Settings */}
            <div className="space-y-6">
              <Card className="border border-border bg-card shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-base font-medium text-foreground">
                    <Settings className="mr-2 h-4 w-4 text-primary" />
                    Enhancement Settings
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Choose how you want your notes enhanced
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-0">
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={enhancementSettings.includeDefinitions}
                        onChange={(e) => setEnhancementSettings(prev => ({
                          ...prev,
                          includeDefinitions: e.target.checked
                        }))}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-muted-foreground">Include definitions</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={enhancementSettings.generateQuestions}
                        onChange={(e) => setEnhancementSettings(prev => ({
                          ...prev,
                          generateQuestions: e.target.checked
                        }))}
                        disabled={!has?.({ plan: 'student' }) && !has?.({ plan: 'pro' })}
                        className="rounded border-border text-primary focus:ring-primary disabled:opacity-50"
                      />
                      <span className={`text-sm font-medium ${(!has?.({ plan: 'student' }) && !has?.({ plan: 'pro' })) ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                        Generate study questions
                        {(!has?.({ plan: 'student' }) && !has?.({ plan: 'pro' })) && <span className="text-xs text-primary ml-2">(Student/Pro only)</span>}
                      </span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={enhancementSettings.createSummary}
                        onChange={(e) => setEnhancementSettings(prev => ({
                          ...prev,
                          createSummary: e.target.checked
                        }))}
                        disabled={!has?.({ plan: 'student' }) && !has?.({ plan: 'pro' })}
                        className="rounded border-border text-primary focus:ring-primary disabled:opacity-50"
                      />
                      <span className={`text-sm font-medium ${(!has?.({ plan: 'student' }) && !has?.({ plan: 'pro' })) ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                        Create summaries
                        {(!has?.({ plan: 'student' }) && !has?.({ plan: 'pro' })) && <span className="text-xs text-primary ml-2">(Student/Pro only)</span>}
                      </span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={enhancementSettings.addExamples}
                        onChange={(e) => setEnhancementSettings(prev => ({
                          ...prev,
                          addExamples: e.target.checked
                        }))}
                        disabled={!has?.({ plan: 'student' }) && !has?.({ plan: 'pro' })}
                        className="rounded border-border text-primary focus:ring-primary disabled:opacity-50"
                      />
                      <span className={`text-sm font-medium ${(!has?.({ plan: 'student' }) && !has?.({ plan: 'pro' })) ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                        Add examples
                        {(!has?.({ plan: 'student' }) && !has?.({ plan: 'pro' })) && <span className="text-xs text-primary ml-2">(Student/Pro only)</span>}
                      </span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={enhancementSettings.autoGenerateFlashcards}
                        onChange={(e) => setEnhancementSettings(prev => ({
                          ...prev,
                          autoGenerateFlashcards: e.target.checked
                        }))}
                        disabled={!has?.({ plan: 'student' }) && !has?.({ plan: 'pro' })}
                        className="rounded border-border text-primary focus:ring-primary disabled:opacity-50"
                      />
                      <span className={`text-sm font-medium ${(!has?.({ plan: 'student' }) && !has?.({ plan: 'pro' })) ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                        Auto-generate flashcards
                        {(!has?.({ plan: 'student' }) && !has?.({ plan: 'pro' })) && <span className="text-xs text-primary ml-2">(Student/Pro only)</span>}
                      </span>
                    </label>
                    {enhancementSettings.autoGenerateFlashcards && (
                      <p className="text-xs text-primary ml-6 font-medium">
                        💡 Creates 10 study flashcards automatically after enhancement
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-3">
                      Structure Level
                    </label>
                    <Select 
                      value={enhancementSettings.structureLevel} 
                      onValueChange={(value: "basic" | "detailed" | "comprehensive") => 
                        setEnhancementSettings(prev => ({ ...prev, structureLevel: value }))
                      }
                      disabled={!has?.({ plan: 'student' }) && !has?.({ plan: 'pro' })}
                    >
                      <SelectTrigger className={`border-border focus:border-primary focus:ring-primary rounded-lg ${(!has?.({ plan: 'student' }) && !has?.({ plan: 'pro' })) ? 'opacity-50' : ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                        <SelectItem value="comprehensive">Comprehensive</SelectItem>
                      </SelectContent>
                    </Select>
                    {(!has?.({ plan: 'student' }) && !has?.({ plan: 'pro' })) && (
                      <p className="text-xs text-primary mt-1">
                        💡 Upgrade to Student/Pro for advanced structure options
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Button */}
              <Card className="border border-border bg-card shadow-sm">
                <CardContent className="pt-6">
                  {isContentTooLong && (
                    <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-sm font-medium text-yellow-500">
                        ⚠️ Content is quite long ({estimatedTokens} estimated tokens). 
                        Consider breaking it into smaller sections for better results.
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleEnhance}
                    disabled={isProcessing || !title.trim() || !content.trim() || !subject}
                    className="w-full bg-gradient-to-r from-primary via-primary/80 to-indigo-700 hover:from-primary/80 hover:via-primary/90 hover:to-indigo-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 h-12 text-base"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Brain className="mr-3 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-3 h-5 w-5" />
                        Enhance Note
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
