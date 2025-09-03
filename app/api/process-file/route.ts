import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'

// Force Node.js runtime for mammoth compatibility
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`)

    let extractedText = ''

    // Handle different file types
    if (file.type === 'text/plain') {
      extractedText = await file.text()
      console.log('TXT processing completed')
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      extractedText = await processDocxFile(file)
    } else if (file.type === 'application/pdf') {
      // PDF processing is temporarily disabled due to library issues
      throw new Error('PDF processing is temporarily unavailable. Please copy text from your PDF and paste it manually, or convert your PDF to a Word document first.')
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      // PowerPoint files (.pptx)
      throw new Error('PowerPoint files are not supported yet. Please convert to PDF or copy text manually.')
    } else if (file.type.startsWith('image/')) {
      // Image OCR is handled on the client side
      throw new Error('Image OCR is temporarily unavailable. Please copy text from your image and paste it manually, or use Google Lens to extract text first.')
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type. Please use TXT or DOCX files.' },
        { status: 400 }
      )
    }

    // Validate extracted text
    if (!extractedText || extractedText.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'No text content could be extracted from the file. Please ensure the file contains readable text.' },
        { status: 400 }
      )
    }

    console.log('File processing completed successfully')
    return NextResponse.json({
      success: true,
      text: extractedText,
      fileName: file.name
    })

  } catch (error: any) {
    console.error('File processing error:', error)
    
    // Return more specific error messages
    const errorMessage = error.message || 'Failed to process file'
    const statusCode = error.message?.includes('Unsupported file type') ? 400 : 500
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    )
  }
}

// Separate function for DOCX processing with multiple fallback methods
async function processDocxFile(file: File): Promise<string> {
  console.log('Starting DOCX processing with multiple methods...')
  
  // Validate file size (DOCX files should typically be reasonable size)
  if (file.size > 50 * 1024 * 1024) { // 50MB limit
    throw new Error('File size too large. Please use a smaller DOCX file (under 50MB).')
  }
  
  // Method 1: Try mammoth with standard options
  try {
    console.log('Method 1: Trying mammoth with standard options...')
    const text = await extractWithMammoth(file, { ignoreEmptyParagraphs: false, includeDefaultStyleMap: false })
    if (text && text.trim() !== '') {
      console.log('Method 1 succeeded')
      return text
    }
  } catch (error: any) {
    console.log('Method 1 failed:', error.message)
  }
  
  // Method 2: Try mammoth with different options
  try {
    console.log('Method 2: Trying mammoth with alternative options...')
    const text = await extractWithMammoth(file, { ignoreEmptyParagraphs: true, includeDefaultStyleMap: true })
    if (text && text.trim() !== '') {
      console.log('Method 2 succeeded')
      return text
    }
  } catch (error: any) {
    console.log('Method 2 failed:', error.message)
  }
  
  // Method 3: Try manual extraction from ZIP structure
  try {
    console.log('Method 3: Trying manual ZIP extraction...')
    const text = await extractTextFromZipBuffer(await file.arrayBuffer())
    if (text && text.trim() !== '') {
      console.log('Method 3 succeeded')
      return text
    }
  } catch (error: any) {
    console.log('Method 3 failed:', error.message)
  }
  
  // Method 4: Try to read as plain text (sometimes works with corrupted DOCX)
  try {
    console.log('Method 4: Trying plain text extraction...')
    const text = await file.text()
    if (text && text.trim() !== '' && text.length > 100) { // Must have substantial content
      console.log('Method 4 succeeded')
      return text
    }
  } catch (error: any) {
    console.log('Method 4 failed:', error.message)
  }
  
  // All methods failed
  throw new Error('All DOCX processing methods failed. The file may be corrupted, password-protected, or in an unsupported format. Please try opening and resaving it in Microsoft Word or Google Docs.')
}

// Helper function to extract text using mammoth with specific options
async function extractWithMammoth(file: File, options: any): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  // Validate buffer
  if (buffer.length === 0) {
    throw new Error('File appears to be empty or corrupted')
  }
  
  // Check magic bytes
  const magicBytes = buffer.slice(0, 4).toString('hex')
  if (magicBytes !== '504b0304' && magicBytes !== '504b0506' && magicBytes !== '504b0708') {
    console.warn('File may not be a valid DOCX (ZIP) file. Magic bytes:', magicBytes)
  }
  
  const result = await mammoth.extractRawText({ buffer, ...options })
  
  if (!result.value || result.value.trim() === '') {
    throw new Error('No text content found in DOCX file')
  }
  
  return result.value
}

// Helper function to manually extract text from ZIP buffer as last resort
async function extractTextFromZipBuffer(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const buffer = Buffer.from(arrayBuffer)
    
    // Look at first 50KB for text content
    const bufferString = buffer.toString('utf8', 0, Math.min(buffer.length, 50000))
    
    // Look for XML content which might contain text
    const xmlMatches = bufferString.match(/<[^>]*>[^<]*<\/[^>]*>/g)
    if (xmlMatches) {
      // Extract text content from XML tags
      const textContent = xmlMatches
        .map(match => match.replace(/<[^>]*>/g, ' '))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      
      if (textContent.length > 50) { // Must have some meaningful content
        return textContent
      }
    }
    
    // Look for plain text patterns
    const textPatterns = bufferString.match(/[A-Za-z]{3,}[^<>]*/g)
    if (textPatterns) {
      const textContent = textPatterns
        .filter(pattern => pattern.length > 10)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      
      if (textContent.length > 100) {
        return textContent
      }
    }
    
    throw new Error('No readable text content found in file')
  } catch (error: any) {
    throw new Error('Manual text extraction failed')
  }
}
