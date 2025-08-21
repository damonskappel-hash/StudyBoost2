import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload an audio file.' },
        { status: 400 }
      )
    }

    // Check file size (100MB limit for longer recordings)
    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Audio file is too large. Maximum size is 100MB. For longer recordings, consider splitting into smaller files.' },
        { status: 400 }
      )
    }

    // Estimate duration based on file size (rough approximation)
    const estimatedDurationMinutes = Math.ceil(file.size / (1024 * 1024 * 2)) // ~2MB per minute for WAV
    console.log(`Estimated duration: ~${estimatedDurationMinutes} minutes`)

    console.log('Processing audio file:', file.name, file.type, file.size)

    try {
      // Convert file to buffer for OpenAI
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Create a file object for OpenAI
      const openaiFile = new File([buffer], file.name, { type: file.type })

      console.log('Starting transcription with OpenAI Whisper...')

      // Transcribe audio using OpenAI Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: openaiFile,
        model: 'whisper-1',
        response_format: 'text',
        language: 'en', // You can make this configurable
        temperature: 0.2, // Lower temperature for more accurate transcription
      })

      console.log('Transcription completed successfully')

      const transcribedText = transcription as string

      if (!transcribedText || !transcribedText.trim()) {
        return NextResponse.json(
          { success: false, error: 'No speech was detected in the audio file.' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        text: transcribedText,
        fileName: file.name,
        estimatedDuration: `${estimatedDurationMinutes} minutes`,
        wordCount: transcribedText.split(' ').length,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      })

    } catch (openaiError: any) {
      console.error('OpenAI transcription error:', openaiError)
      
      if (openaiError.message?.includes('rate limit')) {
        return NextResponse.json(
          { success: false, error: 'Rate limit exceeded. Please try again in a moment.' },
          { status: 429 }
        )
      }

      if (openaiError.message?.includes('file')) {
        return NextResponse.json(
          { success: false, error: 'Invalid audio file format. Please try MP3, WAV, or M4A.' },
          { status: 400 }
        )
      }

      if (openaiError.message?.includes('too large') || openaiError.message?.includes('size')) {
        return NextResponse.json(
          { success: false, error: 'Audio file is too large for transcription. Please try a shorter recording or split into smaller files.' },
          { status: 400 }
        )
      }

      if (openaiError.message?.includes('timeout') || openaiError.message?.includes('timed out')) {
        return NextResponse.json(
          { success: false, error: 'Transcription timed out. Please try a shorter recording or check your internet connection.' },
          { status: 408 }
        )
      }

      return NextResponse.json(
        { success: false, error: 'Failed to transcribe audio. Please check the file and try again.' },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Audio transcription error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process audio file' },
      { status: 500 }
    )
  }
}
