// Client-side OCR processing using Tesseract.js
export async function extractTextFromImage(file: File): Promise<string> {
  try {
    console.log('Starting client-side OCR processing...')
    
    // Dynamic import to avoid SSR issues
    const Tesseract = await import('tesseract.js')
    
    // Convert file to base64 for Tesseract
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = buffer.toString('base64')
    
    console.log('Processing image with Tesseract...')
    
    // Use Tesseract to extract text from image
    const result = await Tesseract.recognize(
      `data:${file.type};base64,${base64Image}`,
      'eng', // English language
      {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            console.log('OCR Progress:', Math.round(m.progress * 100), '%')
          }
        }
      }
    )
    
    const extractedText = result.data.text || ''
    console.log('OCR processing completed, text length:', extractedText.length)
    
    if (!extractedText.trim()) {
      throw new Error('No text could be extracted from this image. Please ensure the image contains clear, readable text.')
    }
    
    // Normalize and sanitize OCR output
    // 1) Normalize Unicode, replace non-breaking spaces
    let normalized = extractedText
      .normalize('NFKC')
      .replace(/\u00A0/g, ' ')

    // 2) Remove characters that are not letters, numbers, whitespace, or common punctuation
    //    Keep newlines for basic structure
    normalized = normalized.replace(/[^\p{L}\p{N}\s.,;:'"()\-–—?!%\/]/gu, '')

    // 3) Split into lines and filter out noisy ones
    const lines = normalized
      .split(/\r?\n/)
      .map((line) => line.replace(/\s{2,}/g, ' ').trim())
      .filter((line) => {
        if (!line) return false
        // Must contain at least two letters
        const hasWords = /[\p{L}]{2,}/u.test(line)
        if (!hasWords) return false
        // Compute symbol ratio (non letters/numbers/space)
        const symbols = (line.match(/[^\p{L}\p{N}\s]/gu) || []).length
        const ratio = symbols / Math.max(line.length, 1)
        return ratio < 0.3
      })

    // 4) Join back, collapse excessive blank lines
    const cleaned = lines.join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    
    return cleaned
    
  } catch (error) {
    console.error('OCR processing error:', error)
    if (error instanceof Error) {
      throw new Error(`Image OCR failed: ${error.message}`)
    } else {
      throw new Error('Failed to extract text from image. Please try again or copy text manually.')
    }
  }
}
