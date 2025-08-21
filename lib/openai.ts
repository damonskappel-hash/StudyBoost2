import { EnhancementSettings } from "./types";

// Note: OpenAI client should only be used on the server side
// This file contains utility functions that can be used on both client and server

export interface EnhancementResult {
  enhancedContent: string;
  processingTime: number;
  wordCount: number;
}

const enhancementPrompts = {
  structure: `Organize this content with clear headings, bullet points, and logical flow. 
  Make it easy to read and understand for students.`,
  
  definitions: `Identify technical terms, jargon, or complex concepts and provide clear, 
  student-friendly definitions for each. Format as: **Term**: Definition`,
  
  questions: `Generate 3-5 study questions from this content that would help students 
  test their understanding. Include both factual and conceptual questions.`,
  
  summary: `Create concise summaries of each major section. Highlight key takeaways 
  and main points that students should remember.`,
  
  examples: `Add relevant examples, analogies, or real-world applications for abstract 
  concepts mentioned in the content.`,
};

// This function should be called from the server side only
export async function enhanceNote(
  originalContent: string,
  subject: string,
  settings: EnhancementSettings
): Promise<EnhancementResult> {
  // This will be implemented in the API route
  throw new Error("enhanceNote should be called from server-side API route");
}

export async function extractTextFromFile(file: File): Promise<string> {
  // Handle images on the client side with OCR
  if (file.type.startsWith('image/')) {
    try {
      console.log('Processing image with client-side OCR...')
      const { extractTextFromImage } = await import('./ocr-utils')
      return await extractTextFromImage(file)
    } catch (error: any) {
      console.error('Client-side OCR error:', error)
      throw new Error(error.message || 'Failed to extract text from image. Please try again or copy text manually.')
    }
  }

  // Handle audio files on the server side
  if (file.type.startsWith('audio/')) {
    try {
      console.log('Processing audio file with server-side transcription...')
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/transcribe-audio', {
        method: 'POST',
        body: formData,
      })

      console.log('Transcription response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Transcription error response:', errorData)
        throw new Error(errorData.error || `Transcription error: ${response.status}`)
      }

      const result = await response.json()
      console.log('Transcription response:', result)

      if (!result.success) {
        throw new Error(result.error || 'Audio transcription failed')
      }

      if (!result.text || !result.text.trim()) {
        throw new Error('No text was transcribed from the audio. Please try a different file or check the audio quality.')
      }

      return result.text
    } catch (error: any) {
      console.error('Audio transcription error:', error)
      throw new Error(error.message || 'Failed to transcribe audio. Please try again or paste text manually.')
    }
  }

  // Use server-side API for other file types
  const formData = new FormData()
  formData.append('file', file)

  try {
    console.log('Sending file to server:', file.name, file.type, file.size)

    const response = await fetch('/api/process-file', {
      method: 'POST',
      body: formData,
    })

    console.log('Server response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Server error response:', errorData)
      throw new Error(errorData.error || `Server error: ${response.status}`)
    }

    const result = await response.json()
    console.log('Server response:', result)

    if (!result.success) {
      throw new Error(result.error || 'File processing failed')
    }

    if (!result.text || !result.text.trim()) {
      throw new Error('No text was extracted from the file. Please try a different file or paste text manually.')
    }

    return result.text
  } catch (error: any) {
    console.error('File processing error:', error)
    throw new Error(error.message || 'Failed to process file. Please try again or paste text manually.')
  }
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 100 * 1024 * 1024; // 100MB limit for longer audio files
  const allowedTypes = [
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/m4a',
    'audio/x-m4a',
    'audio/aac',
    'audio/ogg',
    'audio/webm'
  ];

  if (file.size > maxSize) {
    return { valid: false, error: "File size exceeds 100MB limit" };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Unsupported file type. Please use TXT, DOCX, image files (JPG, PNG, etc.), or audio files (MP3, WAV, M4A)."
    };
  }

  return { valid: true };
}
