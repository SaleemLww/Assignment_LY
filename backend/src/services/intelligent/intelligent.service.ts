/**
 * Intelligent Two-Agent Extraction System
 * 
 * PURE AGENTIC WORKFLOW - No fallbacks, no simple LLM modes
 * 
 * Architecture:
 * 1. EXTRACTION AGENT: Takes file path → Performs OCR/PDF/DOCX extraction → Returns raw text
 * 2. ANALYSIS & GENERATION AGENT: Takes raw text → Embeddings → Semantic analysis → LLM structuring → Returns final timetable
 */

import { type TimetableExtractionResult } from '../llm.service';
import { logInfo, logError } from '../../utils/logger';
import { runExtractionAgent } from './extraction.agent';
import { runAnalysisAgent } from './analysis.agent';

/**
 * Main intelligent extraction function
 * Orchestrates the two-agent workflow
 * 
 * @param extractionMethod - The extraction method to use ('ocr', 'pdf', or 'docx')
 * @param filePath - Absolute path to the file to extract from
 * @returns Complete timetable extraction result with metadata
 */
export async function intelligentExtraction(
  extractionMethod: 'ocr' | 'pdf' | 'docx',
  filePath: string
): Promise<TimetableExtractionResult> {
  const startTime = Date.now();
  
  logInfo('🚀 Starting TWO-AGENT INTELLIGENT EXTRACTION SYSTEM', {
    method: extractionMethod,
    filePath,
  });
  
  // ============================================================
  // AGENT 1: EXTRACTION AGENT
  // Responsibility: File → Raw Text Extraction
  // ============================================================
  logInfo('📤 AGENT 1: Starting Extraction Agent');
  const extractionResult = await runExtractionAgent(extractionMethod, filePath);
  
  if (!extractionResult.success) {
    throw new Error(extractionResult.error || 'Extraction agent failed');
  }
  
  logInfo('✅ AGENT 1 Complete: Text extracted', {
    textLength: extractionResult.extractedText.length,
    confidence: extractionResult.confidence,
    method: extractionResult.method,
    embeddingsUsed: extractionResult.embeddingsMetadata?.embeddingsGenerated || false,
    qualityScore: extractionResult.embeddingsMetadata?.qualityScore || extractionResult.confidence,
  });
  
  // ============================================================
  // AGENT 2: ANALYSIS & GENERATION AGENT
  // Responsibility: Raw Text → Structured Timetable
  // ============================================================
  logInfo('🧠 AGENT 2: Starting Analysis & Generation Agent');
  const analysisResult = await runAnalysisAgent(
    extractionResult.extractedText,
    extractionResult.confidence,
    extractionResult.method
  );
  
  if (!analysisResult.success) {
    throw new Error(analysisResult.error || 'Analysis agent failed');
  }
  
  logInfo('✅ AGENT 2 Complete: Timetable structured', {
    teacherName: analysisResult.teacherName,
    timeBlocksCount: analysisResult.timeBlocks.length,
    processingTime: Date.now() - startTime,
  });
  
  // ============================================================
  // FINAL RESULT
  // ============================================================
  return {
    ...analysisResult,
    metadata: {
      extractionMode: 'two-agent-intelligent-system',
      extractionAgent: {
        method: extractionResult.method,
        confidence: extractionResult.confidence,
        textLength: extractionResult.extractedText.length,
        embeddingsMetadata: extractionResult.embeddingsMetadata,
      },
      analysisAgent: {
        semanticAnalysis: analysisResult.metadata?.semanticAnalysis,
        embeddingsUsed: analysisResult.metadata?.embeddingsUsed || false,
      },
      totalProcessingTime: Date.now() - startTime,
    },
  };
}

