import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logInfo, logError, logWarn } from '../utils/logger';
import { config } from '../config/env';
import fs from 'fs/promises';

/**
 * Advanced OCR Service with AI/ML Support
 * Primary: OpenAI Vision API or Google Vision API (Gemini)
 * Fallback: Tesseract.js with Sharp preprocessing
 * 
 * This service uses state-of-the-art AI models for optimal text extraction quality
 */

export interface OCRResult {
  text: string;
  confidence: number;
  processingTime: number;
  method: 'openai-vision' | 'google-vision' | 'tesseract';
}

/**
 * Extract text using OpenAI Vision API (GPT-4 Vision)
 * Best for: Complex layouts, handwritten text, mixed content
 */
async function extractWithOpenAIVision(imagePath: string): Promise<Omit<OCRResult, 'processingTime'>> {
  try {
    logInfo('🤖 Attempting OCR with OpenAI Vision API (GPT-4o-mini)');

    if (!config.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Read image as base64
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    // Call OpenAI Vision API with specialized prompt for timetables
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
                text: `Extract ALL text from this image with high accuracy. This appears to be a timetable or schedule document.

Instructions:
- Extract every piece of text visible in the image
- Maintain the original structure, formatting, and layout
- Preserve line breaks and spacing
- Include day names, times, subjects, locations, and any other text
- Return ONLY the extracted text without any commentary or explanation
- If text is unclear, include it anyway with [?] notation`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.1, // Lower temperature for more deterministic extraction
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI Vision API error (${response.status}): ${errorText}`);
    }

    const data: any = await response.json();
    const extractedText = data.choices?.[0]?.message?.content?.trim() || '';

    if (!extractedText || extractedText.length < 10) {
      throw new Error('OpenAI Vision returned insufficient text');
    }

    logInfo('✅ OpenAI Vision extraction successful', {
      textLength: extractedText.length,
      tokensUsed: data.usage?.total_tokens || 0,
    });

    return {
      text: extractedText,
      confidence: 95, // OpenAI Vision typically has 95%+ accuracy
      method: 'openai-vision',
    };
  } catch (error) {
    logError('❌ OpenAI Vision extraction failed', error);
    throw error;
  }
}

/**
 * Extract text using Google Gemini Vision API
 * Best for: High-quality image recognition, multilingual support
 */
async function extractWithGoogleVision(imagePath: string): Promise<Omit<OCRResult, 'processingTime'>> {
  try {
    logInfo('🤖 Attempting OCR with Google Gemini Vision API');

    if (!config.env.GOOGLE_API_KEY) {
      throw new Error('Google API key not configured');
    }

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(config.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Read image
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    // Create specialized prompt for timetables
    const prompt = `Extract ALL text from this image with high accuracy. This appears to be a timetable or schedule document.

Instructions:
- Extract every piece of text visible in the image
- Maintain the original structure, formatting, and layout
- Preserve line breaks and spacing
- Include day names, times, subjects, locations, and any other text
- Return ONLY the extracted text without any commentary or explanation
- If text is unclear, include it anyway with [?] notation`;

    // Generate content with vision
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ]);

    const response = await result.response;
    const extractedText = response.text().trim();

    if (!extractedText || extractedText.length < 10) {
      throw new Error('Google Vision returned insufficient text');
    }

    logInfo('✅ Google Gemini Vision extraction successful', {
      textLength: extractedText.length,
    });

    return {
      text: extractedText,
      confidence: 95, // Gemini Vision typically has 95%+ accuracy
      method: 'google-vision',
    };
  } catch (error) {
    logError('❌ Google Vision extraction failed', error);
    throw error;
  }
}

/**
 * Preprocess image to improve OCR accuracy (Tesseract fallback)
 * Applies multiple enhancement techniques for optimal text recognition
 */
async function preprocessImage(imagePath: string): Promise<Buffer> {
  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    let pipeline = image
      .grayscale() // Convert to grayscale for better text contrast
      .normalize() // Normalize histogram for better contrast
      .sharpen() // Sharpen edges for clearer text
      .threshold(128); // Apply binary threshold for better text separation

    // Resize if image is too small (optimal: 1500-2500px width)
    if (metadata.width && metadata.width < 1500) {
      pipeline = pipeline.resize({ width: 2000, fit: 'inside' });
    }

    return await pipeline.png().toBuffer();
  } catch (error) {
    logError('Image preprocessing failed', error);
    // Return original image if preprocessing fails
    return await sharp(imagePath).toBuffer();
  }
}

/**
 * Extract text using Tesseract.js (fallback method)
 * Best for: When AI APIs are unavailable or as backup
 */
async function extractWithTesseract(imagePath: string): Promise<Omit<OCRResult, 'processingTime'>> {
  try {
    logInfo('📝 Attempting OCR with Tesseract (fallback method)');

    // Preprocess the image for better results
    const processedImage = await preprocessImage(imagePath);

    // Perform OCR using Tesseract with optimized settings
    const result = await Tesseract.recognize(processedImage, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          logInfo(`Tesseract progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const text = result.data.text.trim();
    const confidence = result.data.confidence;

    if (!text || text.length < 10) {
      throw new Error('Tesseract returned insufficient text');
    }

    logInfo('✅ Tesseract extraction completed', {
      textLength: text.length,
      confidence: confidence.toFixed(2),
    });

    return {
      text,
      confidence,
      method: 'tesseract',
    };
  } catch (error) {
    logError('❌ Tesseract extraction failed', error);
    throw error;
  }
}

/**
 * Extract text from a single image file with AI/ML-powered OCR
 * 
 * Extraction Priority:
 * 1. OpenAI Vision API (GPT-4 Vision) - Highest quality, best for complex layouts
 * 2. Google Gemini Vision API - High quality, good multilingual support
 * 3. Tesseract.js with preprocessing - Reliable fallback, free
 * 
 * @param imagePath - Absolute path to the image file
 * @returns OCRResult with extracted text, confidence score, processing time, and method used
 */
export async function extractTextFromImage(imagePath: string): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    logInfo(`🚀 Starting AI-powered OCR extraction for: ${imagePath}`);

    let result: Omit<OCRResult, 'processingTime'>;

    // Try OpenAI Vision first (best quality)
    if (config.env.OPENAI_API_KEY) {
      try {
        result = await extractWithOpenAIVision(imagePath);
        const processingTime = Date.now() - startTime;
        logInfo(`✨ OCR completed in ${processingTime}ms using OpenAI Vision`);
        return { ...result, processingTime };
      } catch (error) {
        logWarn('⚠️ OpenAI Vision failed, trying Google Vision', error);
      }
    } else {
      logWarn('⚠️ OpenAI API key not configured, skipping OpenAI Vision');
    }

    // Try Google Vision as second option
    if (config.env.GOOGLE_API_KEY) {
      try {
        result = await extractWithGoogleVision(imagePath);
        const processingTime = Date.now() - startTime;
        logInfo(`✨ OCR completed in ${processingTime}ms using Google Vision`);
        return { ...result, processingTime };
      } catch (error) {
        logWarn('⚠️ Google Vision failed, falling back to Tesseract', error);
      }
    } else {
      logWarn('⚠️ Google API key not configured, skipping Google Vision');
    }

    // Fallback to Tesseract (always available)
    result = await extractWithTesseract(imagePath);
    const processingTime = Date.now() - startTime;
    logInfo(`✨ OCR completed in ${processingTime}ms using Tesseract (fallback)`);
    return { ...result, processingTime };
  } catch (error) {
    logError('💥 All OCR methods failed', error);
    throw new Error(
      `Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Extract text from multiple images (for multi-page documents)
 * Each image is processed independently with the best available method
 * 
 * @param imagePaths - Array of absolute paths to image files
 * @returns Array of OCRResults for each image
 */
export async function extractTextFromImages(imagePaths: string[]): Promise<OCRResult[]> {
  logInfo(`📚 Processing ${imagePaths.length} images with AI-powered OCR`);
  
  const results: OCRResult[] = [];

  for (let i = 0; i < imagePaths.length; i++) {
    const imagePath = imagePaths[i];
    try {
      logInfo(`Processing image ${i + 1}/${imagePaths.length}: ${imagePath}`);
      const result = await extractTextFromImage(imagePath);
      results.push(result);
    } catch (error) {
      logError(`Failed to extract text from ${imagePath}`, error);
      results.push({
        text: '',
        confidence: 0,
        processingTime: 0,
        method: 'tesseract', // Default method for failed extraction
      });
    }
  }

  logInfo(`✅ Completed batch OCR: ${results.length} images processed`);
  return results;
}

/**
 * Check if file is an image
 * @param mimetype - MIME type of the file
 * @returns true if file is a supported image format
 */
export function isImageFile(mimetype: string): boolean {
  return ['image/png', 'image/jpeg', 'image/jpg'].includes(mimetype.toLowerCase());
}
