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

import mammoth from "mammoth";
import JSZip from "jszip";
import fs from "fs/promises";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logInfo, logError, logWarn } from "../utils/logger";
import { config } from "../config/env";
import { buildDOCXImageExtractionPrompt } from "./prompts/ocr.prompts";

/**
 * Advanced DOCX Service with AI/ML Support
 *
 * Capabilities:
 * 1. Text-based DOCX: Direct text extraction with mammoth
 * 2. Image-rich DOCX: Extract embedded images → AI Vision
 * 3. Mixed DOCX: Hybrid extraction combining both methods
 *
 * Priority: Direct text extraction for speed, AI Vision for embedded images
 */

export interface DOCXExtractionResult {
  text: string;
  html: string;
  processingTime: number;
  method: "text-extraction" | "ai-vision" | "hybrid";
  confidence: number;
  imagesProcessed?: number;
}

/**
 * Extract text using OpenAI Vision from DOCX images
 */
async function extractWithOpenAIVision(
  imageBuffers: Buffer[]
): Promise<string> {
  try {
    logInfo("🤖 Extracting DOCX images text with OpenAI Vision API");

    if (!config.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    const extractedTexts: string[] = [];

    // Process each image
    for (let i = 0; i < imageBuffers.length; i++) {
      logInfo(
        `Processing image ${i + 1}/${imageBuffers.length} with OpenAI Vision`
      );

      const base64Image = imageBuffers[i].toString("base64");

      // Use standardized prompt from shared module
      const prompt = buildDOCXImageExtractionPrompt(i + 1, imageBuffers.length);

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
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
                    text: prompt,
                  },
                  {
                    type: "image_url",
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
        }
      );

      if (!response.ok) {
        throw new Error(`OpenAI Vision API error: ${response.status}`);
      }

      const data: any = await response.json();
      const imageText = data.choices?.[0]?.message?.content?.trim() || "";
      extractedTexts.push(imageText);
    }

    const fullText = extractedTexts.join("\n\n--- Image Break ---\n\n");
    logInfo("✅ OpenAI Vision DOCX image extraction successful");

    return fullText;
  } catch (error) {
    logError("❌ OpenAI Vision DOCX image extraction failed", error);
    throw error;
  }
}

/**
 * Extract text using Deepseek Vision from DOCX images
 */
async function extractWithDeepseekVision(
  imageBuffers: Buffer[]
): Promise<string> {
  try {
    logInfo("🧠 Extracting DOCX images text with Deepseek Vision API");

    if (!config.env.DEEPSEEK_API_KEY) {
      throw new Error("Deepseek API key not configured");
    }

    const extractedTexts: string[] = [];

    // Process each image
    for (let i = 0; i < imageBuffers.length; i++) {
      logInfo(
        `Processing image ${i + 1}/${imageBuffers.length} with Deepseek Vision`
      );

      const base64Image = imageBuffers[i].toString("base64");

      // Use standardized prompt from shared module
      const prompt = buildDOCXImageExtractionPrompt(i + 1, imageBuffers.length);

      const response = await fetch(
        "https://api.deepseek.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.env.DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: "deepseek-vl",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: prompt,
                  },
                  {
                    type: "image_url",
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
        }
      );

      if (!response.ok) {
        throw new Error(`Deepseek Vision API error: ${response.status}`);
      }

      const data: any = await response.json();
      const imageText = data.choices?.[0]?.message?.content?.trim() || "";
      extractedTexts.push(imageText);
    }

    const fullText = extractedTexts.join("\n\n--- Image Break ---\n\n");
    logInfo("✅ Deepseek Vision DOCX image extraction successful");

    return fullText;
  } catch (error) {
    logError("❌ Deepseek Vision DOCX image extraction failed", error);
    throw error;
  }
}

/**
 * Extract text using Google Gemini Vision from DOCX images
 */
async function extractWithGoogleVision(
  imageBuffers: Buffer[]
): Promise<string> {
  try {
    logInfo("🤖 Extracting DOCX images text with Google Gemini Vision API");

    if (!config.env.GOOGLE_API_KEY) {
      throw new Error("Google API key not configured");
    }

    const genAI = new GoogleGenerativeAI(config.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const extractedTexts: string[] = [];

    // Process each image
    for (let i = 0; i < imageBuffers.length; i++) {
      logInfo(
        `Processing image ${i + 1}/${imageBuffers.length} with Google Vision`
      );

      const base64Image = imageBuffers[i].toString("base64");

      // Use standardized prompt from shared module (same as OpenAI)
      const prompt = buildDOCXImageExtractionPrompt(i + 1, imageBuffers.length);

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: "image/png",
          },
        },
      ]);

      const response = await result.response;
      const imageText = response.text().trim();
      extractedTexts.push(imageText);
    }

    const fullText = extractedTexts.join("\n\n--- Image Break ---\n\n");
    logInfo("✅ Google Vision DOCX image extraction successful");

    return fullText;
  } catch (error) {
    logError("❌ Google Vision DOCX image extraction failed", error);
    throw error;
  }
}

/**
 * Extract embedded images from DOCX file
 */
async function extractImagesFromDOCX(docxPath: string): Promise<Buffer[]> {
  try {
    logInfo("📄 Extracting embedded images from DOCX");

    // Read DOCX file as zip
    const data = await fs.readFile(docxPath);
    const zip = await JSZip.loadAsync(data);

    // Extract images from word/media/ folder
    const imageBuffers: Buffer[] = [];
    const mediaFolder = zip.folder("word/media");

    if (mediaFolder) {
      const imageFiles = Object.keys(zip.files).filter(
        (filename) =>
          filename.startsWith("word/media/") &&
          /\.(png|jpg|jpeg|gif|bmp)$/i.test(filename)
      );

      for (const filename of imageFiles) {
        const file = zip.file(filename);
        if (file) {
          const buffer = await file.async("nodebuffer");
          imageBuffers.push(buffer);
        }
      }
    }

    logInfo(`✅ Extracted ${imageBuffers.length} images from DOCX`);
    return imageBuffers;
  } catch (error) {
    logError("❌ Failed to extract images from DOCX", error);
    return [];
  }
}

/**
 * Extract text from DOCX images using AI Vision
 */
async function extractImagesWithAI(imageBuffers: Buffer[]): Promise<string> {
  try {
    logInfo("🔍 Processing DOCX images with AI Vision");

    let extractedText = "";

    switch (config.env.WHICH_OCR_KEY) {
      case "OPENAI_API_KEY":
        // Try OpenAI Vision first (highest quality)
        if (config.env.OPENAI_API_KEY) {
          try {
            extractedText = await extractWithOpenAIVision(imageBuffers);
            return extractedText;
          } catch (error) {
            logWarn(
              "⚠️ OpenAI Vision failed for DOCX images, trying Deepseek Vision",
              error
            );
          }
        }
        break;
      case "DEEPSEEK_API_KEY":
        // Try Deepseek Vision as second option (cost-effective)
        if (config.env.DEEPSEEK_API_KEY) {
          try {
            extractedText = await extractWithDeepseekVision(imageBuffers);
            return extractedText;
          } catch (error) {
            logWarn(
              "⚠️ Deepseek Vision failed for DOCX images, trying Google Vision",
              error
            );
          }
        }
        break;
      case "GOOGLE_API_KEY":
        // Try Google Vision as third option
        if (config.env.GOOGLE_API_KEY) {
          try {
            extractedText = await extractWithGoogleVision(imageBuffers);
            return extractedText;
          } catch (error) {
            logWarn("⚠️ Google Vision failed for DOCX images", error);
          }
        }
        break;
      default:
    }

    throw new Error("All AI Vision methods failed for DOCX image extraction");
  } catch (error) {
    logError("❌ DOCX image extraction failed", error);
    throw error;
  }
}

/**
 * Extract text from DOCX file with AI-powered capabilities
 *
 * Strategy:
 * 1. Extract text with mammoth (fast, reliable)
 * 2. Check for embedded images
 * 3. If images found, extract text from them with AI Vision (high quality)
 * 4. Combine both extractions (hybrid approach)
 */
export async function extractTextFromDOCX(
  docxPath: string
): Promise<DOCXExtractionResult> {
  const startTime = Date.now();

  try {
    logInfo(`🚀 Starting AI-powered DOCX extraction for: ${docxPath}`);

    // Step 1: Extract text with mammoth (always do this first)
    const textResult = await mammoth.extractRawText({ path: docxPath });
    const htmlResult = await mammoth.convertToHtml({ path: docxPath });

    const textLength = textResult.value.trim().length;

    logInfo("📊 DOCX Analysis", {
      textLength,
      hasText: textLength > 0,
    });

    // Step 2: Check for embedded images
    const imageBuffers = await extractImagesFromDOCX(docxPath);

    let finalText = textResult.value;
    let method: "text-extraction" | "ai-vision" | "hybrid" = "text-extraction";
    let confidence = 90;

    // Step 3: Decide on extraction strategy
    if (imageBuffers.length > 0) {
      logInfo(
        `⚡ Found ${imageBuffers.length} embedded images, using AI Vision`
      );

      try {
        const imageText = await extractImagesWithAI(imageBuffers);

        if (textLength > 50) {
          // Hybrid: Combine text and image extraction
          logInfo("⚡ Using hybrid extraction (text + AI Vision)");
          finalText = `${textResult.value}\n\n--- Embedded Images Text ---\n\n${imageText}`;
          method = "hybrid";
          confidence = 92;
        } else {
          // AI Vision only: Little/no text extracted, images are primary content
          logInfo("⚡ Using AI Vision exclusively (image-based DOCX)");
          finalText = imageText;
          method = "ai-vision";
          confidence = 95;
        }
      } catch (error) {
        logWarn(
          "⚠️ AI Vision extraction failed, using basic text extraction",
          error
        );
        finalText = textResult.value;
        method = "text-extraction";
        confidence = textLength > 50 ? 85 : 50; // Lower confidence if images failed
      }
    } else {
      // Text-based DOCX: No images, direct extraction is sufficient
      logInfo("⚡ No embedded images, using direct text extraction");
      method = "text-extraction";
      confidence = textLength > 50 ? 95 : 70;
    }

    const processingTime = Date.now() - startTime;

    logInfo("✨ DOCX extraction completed", {
      method,
      confidence,
      textLength: finalText.length,
      imagesProcessed: imageBuffers.length,
      processingTime,
    });

    return {
      text: finalText,
      html: htmlResult.value,
      processingTime,
      method,
      confidence,
      imagesProcessed: imageBuffers.length,
    };
  } catch (error) {
    logError("💥 DOCX extraction failed", error);
    throw new Error(
      `DOCX extraction failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Check if file is a DOCX
 */
export function isDOCXFile(mimetype: string): boolean {
  return (
    mimetype.toLowerCase() ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}
