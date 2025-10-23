import * as pdfParse from 'pdf-parse';
import { pdfToPng } from 'pdf-to-png-converter';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';
import { logInfo, logError, logWarn } from '../utils/logger';
import { config } from '../config/env';
import { buildPDFPageExtractionPrompt } from './prompts/ocr.prompts';

/**
 * Advanced PDF Service with AI/ML Support
 * 
 * Capabilities:
 * 1. Text-based PDFs: Direct text extraction with pdf-parse
 * 2. Scanned PDFs: Convert to images → AI Vision (OpenAI/Google)
 * 3. Mixed PDFs: Hybrid extraction combining both methods
 * 
 * Priority: AI Vision for scanned content, direct extraction for text
 */

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
  method: 'text-extraction' | 'ai-vision' | 'hybrid';
  confidence?: number;
}

/**
 * Extract text using OpenAI Vision from PDF images
 */
async function extractWithOpenAIVision(pdfImages: Buffer[]): Promise<string> {
  try {
    logInfo('🤖 Extracting PDF text with OpenAI Vision API');

    if (!config.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const extractedTexts: string[] = [];

    // Process each page
    for (let i = 0; i < pdfImages.length; i++) {
      logInfo(`Processing page ${i + 1}/${pdfImages.length} with OpenAI Vision`);

      const base64Image = pdfImages[i].toString('base64');

      // Use standardized prompt from shared module (same for OpenAI and Google)
      const prompt = buildPDFPageExtractionPrompt(i + 1, pdfImages.length);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/png;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 2000,
          temperature: 0, // Deterministic extraction
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI Vision API error: ${response.status}`);
      }

      const data: any = await response.json();
      const pageText = data.choices?.[0]?.message?.content?.trim() || '';
      extractedTexts.push(pageText);
    }

    const fullText = extractedTexts.join('\n\n--- Page Break ---\n\n');
    logInfo('✅ OpenAI Vision PDF extraction successful');

    return fullText;
  } catch (error) {
    logError('❌ OpenAI Vision PDF extraction failed', error);
    throw error;
  }
}

/**
 * Extract text using Google Gemini Vision from PDF images
 */
async function extractWithGoogleVision(pdfImages: Buffer[]): Promise<string> {
  try {
    logInfo('🤖 Extracting PDF text with Google Gemini Vision API');

    if (!config.env.GOOGLE_API_KEY) {
      throw new Error('Google API key not configured');
    }

    const genAI = new GoogleGenerativeAI(config.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const extractedTexts: string[] = [];

    // Process each page
    for (let i = 0; i < pdfImages.length; i++) {
      logInfo(`Processing page ${i + 1}/${pdfImages.length} with Google Vision`);

      const base64Image = pdfImages[i].toString('base64');

      // Use standardized prompt from shared module (same as OpenAI)
      const prompt = buildPDFPageExtractionPrompt(i + 1, pdfImages.length);

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/png',
          },
        },
      ]);

      const response = await result.response;
      const pageText = response.text().trim();
      extractedTexts.push(pageText);
    }

    const fullText = extractedTexts.join('\n\n--- Page Break ---\n\n');
    logInfo('✅ Google Vision PDF extraction successful');

    return fullText;
  } catch (error) {
    logError('❌ Google Vision PDF extraction failed', error);
    throw error;
  }
}

/**
 * Convert PDF to images for AI vision processing
 */
async function convertPDFToImages(pdfPath: string): Promise<Buffer[]> {
  try {
    logInfo('📄 Converting PDF to images for AI vision');

    // Create temporary directory for images
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-images-'));

    // Convert PDF to PNG images
    const pngPages = await pdfToPng(pdfPath, {
      outputFolder: tempDir,
      // Process all pages by default
    });

    // Read all generated images
    const imageBuffers: Buffer[] = [];
    for (const page of pngPages) {
      const imageBuffer = await fs.readFile(page.path);
      imageBuffers.push(imageBuffer);
    }

    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });

    logInfo(`✅ Converted ${imageBuffers.length} PDF pages to images`);
    return imageBuffers;
  } catch (error) {
    logError('❌ PDF to image conversion failed', error);
    throw error;
  }
}

/**
 * Extract text from PDF using AI Vision (for scanned PDFs)
 */
async function extractScannedPDFWithAI(pdfPath: string): Promise<string> {
  try {
    logInfo('🔍 Processing scanned PDF with AI Vision');

    // Convert PDF pages to images
    const pdfImages = await convertPDFToImages(pdfPath);

    let extractedText = '';

    // Try OpenAI Vision first
    if (config.env.OPENAI_API_KEY) {
      try {
        extractedText = await extractWithOpenAIVision(pdfImages);
        return extractedText;
      } catch (error) {
        logWarn('⚠️ OpenAI Vision failed for PDF, trying Google Vision', error);
      }
    }

    // Try Google Vision as fallback
    if (config.env.GOOGLE_API_KEY) {
      try {
        extractedText = await extractWithGoogleVision(pdfImages);
        return extractedText;
      } catch (error) {
        logWarn('⚠️ Google Vision failed for PDF', error);
      }
    }

    throw new Error('All AI Vision methods failed for scanned PDF extraction');
  } catch (error) {
    logError('❌ Scanned PDF extraction failed', error);
    throw error;
  }
}

/**
 * Extract text from PDF file with AI-powered capabilities
 * 
 * Strategy:
 * 1. Try direct text extraction first (fast, free)
 * 2. If PDF is scanned/image-based, use AI Vision (high quality)
 * 3. For mixed PDFs, combine both methods (hybrid)
 */
export async function extractTextFromPDF(pdfPath: string): Promise<PDFExtractionResult> {
  const startTime = Date.now();

  try {
    logInfo(`🚀 Starting AI-powered PDF extraction for: ${pdfPath}`);

    // Read PDF file
    const dataBuffer = fsSync.readFileSync(pdfPath);

    // Parse PDF with pdf-parse
    // @ts-ignore - pdf-parse types issue
    const pdfData = await pdfParse(dataBuffer);

    const textLength = pdfData.text.trim().length;
    const textDensity = textLength / pdfData.numpages;

    logInfo('📊 PDF Analysis', {
      numPages: pdfData.numpages,
      textLength,
      textDensity: textDensity.toFixed(2),
    });

    let finalText = '';
    let method: 'text-extraction' | 'ai-vision' | 'hybrid' = 'text-extraction';
    let confidence = 85;

    // Decision: Is this a scanned PDF or text-based?
    if (textDensity < 50) {
      // Scanned PDF (low text density) - Use AI Vision
      logInfo('⚡ Detected scanned PDF, using AI Vision extraction');
      try {
        finalText = await extractScannedPDFWithAI(pdfPath);
        method = 'ai-vision';
        confidence = 95;
      } catch (error) {
        logWarn('⚠️ AI Vision extraction failed, using basic text extraction', error);
        finalText = pdfData.text;
        method = 'text-extraction';
        confidence = 50; // Low confidence for scanned PDF with basic extraction
      }
    } else if (textDensity < 200 && textDensity >= 50) {
      // Mixed PDF (medium text density) - Try hybrid approach
      logInfo('⚡ Detected mixed PDF, using hybrid extraction');
      try {
        const aiText = await extractScannedPDFWithAI(pdfPath);
        // Combine both extractions
        finalText = `${pdfData.text}\n\n--- AI Enhanced Extraction ---\n\n${aiText}`;
        method = 'hybrid';
        confidence = 90;
      } catch (error) {
        logWarn('⚠️ AI Vision extraction failed, using basic text extraction', error);
        finalText = pdfData.text;
        method = 'text-extraction';
        confidence = 70;
      }
    } else {
      // Text-based PDF (high text density) - Direct extraction is sufficient
      logInfo('⚡ Detected text-based PDF, using direct extraction');
      finalText = pdfData.text;
      method = 'text-extraction';
      confidence = 95;
    }

    const processingTime = Date.now() - startTime;

    logInfo('✨ PDF extraction completed', {
      method,
      confidence,
      textLength: finalText.length,
      processingTime,
    });

    return {
      text: finalText,
      numPages: pdfData.numpages,
      metadata: {
        title: pdfData.info?.Title,
        author: pdfData.info?.Author,
        subject: pdfData.info?.Subject,
        creator: pdfData.info?.Creator,
      },
      processingTime,
      method,
      confidence,
    };
  } catch (error) {
    logError('💥 PDF extraction failed', error);
    throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if PDF is scanned (image-based) or text-based
 * This is a heuristic check based on text density
 */
export async function isPDFScanned(pdfPath: string): Promise<boolean> {
  try {
    // Read PDF file
    const dataBuffer = fsSync.readFileSync(pdfPath);
    
    // @ts-ignore - pdf-parse types issue
    const pdfData = await pdf(dataBuffer);
    
    // Calculate text density
    const textDensity = pdfData.text.trim().length / pdfData.numpages;
    
    // Less than 50 characters per page suggests it's scanned
    const isScanned = textDensity < 50;
    
    logInfo(`PDF scan check: ${isScanned ? 'Scanned' : 'Text-based'}`, {
      textDensity: textDensity.toFixed(2),
      threshold: 50,
    });
    
    return isScanned;
  } catch (error) {
    logError('Failed to check if PDF is scanned', error);
    return true; // Assume scanned if check fails (will trigger AI Vision)
  }
}

/**
 * Check if file is a PDF
 */
export function isPDFFile(mimetype: string): boolean {
  return mimetype.toLowerCase() === 'application/pdf';
}
