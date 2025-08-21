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
      titleElement.style.fontSize = '24px'
      titleElement.style.fontWeight = 'bold'
      titleElement.style.marginBottom = '20px'
      titleElement.style.color = '#1f2937'
      tempDiv.appendChild(titleElement)
    }
    
    // Add content
    const contentElement = document.createElement('div')
    contentElement.innerHTML = content.replace(/\n/g, '<br>')
    tempDiv.appendChild(contentElement)
    
    // Add to document
    document.body.appendChild(tempDiv)
    
    // Convert to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      removeContainer: true
    })
    
    // Remove temporary div
    document.body.removeChild(tempDiv)
    
    // Create PDF
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgWidth = 210
    const pageHeight = 295
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    
    let position = 0
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    
    // Download PDF
    pdf.save(`${filename}.pdf`)
    
  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error('Failed to generate PDF')
  }
}
