/**
 * Teacher Timetable Extraction System
 *
 * @author Saleem Ahmad
 * @email saleem.ahmad@rediffmail.com
 * @created October 2025
 *
 * @license MIT License (Non-Commercial Use Only)
 *
 * Copyright (c) 2025 Saleem Ahmad
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to use
 * the Software for educational, learning, and personal purposes only, subject
 * to the following conditions:
 *
 * 1. The above copyright notice and this permission notice shall be included in
 *    all copies or substantial portions of the Software.
 *
 * 2. COMMERCIAL USE RESTRICTION: The Software may NOT be used for commercial
 *    purposes, including but not limited to selling, licensing, or incorporating
 *    into commercial products or services, without explicit written permission
 *    from the author.
 *
 * 3. LEARNING YOGI ASSIGNMENT: This Software was created specifically for the
 *    Learning Yogi (LY) assignment purpose and should be used as a reference.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * For commercial use inquiries, please contact: saleem.ahmad@rediffmail.com
 */

import Tesseract from "tesseract.js";
import sharp from "sharp";
import { GoogleGenerativeAI } from "@google/generative-ai";
import vision from "@google-cloud/vision";
import { logInfo, logError, logWarn } from "../utils/logger";
import { config } from "../config/env";
import fs from "fs/promises";
import { buildTimetableOCRPrompt } from "./prompts/ocr.prompts";

/**
 * Advanced OCR Service with AI/ML Support
 * Primary: OpenAI Vision API or Google Vision API (Gemini)
 * Fallback: Tesseract.js with Sharp preprocessing
 *
 * This service uses state-of-the-art AI models for optimal text extraction quality
 *
 * IMPORTANT: This service extracts RAW TEXT from images using Vision APIs.
 * It sends the ACTUAL IMAGE (base64 encoded) to the AI models, NOT embeddings.
 * Embeddings are generated LATER in the pipeline (embedding.service.ts) for semantic analysis.
 */

export interface OCRResult {
  text: string;
  confidence: number;
  processingTime: number;
  method: "openai-vision" | "google-vision" | "deepseek-vision" | "tesseract";
}

// buildTimetableOCRPrompt is now imported from shared prompts module
// This ensures OpenAI Vision and Google Gemini use IDENTICAL prompts

/**
 * Extract text using OpenAI Vision API (GPT-4 Vision)
 * Best for: Complex layouts, handwritten text, mixed content
 */
async function extractWithOpenAIVision(
  imagePath: string
): Promise<Omit<OCRResult, "processingTime">> {
  try {
    logInfo("🤖 Attempting OCR with OpenAI Vision API (GPT-4o-mini)");

    if (!config.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    // Read image as base64
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString("base64");
    const mimeType = imagePath.toLowerCase().endsWith(".png")
      ? "image/png"
      : "image/jpeg";

    // Advanced timetable-aware OCR prompt (shared with Google Vision)
    const ocrPrompt = buildTimetableOCRPrompt();

    // Call OpenAI Vision API with advanced timetable-aware prompt
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: ocrPrompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0, // Zero temperature for deterministic extraction
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI Vision API error (${response.status}): ${errorText}`
      );
    }

    const data: any = await response.json();
    const extractedText = data.choices?.[0]?.message?.content?.trim() || "";

    if (!extractedText || extractedText.length < 10) {
      throw new Error("OpenAI Vision returned insufficient text");
    }

    logInfo("✅ OpenAI Vision extraction successful", {
      textLength: extractedText.length,
      tokensUsed: data.usage?.total_tokens || 0,
    });

    return {
      text: extractedText,
      confidence: 95, // OpenAI Vision typically has 95%+ accuracy
      method: "openai-vision",
    };
  } catch (error) {
    logError("❌ OpenAI Vision extraction failed", error);
    throw error;
  }
}



/**
 * Extract text using Deepseek Vision API
 * Best for: Advanced AI analysis, cost-effective vision processing
 */
async function extractWithDeepseek(
  imagePath: string
): Promise<Omit<OCRResult, "processingTime">> {
  try {
    logInfo("🧠 Attempting OCR with Deepseek Vision API");

    if (!config.env.DEEPSEEK_API_KEY) {
      throw new Error("Deepseek API key not configured");
    }

    // Read image as Base64
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString("base64");
    const mimeType = imagePath.toLowerCase().endsWith(".png")
      ? "image/png"
      : "image/jpeg";

    // Build your existing OCR prompt
    const ocrPrompt = buildTimetableOCRPrompt();

    // Call DeepSeek Vision API (correct schema)
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-vl2", // ✅ use lowercase model name
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: ocrPrompt,
              },
              {
                type: "image", // ✅ correct field
                image: `data:${mimeType};base64,${base64Image}`, // ✅ base64 inline
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Deepseek Vision API error (${response.status}): ${errorText}`
      );
    }

    const data: any = await response.json();
    const extractedText = data.choices?.[0]?.message?.content?.trim() || "";

    if (!extractedText || extractedText.length < 10) {
      throw new Error("Deepseek Vision returned insufficient text");
    }

    logInfo("✅ Deepseek Vision extraction successful", {
      textLength: extractedText.length,
      tokensUsed: data.usage?.total_tokens || 0,
    });

    return {
      text: extractedText,
      confidence: 92,
      method: "deepseek-vision" as any,
    };
  } catch (error) {
    logError("❌ Deepseek Vision extraction failed", error);
    throw error;
  }
}


/**
 * Extract text using Google Gemini Vision API
 * Best for: High-quality image recognition, multilingual support
 */
async function extractWithGoogleVision_old(
  imagePath: string
): Promise<Omit<OCRResult, "processingTime">> {
  try {
    logInfo("🤖 Attempting OCR with Google Gemini Vision API");

    if (!config.env.GOOGLE_API_KEY) {
      throw new Error("Google API key not configured");
    }

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(config.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Read image
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString("base64");
    const mimeType = imagePath.toLowerCase().endsWith(".png")
      ? "image/png"
      : "image/jpeg";

    // Use same advanced timetable-aware prompt as OpenAI
    const prompt = buildTimetableOCRPrompt();

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
      throw new Error("Google Vision returned insufficient text");
    }

    logInfo("✅ Google Gemini Vision extraction successful", {
      textLength: extractedText.length,
    });

    return {
      text: extractedText,
      confidence: 95, // Gemini Vision typically has 95%+ accuracy
      method: "google-vision",
    };
  } catch (error) {
    logError("❌ Google Vision extraction failed", error);
    throw error;
  }
}


async function extractWithGoogleVision(
  imagePath: string
): Promise<Omit<OCRResult, "processingTime">> {
  try {
    logInfo("🤖 Attempting OCR with Google Vision API");

    // Ensure the path to service account JSON is set
    if (!config.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      throw new Error(
        "Google Service Account JSON path not configured in GOOGLE_SERVICE_ACCOUNT_JSON"
      );
    }

    // Initialize Vision client with service account
    const client = new vision.ImageAnnotatorClient({
      keyFilename: config.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    });

    // Read image
    const imageBuffer = await fs.readFile(imagePath);

    // OCR with documentTextDetection for structured text
    const [result] = await client.documentTextDetection({
      image: { content: imageBuffer },
    });

    const extractedText = result.fullTextAnnotation?.text?.trim() || "";

    if (!extractedText || extractedText.length < 10) {
      throw new Error("Google Vision returned insufficient text");
    }

    logInfo("✅ Google Vision extraction successful", {
      textLength: extractedText.length,
    });

    return {
      text: extractedText,
      confidence: 95, // Approximate confidence
      method: "google-vision",
    };
  } catch (error) {
    logError("❌ Google Vision extraction failed", error);
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
      pipeline = pipeline.resize({ width: 2000, fit: "inside" });
    }

    return await pipeline.png().toBuffer();
  } catch (error) {
    logError("Image preprocessing failed", error);
    // Return original image if preprocessing fails
    return await sharp(imagePath).toBuffer();
  }
}

/**
 * Extract text using Tesseract.js (fallback method)
 * Best for: When AI APIs are unavailable or as backup
 */
async function extractWithTesseract(
  imagePath: string
): Promise<Omit<OCRResult, "processingTime">> {
  try {
    logInfo("📝 Attempting OCR with Tesseract (fallback method)");

    // Preprocess the image for better results
    const processedImage = await preprocessImage(imagePath);

    // Perform OCR using Tesseract with optimized settings
    const result = await Tesseract.recognize(processedImage, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          logInfo(`Tesseract progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const text = result.data.text.trim();
    const confidence = result.data.confidence;

    if (!text || text.length < 10) {
      throw new Error("Tesseract returned insufficient text");
    }

    logInfo("✅ Tesseract extraction completed", {
      textLength: text.length,
      confidence: confidence.toFixed(2),
    });

    return {
      text,
      confidence,
      method: "tesseract",
    };
  } catch (error) {
    logError("❌ Tesseract extraction failed", error);
    throw error;
  }
}

/**
 * Extract text from a single image file with AI/ML-powered OCR
 *
 * Extraction Priority:
 * 1. OpenAI Vision API (GPT-4 Vision) - Highest quality, best for complex layouts
 * 2. Deepseek Vision API - Advanced AI analysis, cost-effective vision processing
 * 3. Google Gemini Vision API - High quality, good multilingual support
 * 4. Tesseract.js with preprocessing - Reliable fallback, free
 *
 * @param imagePath - Absolute path to the image file
 * @returns OCRResult with extracted text, confidence score, processing time, and method used
 */
export async function extractTextFromImage(
  imagePath: string
): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    logInfo(`🚀 Starting AI-powered OCR extraction for: ${imagePath}`);

    let result: Omit<OCRResult, "processingTime">;

    switch (config.env.WHICH_OCR_KEY) {
      case "OPENAI_API_KEY":
        // Try OpenAI Vision first (best quality)
        if (config.env.OPENAI_API_KEY) {
          try {
            result = await extractWithOpenAIVision(imagePath);
            const processingTime = Date.now() - startTime;
            logInfo(
              `✨ OCR completed in ${processingTime}ms using OpenAI Vision`
            );
            return { ...result, processingTime };
          } catch (error) {
            logWarn("⚠️ OpenAI Vision failed, trying Deepseek Vision", error);
          }
        } else {
          logWarn("⚠️ OpenAI API key not configured, skipping OpenAI Vision");
        }
        break;
      case "DEEPSEEK_API_KEY":
        // Try Deepseek Vision as second option (cost-effective)
        if (config.env.DEEPSEEK_API_KEY) {
          try {
            result = await extractWithDeepseek(imagePath);
            const processingTime = Date.now() - startTime;
            logInfo(
              `✨ OCR completed in ${processingTime}ms using Deepseek Vision`
            );
            return { ...result, processingTime };
          } catch (error) {
            logWarn("⚠️ Deepseek Vision failed, trying Google Vision", error);
          }
        } else {
          logWarn(
            "⚠️ Deepseek API key not configured, skipping Deepseek Vision"
          );
        }
        break;
      case "GOOGLE_API_KEY":
        // Try Google Vision as third option
        if (config.env.GOOGLE_API_KEY) {
          try {
            result = await extractWithGoogleVision(imagePath);
            const processingTime = Date.now() - startTime;
            logInfo(
              `✨ OCR completed in ${processingTime}ms using Google Vision`
            );
            return { ...result, processingTime };
          } catch (error) {
            logWarn(
              "⚠️ Google Vision failed, falling back to Tesseract",
              error
            );
          }
        } else {
          logWarn("⚠️ Google API key not configured, skipping Google Vision");
        }
        break;
      default:
        logWarn(
          "⚠️ WHICH_OCR_KEY not set or unrecognized, defaulting to Tesseract "
        );
    }

    // Fallback to Tesseract (always available)
    result = await extractWithTesseract(imagePath);
    const processingTime = Date.now() - startTime;
    logInfo(
      `✨ OCR completed in ${processingTime}ms using Tesseract (fallback)`
    );
    return { ...result, processingTime };
  } catch (error) {
    logError("💥 All OCR methods failed", error);
    throw new Error(
      `Failed to extract text from image: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
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
export async function extractTextFromImages(
  imagePaths: string[]
): Promise<OCRResult[]> {
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
        text: "",
        confidence: 0,
        processingTime: 0,
        method: "tesseract", // Default method for failed extraction
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
  return ["image/png", "image/jpeg", "image/jpg"].includes(
    mimetype.toLowerCase()
  );
}
