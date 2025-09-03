// PDF utilities for client-side operations
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// Download content as PDF
export async function downloadAsPDF(content: string, filename: string, title?: string): Promise<void> {
  try {
    console.log('PDF generation started, content length:', content.length)
    
    // Create a completely isolated div with explicit styling to avoid any CSS variable issues
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
    tempDiv.style.border = 'none'
    tempDiv.style.outline = 'none'
    
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
      titleElement.style.backgroundColor = '#ffffff'
      tempDiv.appendChild(titleElement)
    }
    
    // Convert markdown content to HTML and add to content element
    const contentElement = document.createElement('div')
    contentElement.className = 'markdown-content'
    contentElement.style.fontSize = '14px'
    contentElement.style.lineHeight = '1.6'
    contentElement.style.color = '#000000'
    contentElement.style.backgroundColor = '#ffffff'
    
    // Basic markdown to HTML conversion
    let htmlContent = content
      // Headers
      .replace(/^### (.*$)/gim, '<h3 style="font-size: 18px; font-weight: 600; margin: 20px 0 10px 0; color: #374151; background-color: #ffffff;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="font-size: 20px; font-weight: 600; margin: 25px 0 15px 0; color: #1f2937; background-color: #ffffff;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="font-size: 22px; font-weight: 600; margin: 30px 0 20px 0; color: #111827; background-color: #ffffff;">$1</h1>')
      
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600; color: #000000; background-color: #ffffff;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="font-style: italic; color: #000000; background-color: #ffffff;">$1</em>')
      
      // Lists
      .replace(/^\* (.*$)/gim, '<li style="margin: 5px 0; color: #000000; background-color: #ffffff;">$1</li>')
      .replace(/^- (.*$)/gim, '<li style="margin: 5px 0; color: #000000; background-color: #ffffff;">$1</li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li style="margin: 5px 0; color: #000000; background-color: #ffffff;">$2</li>')
      
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; font-family: monospace; font-size: 13px; overflow-x: auto; color: #000000;">$1</pre>')
      .replace(/`([^`]+)`/g, '<code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #000000;">$1</code>')
      
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote style="border-left: 4px solid #e5e7eb; padding-left: 15px; margin: 15px 0; font-style: italic; color: #6b7280; background-color: #ffffff;">$1</blockquote>')
      
      // Horizontal rules
      .replace(/^---$/gim, '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; background-color: #ffffff;">')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #3b82f6; text-decoration: underline; background-color: #ffffff;">$1</a>')
      
      // Line breaks
      .replace(/\n\n/g, '</p><p style="margin: 10px 0; color: #000000; background-color: #ffffff;">')
      .replace(/\n/g, '<br>')
    
    // Wrap lists in ul/ol tags (handle this separately to avoid regex compatibility issues)
    htmlContent = htmlContent.replace(/<li[^>]*>.*?<\/li>/g, function(match) {
      return '<ul style="margin: 15px 0; padding-left: 20px; color: #000000; background-color: #ffffff;">' + match + '</ul>'
    })
    
    // Wrap in paragraph tags
    htmlContent = '<p style="margin: 10px 0; color: #000000; background-color: #ffffff;">' + htmlContent + '</p>'
    
    contentElement.innerHTML = htmlContent
    tempDiv.appendChild(contentElement)
    
    // Add to document
    document.body.appendChild(tempDiv)
    
    console.log('Temporary div created and added to document')
    
    // Wait a bit for rendering
    await new Promise(resolve => setTimeout(resolve, 100))
    
    console.log('Starting html2canvas conversion...')
    
    // Convert to canvas with explicit styling and debugging
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: true, // Enable logging to see what's happening
      removeContainer: true,
      width: 800,
      height: tempDiv.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      // Force explicit styling to avoid CSS variable issues
      onclone: (clonedDoc) => {
        console.log('onclone callback triggered')
        const clonedElement = clonedDoc.querySelector('.markdown-content')
        if (clonedElement) {
          console.log('Found cloned element, processing colors...')
          // Ensure all text has explicit colors
          const allElements = clonedElement.querySelectorAll('*')
          console.log('Found', allElements.length, 'elements to process')
          allElements.forEach((el, index) => {
            const htmlEl = el as HTMLElement
            
            // Get computed styles to catch CSS variables and oklch colors
            const computedStyle = window.getComputedStyle(htmlEl)
            const color = computedStyle.color
            const backgroundColor = computedStyle.backgroundColor
            
            console.log(`Element ${index}:`, {
              tagName: htmlEl.tagName,
              color: color,
              backgroundColor: backgroundColor,
              hasOklch: color?.includes('oklch') || backgroundColor?.includes('oklch')
            })
            
            // Force explicit hex colors for text
            if (color && (color.includes('oklch') || color.includes('var('))) {
              console.log(`Replacing oklch color with hex: ${color} -> #000000`)
              htmlEl.style.setProperty('color', '#000000', 'important')
            } else if (!htmlEl.style.color) {
              htmlEl.style.setProperty('color', '#000000', 'important')
            }
            
            // Force explicit hex colors for backgrounds
            if (backgroundColor && (backgroundColor.includes('oklch') || backgroundColor.includes('var('))) {
              console.log(`Replacing oklch background with hex: ${backgroundColor} -> #ffffff`)
              htmlEl.style.setProperty('background-color', '#ffffff', 'important')
            } else if (!htmlEl.style.backgroundColor) {
              htmlEl.style.setProperty('background-color', '#ffffff', 'important')
            }
            
            // Also handle any other problematic color properties
            const borderColor = computedStyle.borderColor
            if (borderColor && (borderColor.includes('oklch') || borderColor.includes('var('))) {
              htmlEl.style.setProperty('border-color', '#e5e7eb', 'important')
            }
          })
          
          // Also ensure the container itself has explicit colors
          const container = clonedElement as HTMLElement
          container.style.setProperty('color', '#000000', 'important')
          container.style.setProperty('background-color', '#ffffff', 'important')
          
          console.log('Color processing completed')
        } else {
          console.log('No cloned element found')
        }
      }
    })
    
    console.log('html2canvas conversion completed, canvas size:', canvas.width, 'x', canvas.height)
    
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
    
    console.log('PDF created successfully, saving...')
    
    // Download PDF
    pdf.save(`${filename}.pdf`)
    
    console.log('PDF download completed')
    
  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error('Failed to generate PDF. Please try again.')
  }
}
