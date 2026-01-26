import { $getRoot, $isTextNode, type EditorState } from 'lexical';
import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import { $isListNode, $isListItemNode } from '@lexical/list';
import { $isLinkNode } from '@lexical/link';
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';

/**
 * Export Lexical editor state to DOCX with preserved formatting
 */
export const exportLexicalToDocx = async (
  editorState: EditorState,
  title: string
): Promise<void> => {
  const paragraphs: Paragraph[] = [];

  editorState.read(() => {
    const root = $getRoot();
    
    root.getChildren().forEach((node) => {
      // Handle headings
      if ($isHeadingNode(node)) {
        const tag = node.getTag();
        let headingLevel = HeadingLevel.HEADING_1;
        
        if (tag === 'h2') headingLevel = HeadingLevel.HEADING_2 as any;
        else if (tag === 'h3') headingLevel = HeadingLevel.HEADING_3 as any;
        
        paragraphs.push(
          new Paragraph({
            text: node.getTextContent(),
            heading: headingLevel,
            spacing: { before: 240, after: 120 },
          })
        );
      }
      // Handle quotes
      else if ($isQuoteNode(node)) {
        const textRuns: TextRun[] = [];
        const children = node.getChildren();
        
        children.forEach((child) => {
          if ($isTextNode(child)) {
            textRuns.push(
              new TextRun({
                text: child.getTextContent(),
                italics: true,
                bold: child.hasFormat('bold'),
              })
            );
          }
        });
        
        paragraphs.push(
          new Paragraph({
            children: textRuns.length > 0 ? textRuns : [new TextRun({ text: node.getTextContent(), italics: true })],
            spacing: { before: 120, after: 120 },
            indent: { left: 720 },
            border: {
              left: {
                color: '999999',
                space: 1,
                size: 12,
                style: 'single',
              },
            },
          })
        );
      }
      // Handle lists
      else if ($isListNode(node)) {
        const listType = node.getListType();
        let counter = 1;
        
        node.getChildren().forEach((listItem) => {
          if ($isListItemNode(listItem)) {
            const textRuns = extractTextRuns(listItem);
            const bullet = listType === 'number' ? `${counter}. ` : '• ';
            
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({ text: bullet }),
                  ...textRuns,
                ],
                spacing: { after: 80 },
                indent: { left: 720 },
              })
            );
            counter++;
          }
        });
      }
      // Handle regular paragraphs
      else {
        const textRuns = extractTextRuns(node);
        
        if (textRuns.length > 0 || node.getTextContent().trim()) {
          paragraphs.push(
            new Paragraph({
              children: textRuns.length > 0 ? textRuns : [new TextRun(node.getTextContent())],
              spacing: { after: 120 },
            })
          );
        }
      }
    });
  });

  // Create document
  const doc = new Document({
    creator: 'Writer\'s Tree',
    title: title,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  // Generate and download
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title}.docx`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Extract text runs with formatting from a node
 */
function extractTextRuns(node: any): TextRun[] {
  const textRuns: TextRun[] = [];
  
  const processNode = (n: any) => {
    if ($isTextNode(n)) {
      const text = n.getTextContent();
      if (!text) return;
      
      textRuns.push(
        new TextRun({
          text,
          bold: n.hasFormat('bold'),
          italics: n.hasFormat('italic'),
          underline: n.hasFormat('underline') ? {} : undefined,
          strike: n.hasFormat('strikethrough'),
        })
      );
    } else if ($isLinkNode(n)) {
      // Handle links
      const linkText = n.getTextContent();
      textRuns.push(
        new TextRun({
          text: linkText,
          color: '0563C1',
          underline: {},
        })
      );
    } else {
      // Recursively process children
      const children = n.getChildren?.() || [];
      children.forEach((child: any) => processNode(child));
    }
  };
  
  processNode(node);
  return textRuns;
}

/**
 * Export Lexical editor state to PDF with preserved formatting
 */
export const exportLexicalToPdf = async (
  editorState: EditorState,
  title: string
): Promise<void> => {
  const pdf = new (await import('jspdf')).jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter',
  });

  const margin = 1;
  const pageWidth = 8.5;
  const pageHeight = 11;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  // Add title
  pdf.setFont('times', 'bold');
  pdf.setFontSize(24);
  pdf.text(title, margin, currentY);
  currentY += 0.5;

  editorState.read(() => {
    const root = $getRoot();

    root.getChildren().forEach((node) => {
      // Check if we need a new page
      if (currentY > pageHeight - margin) {
        pdf.addPage();
        currentY = margin;
      }

      if ($isHeadingNode(node)) {
        const tag = node.getTag();
        pdf.setFont('times', 'bold');
        
        if (tag === 'h1') pdf.setFontSize(18);
        else if (tag === 'h2') pdf.setFontSize(16);
        else pdf.setFontSize(14);
        
        const lines = pdf.splitTextToSize(node.getTextContent(), contentWidth);
        pdf.text(lines, margin, currentY);
        currentY += lines.length * 0.25 + 0.3;
      } else if ($isQuoteNode(node)) {
        pdf.setFont('times', 'italic');
        pdf.setFontSize(12);
        const lines = pdf.splitTextToSize(node.getTextContent(), contentWidth - 0.5);
        pdf.text(lines, margin + 0.5, currentY);
        currentY += lines.length * 0.2 + 0.2;
      } else if ($isListNode(node)) {
        pdf.setFont('times', 'normal');
        pdf.setFontSize(12);
        const listType = node.getListType();
        let counter = 1;
        
        node.getChildren().forEach((listItem) => {
          if ($isListItemNode(listItem)) {
            const bullet = listType === 'number' ? `${counter}. ` : '• ';
            const text = listItem.getTextContent();
            const lines = pdf.splitTextToSize(bullet + text, contentWidth - 0.5);
            pdf.text(lines, margin + 0.3, currentY);
            currentY += lines.length * 0.2 + 0.1;
            counter++;
          }
        });
      } else {
        pdf.setFont('times', 'normal');
        pdf.setFontSize(12);
        const text = node.getTextContent();
        
        if (text.trim()) {
          const lines = pdf.splitTextToSize(text, contentWidth);
          pdf.text(lines, margin, currentY);
          currentY += lines.length * 0.2 + 0.2;
        }
      }
    });
  });

  // Add page numbers
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.text(`${i}`, pageWidth / 2, pageHeight - 0.5, { align: 'center' });
  }

  pdf.save(`${title}.pdf`);
};

/**
 * Export Lexical editor state to Markdown
 */
export const exportLexicalToMarkdown = (editorState: EditorState): string => {
  let markdown = '';

  editorState.read(() => {
    const root = $getRoot();

    root.getChildren().forEach((node) => {
      if ($isHeadingNode(node)) {
        const tag = node.getTag();
        const level = tag === 'h1' ? '#' : tag === 'h2' ? '##' : '###';
        markdown += `${level} ${node.getTextContent()}\n\n`;
      } else if ($isQuoteNode(node)) {
        markdown += `> ${node.getTextContent()}\n\n`;
      } else if ($isListNode(node)) {
        const listType = node.getListType();
        let counter = 1;
        
        node.getChildren().forEach((listItem) => {
          if ($isListItemNode(listItem)) {
            const prefix = listType === 'number' ? `${counter}. ` : '- ';
            markdown += `${prefix}${formatTextForMarkdown(listItem)}\n`;
            counter++;
          }
        });
        markdown += '\n';
      } else {
        const text = formatTextForMarkdown(node);
        if (text.trim()) {
          markdown += `${text}\n\n`;
        }
      }
    });
  });

  return markdown;
};

/**
 * Format text node with markdown syntax for bold/italic
 */
function formatTextForMarkdown(node: any): string {
  let result = '';
  
  const processNode = (n: any) => {
    if ($isTextNode(n)) {
      let text = n.getTextContent();
      
      if (n.hasFormat('bold') && n.hasFormat('italic')) {
        text = `***${text}***`;
      } else if (n.hasFormat('bold')) {
        text = `**${text}**`;
      } else if (n.hasFormat('italic')) {
        text = `*${text}*`;
      }
      
      if (n.hasFormat('strikethrough')) {
        text = `~~${text}~~`;
      }
      
      if (n.hasFormat('code')) {
        text = `\`${text}\``;
      }
      
      result += text;
    } else if ($isLinkNode(n)) {
      const url = n.getURL();
      const linkText = n.getTextContent();
      result += `[${linkText}](${url})`;
    } else {
      const children = n.getChildren?.() || [];
      children.forEach((child: any) => processNode(child));
    }
  };
  
  processNode(node);
  return result;
}

/**
 * Download markdown as file
 */
export const downloadMarkdown = (markdown: string, filename: string): void => {
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.md`;
  link.click();
  URL.revokeObjectURL(url);
};
