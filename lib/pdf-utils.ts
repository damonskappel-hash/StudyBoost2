// PDF utilities for client-side operations
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// Download content as PDF
export async function downloadAsPDF(content: string, filename: string, title?: string): Promise<void> {
  try {
    // Create a temporary div to render the content
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.top = '0'
    tempDiv.style.width = '800px'
    tempDiv.style.padding = '40px'
    tempDiv.style.backgroundColor = '#ffffff'
    tempDiv.style.fontFamily = 'Arial, sans-serif'
    tempDiv.style.fontSize = '14px'
    tempDiv.style.lineHeight = '1.6'
    tempDiv.style.color = '#000000'
    
    // Add title if provided
    if (title) {
      const titleElement = document.createElement('h1')
      titleElement.textContent = title
      titleElement.style.fontSize = '28px'
      titleElement.style.fontWeight = 'bold'
      titleElement.style.marginBottom = '30px'
      titleElement.style.color = '#1f2937'
      titleElement.style.borderBottom = '2px solid #e5e7eb'
      titleElement.style.paddingBottom = '15px'
      tempDiv.appendChild(titleElement)
    }
    
    // Convert markdown content to HTML and add to content element
    const contentElement = document.createElement('div')
    contentElement.className = 'markdown-content'
    contentElement.style.fontSize = '14px'
    contentElement.style.lineHeight = '1.6'
    
    // Basic markdown to HTML conversion
    let htmlContent = content
      // Headers
      .replace(/^### (.*$)/gim, '<h3 style="font-size: 18px; font-weight: 600; margin: 20px 0 10px 0; color: #374151;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="font-size: 20px; font-weight: 600; margin: 25px 0 15px 0; color: #1f2937;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="font-size: 22px; font-weight: 600; margin: 30px 0 20px 0; color: #111827;">$1</h1>')
      
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')
      
      // Lists
      .replace(/^\* (.*$)/gim, '<li style="margin: 5px 0;">$1</li>')
      .replace(/^- (.*$)/gim, '<li style="margin: 5px 0;">$1</li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li style="margin: 5px 0;">$2</li>')
      
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; font-family: monospace; font-size: 13px; overflow-x: auto;">$1</pre>')
      .replace(/`([^`]+)`/g, '<code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px;">$1</code>')
      
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote style="border-left: 4px solid #e5e7eb; padding-left: 15px; margin: 15px 0; font-style: italic; color: #6b7280;">$1</blockquote>')
      
      // Horizontal rules
      .replace(/^---$/gim, '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #3b82f6; text-decoration: underline;">$1</a>')
      
      // Line breaks
      .replace(/\n\n/g, '</p><p style="margin: 10px 0;">')
      .replace(/\n/g, '<br>')
    
    // Wrap lists in ul/ol tags (handle this separately to avoid regex compatibility issues)
    htmlContent = htmlContent.replace(/<li[^>]*>.*?<\/li>/g, function(match) {
      return '<ul style="margin: 15px 0; padding-left: 20px;">' + match + '</ul>'
    })
    
    // Wrap in paragraph tags
    htmlContent = '<p style="margin: 10px 0;">' + htmlContent + '</p>'
    
    contentElement.innerHTML = htmlContent
    tempDiv.appendChild(contentElement)
    
    // Add to document
    document.body.appendChild(tempDiv)
    
    // Wait a bit for rendering
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Convert to canvas with better quality and explicit styling to avoid oklch issues
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      removeContainer: true,
      width: 800,
      height: tempDiv.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      // Force explicit styling to avoid CSS variable issues
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.querySelector('.markdown-content')
        if (clonedElement) {
          // Ensure all text has explicit colors
          const allElements = clonedElement.querySelectorAll('*')
          allElements.forEach(el => {
            if (el.style.color === '' || el.style.color.includes('oklch')) {
              el.style.color = '#000000'
            }
            if (el.style.backgroundColor === '' || el.style.backgroundColor.includes('oklch')) {
              el.style.backgroundColor = '#ffffff'
            }
          })
        }
      }
    })
    
    // Remove temporary div
    document.body.removeChild(tempDiv)
    
    // Create PDF with better dimensions
    const imgData = canvas.toDataURL('image/png', 1.0)
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgWidth = 190 // Leave margins
    const pageHeight = 277 // A4 height minus margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    
    let position = 0
    
    // Add first page
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
    heightLeft -= pageHeight
    
    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 10, position + 10, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    
    // Download PDF
    pdf.save(`${filename}.pdf`)
    
  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error('Failed to generate PDF. Please try again.')
  }
}
