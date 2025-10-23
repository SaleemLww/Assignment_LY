import { extractTextFromImage, isImageFile } from "./ocr.service";
import { extractTextFromPDF, isPDFFile } from "./pdf.service";
import { extractTextFromDOCX, isDOCXFile } from "./docx.service";
import {
  extractTimetableWithLLM,
  validateTimeBlocks,
  type TimetableData,
} from "./llm.service";
import { intelligentExtraction } from "./intelligent/intelligent.service";
import { config } from "../config/env";
import { logInfo, logError } from "../utils/logger";

export interface ExtractionResult {
  success: boolean;
  timetableData?: TimetableData;
  extractedText: string;
  method: "ocr" | "pdf" | "docx" | "hybrid";
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
    logInfo("Starting timetable extraction", { filePath, mimeType });

    let extractedText = "";
    let method: "ocr" | "pdf" | "docx" | "hybrid" = "pdf";

    // Step 2: Use Intelligent Agent or Simple LLM for structuring
    const useAgenticWorkflow = config.env.USE_AGENTIC_WORKFLOW;
    logInfo(
      `Using ${useAgenticWorkflow ? "AGENTIC" : "SIMPLE"} extraction mode`
    );

    let timetableData: TimetableData;
    let confidence: number;

    if (useAgenticWorkflow) {
      // Use intelligent agent-based extraction (default)
      logInfo("Starting intelligent agent-based structuring");
      const agentResult = await intelligentExtraction(
        'ocr',
        filePath
      );

      timetableData = agentResult;
      confidence = agentResult.metadata?.enhancedConfidence || 85;

      logInfo("Agent-based extraction completed", {
        mode: agentResult.metadata?.extractionMode,
        toolsUsed: agentResult.metadata?.agentToolsUsed,
        confidence,
      });
    } else {
      // Step 1: Extract text based on file type
      if (isImageFile(mimeType)) {
        // Image files -> OCR with AI/ML (OpenAI Vision, Google Vision, or Tesseract)
        logInfo("Processing as image file (AI-powered OCR)");
        const ocrResult = await extractTextFromImage(filePath);
        extractedText = ocrResult.text;
        method = "ocr";
        logInfo(`OCR extraction completed using: ${ocrResult.method}`, {
          confidence: ocrResult.confidence,
          processingTime: ocrResult.processingTime,
        });
      } else if (isPDFFile(mimeType)) {
        // PDF files -> AI-powered extraction (auto-detects scanned/text-based/mixed)
        logInfo("Processing as PDF file (AI-powered extraction)");
        const pdfResult = await extractTextFromPDF(filePath);
        extractedText = pdfResult.text;

        // Map PDF extraction method to our method enum
        if (pdfResult.method === "ai-vision") {
          method = "hybrid";
          logInfo(`PDF extraction completed using AI Vision`, {
            confidence: pdfResult.confidence,
            processingTime: pdfResult.processingTime,
          });
        } else if (pdfResult.method === "hybrid") {
          method = "hybrid";
          logInfo(`PDF extraction completed using Hybrid approach`, {
            confidence: pdfResult.confidence,
            processingTime: pdfResult.processingTime,
          });
        } else {
          method = "pdf";
          logInfo(`PDF extraction completed using direct text extraction`, {
            confidence: pdfResult.confidence,
            processingTime: pdfResult.processingTime,
          });
        }
      } else if (isDOCXFile(mimeType)) {
        // DOCX files -> AI-powered extraction (auto-detects embedded images)
        logInfo("Processing as DOCX file (AI-powered extraction)");
        const docxResult = await extractTextFromDOCX(filePath);
        extractedText = docxResult.text;

        // Map DOCX extraction method to our method enum
        if (docxResult.method === "ai-vision") {
          method = "hybrid";
          logInfo(`DOCX extraction completed using AI Vision (image-based)`, {
            confidence: docxResult.confidence,
            imagesProcessed: docxResult.imagesProcessed,
            processingTime: docxResult.processingTime,
          });
        } else if (docxResult.method === "hybrid") {
          method = "hybrid";
          logInfo(
            `DOCX extraction completed using Hybrid approach (text + images)`,
            {
              confidence: docxResult.confidence,
              imagesProcessed: docxResult.imagesProcessed,
              processingTime: docxResult.processingTime,
            }
          );
        } else {
          method = "docx";
          logInfo(`DOCX extraction completed using direct text extraction`, {
            confidence: docxResult.confidence,
            processingTime: docxResult.processingTime,
          });
        }
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      // Check if we got any text
      if (!extractedText || extractedText.trim().length < 10) {
        throw new Error("Insufficient text extracted from document");
      }

      logInfo("Text extraction completed", {
        method,
        textLength: extractedText.length,
      });

      // Use simple LLM extraction (legacy)
      logInfo("Starting LLM-based structuring");
      const llmResult = await extractTimetableWithLLM(extractedText);
      timetableData = llmResult.timetableData;
      confidence = llmResult.confidence;
    }

    // Step 3: Validate extracted time blocks
    const validatedTimeBlocks = validateTimeBlocks(timetableData.timeBlocks);
    const finalTimetableData: TimetableData = {
      ...timetableData,
      timeBlocks: validatedTimeBlocks,
    };

    const processingTime = Date.now() - startTime;

    logInfo("Timetable extraction completed successfully", {
      method,
      entriesExtracted: validatedTimeBlocks.length,
      confidence: confidence,
      totalProcessingTime: processingTime,
    });

    return {
      success: true,
      timetableData: finalTimetableData,
      extractedText,
      method,
      confidence: confidence,
      processingTime,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logError("Timetable extraction failed", error);

    return {
      success: false,
      extractedText: "",
      method: "pdf",
      confidence: 0,
      processingTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Extract timetable from text directly (useful for testing)
 */
export async function extractTimetableFromText(
  text: string
): Promise<ExtractionResult> {
  const startTime = Date.now();

  try {
    const llmResult = await extractTimetableWithLLM(text);
    const validatedTimeBlocks = validateTimeBlocks(
      llmResult.timetableData.timeBlocks
    );

    const finalTimetableData: TimetableData = {
      ...llmResult.timetableData,
      timeBlocks: validatedTimeBlocks,
    };

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      timetableData: finalTimetableData,
      extractedText: text,
      method: "pdf",
      confidence: llmResult.confidence,
      processingTime,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;

    return {
      success: false,
      extractedText: text,
      method: "pdf",
      confidence: 0,
      processingTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
