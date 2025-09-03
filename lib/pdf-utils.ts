// PDF utilities for client-side operations
import jsPDF from 'jspdf'

// Download content as PDF
export async function downloadAsPDF(content: string, filename: string, title?: string): Promise<void> {
  try {
    console.log('PDF generation started, content length:', content.length)
    
    // Create PDF document
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    // Set initial position
    let yPosition = 20
    const pageWidth = 210
    const margin = 20
    const textWidth = pageWidth - (2 * margin)
    
    // Helper function to add text with word wrapping
    const addWrappedText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
      pdf.setFontSize(fontSize)
      if (isBold) {
        pdf.setFont('helvetica', 'bold')
      } else {
        pdf.setFont('helvetica', 'normal')
      }
      
      // Split text into lines that fit within the page width
      const lines = pdf.splitTextToSize(text, textWidth)
      
      // Check if we need a new page
      if (yPosition + (lines.length * fontSize * 0.4) > 277) {
        pdf.addPage()
        yPosition = 20
      }
      
      // Add text lines
      pdf.text(lines, margin, yPosition)
      yPosition += lines.length * fontSize * 0.4 + 5
    }
    
    // Add title if provided
    if (title) {
      addWrappedText(title, 18, true)
      yPosition += 10
    }
    
    // Process content line by line
    const lines = content.split('\n')
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      if (!trimmedLine) {
        yPosition += 5
        continue
      }
      
      // Handle headers
      if (trimmedLine.startsWith('### ')) {
        addWrappedText(trimmedLine.substring(4), 16, true)
      } else if (trimmedLine.startsWith('## ')) {
        addWrappedText(trimmedLine.substring(3), 16, true)
      } else if (trimmedLine.startsWith('# ')) {
        addWrappedText(trimmedLine.substring(2), 18, true)
      }
      // Handle lists
      else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ') || /^\d+\./.test(trimmedLine)) {
        const listText = trimmedLine.replace(/^[\*\-]\s*/, '').replace(/^\d+\.\s*/, '')
        addWrappedText(`• ${listText}`, 12, false)
      }
      // Handle code blocks
      else if (trimmedLine.startsWith('```')) {
        // Skip the opening and closing ```
        continue
      }
      // Handle blockquotes
      else if (trimmedLine.startsWith('> ')) {
        const quoteText = trimmedLine.substring(2)
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'italic')
        pdf.setTextColor(100, 100, 100)
        
        const lines = pdf.splitTextToSize(quoteText, textWidth - 10)
        if (yPosition + (lines.length * 12 * 0.4) > 277) {
          pdf.addPage()
          yPosition = 20
        }
        
        pdf.text(lines, margin + 5, yPosition)
        yPosition += lines.length * 12 * 0.4 + 5
        
        // Reset text color
        pdf.setTextColor(0, 0, 0)
      }
      // Handle horizontal rules
      else if (trimmedLine === '---') {
        pdf.setDrawColor(200, 200, 200)
        pdf.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 10
      }
      // Handle regular text
      else {
        // Check for bold and italic formatting
        let processedLine = trimmedLine
        let isBold = false
        let isItalic = false
        
        // Simple markdown processing
        if (trimmedLine.includes('**') || trimmedLine.includes('__')) {
          isBold = true
          processedLine = trimmedLine.replace(/\*\*(.*?)\*\*/g, '$1').replace(/__(.*?)__/g, '$1')
        }
        
        if (trimmedLine.includes('*') && !trimmedLine.includes('**')) {
          isItalic = true
          processedLine = trimmedLine.replace(/\*(.*?)\*/g, '$1')
        }
        
        // Handle code inline
        if (trimmedLine.includes('`')) {
          processedLine = trimmedLine.replace(/`([^`]+)`/g, '$1')
          pdf.setFont('courier', 'normal')
        }
        
        addWrappedText(processedLine, 12, isBold)
        
        // Reset font if we changed it
        if (trimmedLine.includes('`')) {
          pdf.setFont('helvetica', 'normal')
        }
      }
    }
    
    console.log('PDF created successfully, saving...')
    
    // Download PDF
    pdf.save(`${filename}.pdf`)
    
    console.log('PDF download completed')
    
  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error('Failed to generate PDF. Please try again.')
  }
}
