import pdf from 'pdf-parse';
import fs from 'fs';
import { logInfo, logError } from '../utils/logger';

export interface PDFExtractionResult {
  text: string;
  numPages: number;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
  };
  processingTime: number;
}

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(pdfPath: string): Promise<PDFExtractionResult> {
  const startTime = Date.now();

  try {
    logInfo(`Starting PDF extraction for: ${pdfPath}`);

    // Read PDF file
    const dataBuffer = fs.readFileSync(pdfPath);

    // Parse PDF
    // @ts-ignore - pdf-parse types issue
    const data = await pdf(dataBuffer);

    const processingTime = Date.now() - startTime;

    logInfo('PDF extraction completed', {
      numPages: data.numpages,
      textLength: data.text.length,
      processingTime,
    });

    return {
      text: data.text,
      numPages: data.numpages,
      metadata: {
        title: data.info?.Title,
        author: data.info?.Author,
        subject: data.info?.Subject,
        creator: data.info?.Creator,
      },
      processingTime,
    };
  } catch (error) {
    logError('PDF extraction failed', error);
    throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if PDF is scanned (image-based) or text-based
 * This is a heuristic check based on text density
 */
export async function isPDFScanned(pdfPath: string): Promise<boolean> {
  try {
    const result = await extractTextFromPDF(pdfPath);
    
    // If very little text is extracted, it's likely a scanned PDF
    const textDensity = result.text.trim().length / result.numPages;
    
    // Less than 50 characters per page suggests it's scanned
    return textDensity < 50;
  } catch (error) {
    logError('Failed to check if PDF is scanned', error);
    return true; // Assume scanned if check fails
  }
}

/**
 * Check if file is a PDF
 */
export function isPDFFile(mimetype: string): boolean {
  return mimetype.toLowerCase() === 'application/pdf';
}
