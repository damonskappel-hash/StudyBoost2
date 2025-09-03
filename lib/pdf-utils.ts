// PDF utilities for client-side operations
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// Download content as PDF
export async function downloadAsPDF(content: string, filename: string, title?: string): Promise<void> {
  try {
    console.log('PDF generation started, content length:', content.length)
    
    // Create a completely isolated iframe to avoid any CSS inheritance issues
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.left = '-9999px'
    iframe.style.top = '0'
    iframe.style.width = '800px'
    iframe.style.height = '1200px'
    iframe.style.border = 'none'
    iframe.style.background = '#ffffff'
    
    // Add iframe to document
    document.body.appendChild(iframe)
    
    // Wait for iframe to load
    await new Promise(resolve => {
      iframe.onload = resolve
      iframe.src = 'about:blank'
    })
    
    console.log('Iframe created and loaded')
    
    // Get the iframe document
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) {
      throw new Error('Could not access iframe document')
    }
    
    // Create a completely clean HTML document in the iframe
    const cleanHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              font-size: 14px;
              line-height: 1.6;
              color: #000000 !important;
              background-color: #ffffff !important;
              margin: 0;
              padding: 40px;
              width: 720px;
            }
            h1 {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 30px;
              color: #1f2937 !important;
              background-color: #ffffff !important;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 15px;
            }
            h2 {
              font-size: 20px;
              font-weight: 600;
              margin: 25px 0 15px 0;
              color: #1f2937 !important;
              background-color: #ffffff !important;
            }
            h3 {
              font-size: 18px;
              font-weight: 600;
              margin: 20px 0 10px 0;
              color: #374151 !important;
              background-color: #ffffff !important;
            }
            p {
              margin: 10px 0;
              color: #000000 !important;
              background-color: #ffffff !important;
            }
            strong {
              font-weight: 600;
              color: #000000 !important;
              background-color: #ffffff !important;
            }
            em {
              font-style: italic;
              color: #000000 !important;
              background-color: #ffffff !important;
            }
            ul, ol {
              margin: 15px 0;
              padding-left: 20px;
              color: #000000 !important;
              background-color: #ffffff !important;
            }
            li {
              margin: 5px 0;
              color: #000000 !important;
              background-color: #ffffff !important;
            }
            pre {
              background-color: #f3f4f6;
              padding: 15px;
              border-radius: 6px;
              margin: 15px 0;
              font-family: monospace;
              font-size: 13px;
              overflow-x: auto;
              color: #000000 !important;
            }
            code {
              background-color: #f3f4f6;
              padding: 2px 6px;
              border-radius: 4px;
              font-family: monospace;
              font-size: 13px;
              color: #000000 !important;
            }
            blockquote {
              border-left: 4px solid #e5e7eb;
              padding-left: 15px;
              margin: 15px 0;
              font-style: italic;
              color: #6b7280 !important;
              background-color: #ffffff !important;
            }
            hr {
              border: none;
              border-top: 1px solid #e5e7eb;
              margin: 20px 0;
              background-color: #ffffff !important;
            }
            a {
              color: #3b82f6;
              text-decoration: underline;
              background-color: #ffffff !important;
            }
          </style>
        </head>
        <body>
          ${title ? `<h1>${title}</h1>` : ''}
          <div class="content">
            ${content
              // Headers
              .replace(/^### (.*$)/gim, '<h3>$1</h3>')
              .replace(/^## (.*$)/gim, '<h2>$1</h2>')
              .replace(/^# (.*$)/gim, '<h1>$1</h1>')
              
              // Bold and italic
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              
              // Lists
              .replace(/^\* (.*$)/gim, '<li>$1</li>')
              .replace(/^- (.*$)/gim, '<li>$1</li>')
              .replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>')
              
              // Code blocks
              .replace(/```([\s\S]*?)```/g, '<pre>$1</pre>')
              .replace(/`([^`]+)`/g, '<code>$1</code>')
              
              // Blockquotes
              .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
              
              // Horizontal rules
              .replace(/^---$/gim, '<hr>')
              
              // Links
              .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
              
              // Line breaks
              .replace(/\n\n/g, '</p><p>')
              .replace(/\n/g, '<br>')
            }
          </div>
        </body>
      </html>
    `
    
    // Set the iframe content
    iframeDoc.open()
    iframeDoc.write(cleanHtml)
    iframeDoc.close()
    
    console.log('Clean HTML written to iframe')
    
    // Wait for content to render
    await new Promise(resolve => setTimeout(resolve, 200))
    
    console.log('Starting html2canvas conversion from iframe...')
    
    // Convert iframe content to canvas
    const canvas = await html2canvas(iframe, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: true,
      width: 800,
      height: iframe.scrollHeight || 1200,
      scrollX: 0,
      scrollY: 0
    })
    
    console.log('html2canvas conversion completed, canvas size:', canvas.width, 'x', canvas.height)
    
    // Remove iframe
    document.body.removeChild(iframe)
    
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
