import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { logInfo, logError } from '../utils/logger';

export interface OCRResult {
  text: string;
  confidence: number;
  processingTime: number;
}

/**
 * Extract text from image using Tesseract OCR
 */
export async function extractTextFromImage(imagePath: string): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    logInfo(`Starting OCR extraction for: ${imagePath}`);

    // Preprocess image for better OCR results
    const processedImageBuffer = await preprocessImage(imagePath);

    // Perform OCR
    const result = await Tesseract.recognize(processedImageBuffer, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          logInfo(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const processingTime = Date.now() - startTime;

    logInfo('OCR extraction completed', {
      confidence: result.data.confidence,
      textLength: result.data.text.length,
      processingTime,
    });

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      processingTime,
    };
  } catch (error) {
    logError('OCR extraction failed', error);
    throw new Error(`OCR extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Preprocess image to improve OCR accuracy
 */
async function preprocessImage(imagePath: string): Promise<Buffer> {
  try {
    // Apply image preprocessing:
    // - Convert to grayscale
    // - Increase contrast
    // - Sharpen
    // - Resize if too small
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    let pipeline = image.grayscale().normalize().sharpen();

    // Resize if image is too small (min 1000px width)
    if (metadata.width && metadata.width < 1000) {
      pipeline = pipeline.resize({ width: 1000 });
    }

    return await pipeline.png().toBuffer();
  } catch (error) {
    logError('Image preprocessing failed', error);
    // Return original image if preprocessing fails
    return await sharp(imagePath).toBuffer();
  }
}

/**
 * Extract text from multiple images (for multi-page documents)
 */
export async function extractTextFromImages(imagePaths: string[]): Promise<OCRResult[]> {
  const results: OCRResult[] = [];

  for (const imagePath of imagePaths) {
    try {
      const result = await extractTextFromImage(imagePath);
      results.push(result);
    } catch (error) {
      logError(`Failed to extract text from ${imagePath}`, error);
      results.push({
        text: '',
        confidence: 0,
        processingTime: 0,
      });
    }
  }

  return results;
}

/**
 * Check if file is an image
 */
export function isImageFile(mimetype: string): boolean {
  return ['image/png', 'image/jpeg', 'image/jpg'].includes(mimetype.toLowerCase());
}
