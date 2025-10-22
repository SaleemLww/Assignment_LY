import { extractTextFromImage, isImageFile } from './ocr.service';
import { extractTextFromPDF, isPDFFile, isPDFScanned } from './pdf.service';
import { extractTextFromDOCX, isDOCXFile } from './docx.service';
import { extractTimetableWithLLM, validateTimeBlocks, type TimetableData } from './llm.service';
import { logInfo, logError } from '../utils/logger';

export interface ExtractionResult {
  success: boolean;
  timetableData?: TimetableData;
  extractedText: string;
  method: 'ocr' | 'pdf' | 'docx' | 'hybrid';
  confidence: number;
  processingTime: number;
  error?: string;
}

/**
 * Main extraction orchestrator
 * Determines the best extraction method based on file type
 */
export async function extractTimetable(
  filePath: string,
  mimeType: string
): Promise<ExtractionResult> {
  const startTime = Date.now();

  try {
    logInfo('Starting timetable extraction', { filePath, mimeType });

    let extractedText = '';
    let method: 'ocr' | 'pdf' | 'docx' | 'hybrid' = 'pdf';

    // Step 1: Extract text based on file type
    if (isImageFile(mimeType)) {
      // Image files -> OCR with AI/ML (OpenAI Vision, Google Vision, or Tesseract)
      logInfo('Processing as image file (AI-powered OCR)');
      const ocrResult = await extractTextFromImage(filePath);
      extractedText = ocrResult.text;
      method = 'ocr';
      logInfo(`OCR extraction completed using: ${ocrResult.method}`, {
        confidence: ocrResult.confidence,
        processingTime: ocrResult.processingTime,
      });
    } else if (isPDFFile(mimeType)) {
      // PDF files -> Check if scanned or text-based
      logInfo('Processing as PDF file');
      const isScanned = await isPDFScanned(filePath);
      
      if (isScanned) {
        logInfo('PDF appears to be scanned, using OCR');
        // For scanned PDFs, we would need to convert to images first
        // For now, try extracting text anyway
        const pdfResult = await extractTextFromPDF(filePath);
        extractedText = pdfResult.text;
        method = 'hybrid';
      } else {
        logInfo('PDF is text-based, extracting directly');
        const pdfResult = await extractTextFromPDF(filePath);
        extractedText = pdfResult.text;
        method = 'pdf';
      }
    } else if (isDOCXFile(mimeType)) {
      // DOCX files -> Direct text extraction
      logInfo('Processing as DOCX file');
      const docxResult = await extractTextFromDOCX(filePath);
      extractedText = docxResult.text;
      method = 'docx';
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    // Check if we got any text
    if (!extractedText || extractedText.trim().length < 10) {
      throw new Error('Insufficient text extracted from document');
    }

    logInfo('Text extraction completed', {
      method,
      textLength: extractedText.length,
    });

    // Step 2: Use LLM to structure the extracted text
    logInfo('Starting LLM-based structuring');
    const llmResult = await extractTimetableWithLLM(extractedText);

    // Step 3: Validate extracted time blocks
    const validatedTimeBlocks = validateTimeBlocks(llmResult.timetableData.timeBlocks);
    const finalTimetableData: TimetableData = {
      ...llmResult.timetableData,
      timeBlocks: validatedTimeBlocks,
    };

    const processingTime = Date.now() - startTime;

    logInfo('Timetable extraction completed successfully', {
      method,
      entriesExtracted: validatedTimeBlocks.length,
      confidence: llmResult.confidence,
      totalProcessingTime: processingTime,
    });

    return {
      success: true,
      timetableData: finalTimetableData,
      extractedText,
      method,
      confidence: llmResult.confidence,
      processingTime,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logError('Timetable extraction failed', error);

    return {
      success: false,
      extractedText: '',
      method: 'pdf',
      confidence: 0,
      processingTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extract timetable from text directly (useful for testing)
 */
export async function extractTimetableFromText(text: string): Promise<ExtractionResult> {
  const startTime = Date.now();

  try {
    const llmResult = await extractTimetableWithLLM(text);
    const validatedTimeBlocks = validateTimeBlocks(llmResult.timetableData.timeBlocks);
    
    const finalTimetableData: TimetableData = {
      ...llmResult.timetableData,
      timeBlocks: validatedTimeBlocks,
    };

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      timetableData: finalTimetableData,
      extractedText: text,
      method: 'pdf',
      confidence: llmResult.confidence,
      processingTime,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    return {
      success: false,
      extractedText: text,
      method: 'pdf',
      confidence: 0,
      processingTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
