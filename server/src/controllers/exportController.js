import logger from '../config/logger.js';
import { query } from '../config/database.js';
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const exportProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { format = 'txt', includeMetadata = false } = req.body;

    if (!['txt', 'docx', 'pdf'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_FORMAT',
        message: 'Format must be txt, docx, or pdf'
      });
    }

    // Get project and content
    const projectResult = await query(
      `SELECT p.*, pc.content, pc.word_count
       FROM projects p
       JOIN project_content pc ON p.id = pc.project_id AND pc.is_current = TRUE
       WHERE p.id = $1 AND p.user_id = $2`,
      [projectId, req.auth.userId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PROJECT_NOT_FOUND',
        message: 'Project not found'
      });
    }

    const project = projectResult.rows[0];

    // For TXT format, return directly
    if (format === 'txt') {
      const content = includeMetadata
        ? `Title: ${project.title}\nWord Count: ${project.word_count}\nCreated: ${project.created_at}\n\n${project.content}`
        : project.content;

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${project.title}.txt"`);
      return res.send(content);
    }

    // For DOCX format
    if (format === 'docx') {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: project.title,
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 400 }
            }),
            // Metadata (optional)
            ...(includeMetadata ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Word Count: ${project.word_count} | Created: ${new Date(project.created_at).toLocaleDateString()}`,
                    italics: true,
                    size: 20
                  })
                ],
                spacing: { after: 400 }
              })
            ] : []),
            // Content paragraphs
            ...project.content.split('\n\n').map(para => 
              new Paragraph({
                children: [new TextRun(para)],
                spacing: { after: 200 }
              })
            )
          ]
        }]
      });

      const buffer = await Packer.toBuffer(doc);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${project.title}.docx"`);
      return res.send(buffer);
    }

    // For PDF format
    if (format === 'pdf') {
      const doc = new PDFDocument({
        margins: { top: 72, bottom: 72, left: 72, right: 72 },
        size: 'A4'
      });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${project.title}.pdf"`);

      // Pipe to response
      doc.pipe(res);

      // Title
      doc.fontSize(24).font('Times-Bold').text(project.title, { align: 'center' });
      doc.moveDown(1);

      // Metadata (optional)
      if (includeMetadata) {
        doc.fontSize(10).font('Times-Italic')
          .text(`Word Count: ${project.word_count} | Created: ${new Date(project.created_at).toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(1.5);
      }

      // Content
      doc.fontSize(12).font('Times-Roman');
      
      const paragraphs = project.content.split('\n\n');
      paragraphs.forEach((para, index) => {
        doc.text(para, { align: 'justify' });
        if (index < paragraphs.length - 1) {
          doc.moveDown(0.5);
        }
      });

      // Finalize PDF
      doc.end();
      
      logger.info('PDF export generated', { projectId, userId: req.auth.userId });
      return;
    }

  } catch (error) {
    logger.error('Export error', { error: error.message });
    next(error);
  }
};

export const exportTree = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { format = 'png', width = 800, height = 600, transparent = false } = req.body;

    if (!['png', 'svg'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_FORMAT',
        message: 'Format must be png or svg'
      });
    }

    // Verify project ownership
    const projectResult = await query(
      'SELECT id, title FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.auth.userId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PROJECT_NOT_FOUND',
        message: 'Project not found'
      });
    }

    const project = projectResult.rows[0];

    // Return mock URL for tree image
    // In production, this should be generated client-side and uploaded
    const mockUrl = `https://exports.writerstree.com/${projectId}/tree/${Date.now()}.${format}`;

    logger.info('Tree export request', { projectId, format, userId: req.auth.userId });

    res.json({
      success: true,
      message: 'Tree export ready',
      data: {
        downloadUrl: mockUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        format,
        filename: `${project.title}_tree.${format}`,
        dimensions: { width, height }
      }
    });

    // TODO: Implement tree image generation
    // Option 1: Client-side generation (preferred)
    // - Frontend generates SVG/PNG from tree component
    // - Gets presigned S3 upload URL from backend
    // - Uploads directly to S3
    // - Backend returns download URL
    //
    // Option 2: Server-side generation
    // - Use Puppeteer to render tree component
    // - Screenshot to PNG or save SVG
    // - Upload to S3
    // - Return signed URL
  } catch (error) {
    logger.error('Tree export error', { error: error.message });
    next(error);
  }
};
