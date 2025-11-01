import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface PDFExportOptions {
  fileName?: string
  markdown: string
  renderHTML: (markdown: string) => Promise<string>
}

/**
 * Export markdown content to PDF with proper formatting preservation
 * @param options - Configuration options for PDF export
 */
export async function exportToPDF(options: PDFExportOptions): Promise<void> {
  const { fileName = 'document.pdf', markdown, renderHTML } = options

  try {
    // Create a temporary container for rendering
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.width = '210mm' // A4 width
    container.style.padding = '20mm'
    container.style.backgroundColor = '#ffffff'
    container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    container.style.fontSize = '12pt'
    container.style.lineHeight = '1.6'
    container.style.color = '#000000'

    // Render the markdown to HTML
    const html = await renderHTML(markdown)
    container.innerHTML = html

    // Apply PDF-specific styles
    applyPDFStyles(container)

    // Add to document temporarily
    document.body.appendChild(container)

    // Wait for images and fonts to load
    await waitForContent(container)

    // Convert to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight,
    })

    // Remove temporary container
    document.body.removeChild(container)

    // Create PDF
    const imgWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0

    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgData = canvas.toDataURL('image/png')

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Save the PDF
    pdf.save(fileName)
  } catch (error) {
    console.error('Error exporting to PDF:', error)
    throw new Error('Failed to export PDF. Please try again.')
  }
}

/**
 * Apply styles optimized for PDF export
 */
function applyPDFStyles(container: HTMLElement): void {
  // Style headings
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
  headings.forEach((heading) => {
    const el = heading as HTMLElement
    el.style.color = '#000000'
    el.style.marginTop = '1.5em'
    el.style.marginBottom = '0.5em'
    el.style.fontWeight = 'bold'
    el.style.pageBreakAfter = 'avoid'

    if (heading.tagName === 'H1') {
      el.style.fontSize = '24pt'
      el.style.borderBottom = '2px solid #333'
      el.style.paddingBottom = '0.3em'
    } else if (heading.tagName === 'H2') {
      el.style.fontSize = '20pt'
      el.style.borderBottom = '1px solid #666'
      el.style.paddingBottom = '0.3em'
    } else if (heading.tagName === 'H3') {
      el.style.fontSize = '16pt'
    } else if (heading.tagName === 'H4') {
      el.style.fontSize = '14pt'
    }
  })

  // Style paragraphs
  const paragraphs = container.querySelectorAll('p')
  paragraphs.forEach((p) => {
    const el = p as HTMLElement
    el.style.marginBottom = '1em'
    el.style.lineHeight = '1.6'
    el.style.textAlign = 'justify'
  })

  // Style code blocks
  const codeBlocks = container.querySelectorAll('pre')
  codeBlocks.forEach((pre) => {
    const el = pre as HTMLElement
    el.style.backgroundColor = '#f5f5f5'
    el.style.border = '1px solid #ddd'
    el.style.borderRadius = '4px'
    el.style.padding = '1em'
    el.style.marginBottom = '1em'
    el.style.overflow = 'auto'
    el.style.fontSize = '10pt'
    el.style.fontFamily = 'Monaco, Consolas, "Courier New", monospace'
    el.style.pageBreakInside = 'avoid'
  })

  // Style inline code
  const inlineCode = container.querySelectorAll('code:not(pre code)')
  inlineCode.forEach((code) => {
    const el = code as HTMLElement
    el.style.backgroundColor = '#f5f5f5'
    el.style.border = '1px solid #e0e0e0'
    el.style.borderRadius = '3px'
    el.style.padding = '2px 4px'
    el.style.fontSize = '0.9em'
    el.style.fontFamily = 'Monaco, Consolas, "Courier New", monospace'
  })

  // Style tables
  const tables = container.querySelectorAll('table')
  tables.forEach((table) => {
    const el = table as HTMLElement
    el.style.borderCollapse = 'collapse'
    el.style.width = '100%'
    el.style.marginBottom = '1em'
    el.style.fontSize = '10pt'
    el.style.pageBreakInside = 'avoid'
  })

  const tableCells = container.querySelectorAll('th, td')
  tableCells.forEach((cell) => {
    const el = cell as HTMLElement
    el.style.border = '1px solid #ddd'
    el.style.padding = '8px'
    el.style.textAlign = 'left'

    if (cell.tagName === 'TH') {
      el.style.backgroundColor = '#f0f0f0'
      el.style.fontWeight = 'bold'
    }
  })

  // Style lists
  const lists = container.querySelectorAll('ul, ol')
  lists.forEach((list) => {
    const el = list as HTMLElement
    el.style.marginBottom = '1em'
    el.style.paddingLeft = '2em'
  })

  const listItems = container.querySelectorAll('li')
  listItems.forEach((li) => {
    const el = li as HTMLElement
    el.style.marginBottom = '0.5em'
  })

  // Style blockquotes
  const blockquotes = container.querySelectorAll('blockquote')
  blockquotes.forEach((blockquote) => {
    const el = blockquote as HTMLElement
    el.style.borderLeft = '4px solid #ccc'
    el.style.paddingLeft = '1em'
    el.style.marginLeft = '0'
    el.style.marginBottom = '1em'
    el.style.color = '#666'
    el.style.fontStyle = 'italic'
  })

  // Style horizontal rules
  const hrs = container.querySelectorAll('hr')
  hrs.forEach((hr) => {
    const el = hr as HTMLElement
    el.style.border = 'none'
    el.style.borderTop = '2px solid #ddd'
    el.style.marginTop = '2em'
    el.style.marginBottom = '2em'
  })

  // Style links
  const links = container.querySelectorAll('a')
  links.forEach((link) => {
    const el = link as HTMLElement
    el.style.color = '#0066cc'
    el.style.textDecoration = 'underline'
  })

  // Style images
  const images = container.querySelectorAll('img')
  images.forEach((img) => {
    const el = img as HTMLElement
    el.style.maxWidth = '100%'
    el.style.height = 'auto'
    el.style.display = 'block'
    el.style.marginBottom = '1em'
  })

  // Style strikethrough
  const strikethrough = container.querySelectorAll('del')
  strikethrough.forEach((del) => {
    const el = del as HTMLElement
    el.style.textDecoration = 'line-through'
    el.style.color = '#666'
  })

  // Style emphasis
  const emphasis = container.querySelectorAll('em')
  emphasis.forEach((em) => {
    const el = em as HTMLElement
    el.style.fontStyle = 'italic'
  })

  const strong = container.querySelectorAll('strong')
  strong.forEach((s) => {
    const el = s as HTMLElement
    el.style.fontWeight = 'bold'
  })
}

/**
 * Wait for images and other content to load
 */
async function waitForContent(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'))

  if (images.length === 0) {
    // Give a small delay for fonts to load
    await new Promise(resolve => setTimeout(resolve, 100))
    return
  }

  const imagePromises = images.map((img) => {
    return new Promise<void>((resolve) => {
      if (img.complete) {
        resolve()
      } else {
        img.onload = () => resolve()
        img.onerror = () => resolve() // Continue even if image fails to load
      }
    })
  })

  await Promise.all(imagePromises)

  // Additional delay for fonts and rendering
  await new Promise(resolve => setTimeout(resolve, 200))
}
