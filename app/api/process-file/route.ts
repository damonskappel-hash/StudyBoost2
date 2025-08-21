import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'

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

    let extractedText = ''

    // Handle different file types
    if (file.type === 'text/plain') {
      extractedText = await file.text()
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        console.log('Processing DOCX file...')
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        extractedText = result.value
        console.log('DOCX processing completed')
      } catch (error) {
        console.error('DOCX parsing error:', error)
        throw new Error('Failed to extract text from DOCX. Please try again or copy text manually.')
      }
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

    return NextResponse.json({
      success: true,
      text: extractedText,
      fileName: file.name
    })

  } catch (error: any) {
    console.error('File processing error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process file' },
      { status: 500 }
    )
  }
}
