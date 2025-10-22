import mammoth from 'mammoth';
import { logInfo, logError } from '../utils/logger';

export interface DOCXExtractionResult {
  text: string;
  html: string;
  processingTime: number;
}

/**
 * Extract text from DOCX file
 */
export async function extractTextFromDOCX(docxPath: string): Promise<DOCXExtractionResult> {
  const startTime = Date.now();

  try {
    logInfo(`Starting DOCX extraction for: ${docxPath}`);

    // Extract text
    const textResult = await mammoth.extractRawText({ path: docxPath });
    
    // Extract HTML (useful for preserving structure)
    const htmlResult = await mammoth.convertToHtml({ path: docxPath });

    const processingTime = Date.now() - startTime;

    logInfo('DOCX extraction completed', {
      textLength: textResult.value.length,
      processingTime,
    });

    return {
      text: textResult.value,
      html: htmlResult.value,
      processingTime,
    };
  } catch (error) {
    logError('DOCX extraction failed', error);
    throw new Error(`DOCX extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if file is a DOCX
 */
export function isDOCXFile(mimetype: string): boolean {
  return mimetype.toLowerCase() === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
}
