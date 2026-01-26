import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Export content as a Word document (.docx)
 */
export const exportToDocx = async (content: string, title: string): Promise<void> => {
  // Parse content into paragraphs and handle basic formatting
  const lines = content.split('\n');
  const paragraphs: Paragraph[] = [];

  for (const line of lines) {
    if (!line.trim()) {
      // Empty line
      paragraphs.push(new Paragraph({ text: '' }));
      continue;
    }

    // Check for markdown-style headers
    if (line.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(2),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
        })
      );
    } else if (line.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(3),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (line.startsWith('### ')) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(4),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 80 },
        })
      );
    } else {
      // Regular paragraph - handle bold and italic
      const children: TextRun[] = [];
      let currentText = '';
      let isBold = false;
      let isItalic = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        // Check for **bold**
        if (char === '*' && nextChar === '*') {
          if (currentText) {
            children.push(new TextRun({ text: currentText, bold: isBold, italics: isItalic }));
            currentText = '';
          }
          isBold = !isBold;
          i++; // Skip next *
        }
        // Check for *italic*
        else if (char === '*') {
          if (currentText) {
            children.push(new TextRun({ text: currentText, bold: isBold, italics: isItalic }));
            currentText = '';
          }
          isItalic = !isItalic;
        } else {
          currentText += char;
        }
      }
      
      if (currentText) {
        children.push(new TextRun({ text: currentText, bold: isBold, italics: isItalic }));
      }
      
      paragraphs.push(
        new Paragraph({
          children: children.length > 0 ? children : [new TextRun(line)],
          spacing: { after: 120 },
        })
      );
    }
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  // Generate and download
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title || 'untitled'}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Export content as a PDF document
 */
export const exportToPdf = async (content: string, title: string): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Configure text settings
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  const lineHeight = 7;
  let yPosition = margin;

  // Add title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title || 'Untitled', margin, yPosition);
  yPosition += lineHeight * 2;

  // Add content
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  const lines = content.split('\n');
  
  for (const line of lines) {
    if (!line.trim()) {
      yPosition += lineHeight / 2;
      continue;
    }

    // Check for headers
    if (line.startsWith('# ')) {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const wrappedLines = pdf.splitTextToSize(line.substring(2), maxWidth);
      pdf.text(wrappedLines, margin, yPosition);
      yPosition += wrappedLines.length * lineHeight + 4;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
    } else if (line.startsWith('## ')) {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      const wrappedLines = pdf.splitTextToSize(line.substring(3), maxWidth);
      pdf.text(wrappedLines, margin, yPosition);
      yPosition += wrappedLines.length * lineHeight + 3;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
    } else {
      // Regular text - wrap long lines
      const wrappedLines = pdf.splitTextToSize(line, maxWidth);
      
      for (const wrappedLine of wrappedLines) {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(wrappedLine, margin, yPosition);
        yPosition += lineHeight;
      }
    }
  }

  // Save PDF
  pdf.save(`${title || 'untitled'}.pdf`);
};

/**
 * Export tree visualization as high-quality PNG
 */
export const exportTreeAsPng = async (title: string): Promise<void> => {
  const svgElement = document.querySelector('.tree-svg') as SVGElement;
  if (!svgElement) {
    throw new Error('Tree SVG not found');
  }

  try {
    // Get the SVG's parent container for proper sizing
    const container = svgElement.parentElement;
    if (!container) throw new Error('Tree container not found');

    // Create a temporary div with white background
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '1200px';
    tempDiv.style.height = '1200px';
    tempDiv.style.background = 'linear-gradient(to bottom, #F8F6F3, #FEFDFB)';
    document.body.appendChild(tempDiv);

    // Clone the SVG
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    clonedSvg.setAttribute('width', '1200');
    clonedSvg.setAttribute('height', '1200');
    tempDiv.appendChild(clonedSvg);

    // Convert to canvas
    const canvas = await html2canvas(tempDiv, {
      backgroundColor: null,
      scale: 2, // Higher resolution
      logging: false,
      width: 1200,
      height: 1200,
    });

    // Clean up temp div
    document.body.removeChild(tempDiv);

    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title || 'tree'}-visualization.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  } catch (error) {
    console.error('Failed to export tree:', error);
    throw error;
  }
};
