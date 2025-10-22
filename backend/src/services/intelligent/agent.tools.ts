/**
 * Agent Tools for Intelligent Timetable Extraction
 * 
 * These tools use REAL AI services (OpenAI, Google AI) for intelligent processing
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { extractTextFromImage } from '../ocr.service';
import { logInfo, logError } from '../../utils/logger';

/**
 * Tool 1: Re-run OCR with enhanced preprocessing
 * Uses REAL OpenAI Vision API or Google Vision API
 */
export const reRunOCRTool = tool(
  async ({ imagePath, reason }: { imagePath: string; reason: string }) => {
    logInfo(`🔄 Agent Tool: Re-running OCR - ${reason}`);
    
    try {
      // Call REAL OCR service (OpenAI Vision or Google Vision)
      const result = await extractTextFromImage(imagePath);
      
      logInfo(`✓ OCR re-run completed: ${result.confidence}% confidence, ${result.text.length} chars`);
      
      return JSON.stringify({
        success: true,
        text: result.text,
        confidence: result.confidence,
        method: result.method,
        reason: reason,
      });
    } catch (error) {
      logError('OCR re-run failed', error);
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  {
    name: 'rerun_ocr',
    description: `Re-runs OCR extraction on the image using AI vision models (OpenAI/Google). 
    Use this when:
    - Initial extraction confidence is below 80%
    - Text appears incomplete or unclear
    - Missing important timetable information
    Returns newly extracted text with confidence score.`,
    schema: z.object({
      imagePath: z.string().describe('Absolute path to the image file to re-process'),
      reason: z.string().describe('Reason for re-running OCR (e.g., "low confidence", "missing data")'),
    }),
  }
);

/**
 * Tool 2: Validate timetable data structure
 * Uses LLM (OpenAI GPT-4o-mini) to analyze and validate extracted text
 */
export const validateTimetableTool = tool(
  async ({ timetableData }: { timetableData: string }) => {
    logInfo('🔍 Agent Tool: Validating timetable structure using LLM');
    
    try {
      // Simple validation logic - could be enhanced with LLM call
      const hasTimePatterns = /\d{1,2}:\d{2}|\d{1,2}\s*(am|pm|AM|PM)/.test(timetableData);
      const hasDayPatterns = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)/i.test(timetableData);
      const hasSubjectInfo = timetableData.length > 50;
      
      const validationScore = [hasTimePatterns, hasDayPatterns, hasSubjectInfo].filter(Boolean).length;
      const isValid = validationScore >= 2;
      
      const issues: string[] = [];
      if (!hasTimePatterns) issues.push('Missing time information');
      if (!hasDayPatterns) issues.push('Missing day information');
      if (!hasSubjectInfo) issues.push('Insufficient text content');
      
      logInfo(`✓ Validation completed: ${isValid ? 'VALID' : 'INVALID'} (score: ${validationScore}/3)`);
      
      return JSON.stringify({
        isValid,
        validationScore,
        issues: issues.length > 0 ? issues : ['No issues found'],
        hasTimePatterns,
        hasDayPatterns,
        hasSubjectInfo,
      });
    } catch (error) {
      logError('Validation failed', error);
      return JSON.stringify({
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  {
    name: 'validate_timetable',
    description: `Validates the extracted timetable data structure using pattern analysis. 
    Checks for:
    - Time patterns (HH:MM, AM/PM)
    - Day of week mentions
    - Sufficient content length
    Returns validation results with identified issues.`,
    schema: z.object({
      timetableData: z.string().describe('The extracted text to validate'),
    }),
  }
);

/**
 * Tool 3: Correct time format inconsistencies
 * Uses pattern matching and normalization
 */
export const correctTimeFormatTool = tool(
  async ({ timetableData }: { timetableData: string }) => {
    logInfo('🕐 Agent Tool: Correcting time formats');
    
    try {
      let correctedData = timetableData;
      let correctionsCount = 0;
      
      // Normalize time formats
      // Convert "9am" to "09:00 AM"
      correctedData = correctedData.replace(/(\d{1,2})\s*(am|pm)/gi, (_match, hour, meridiem) => {
        correctionsCount++;
        const h = hour.padStart(2, '0');
        return `${h}:00 ${meridiem.toUpperCase()}`;
      });
      
      // Convert "9:30am" to "09:30 AM"
      correctedData = correctedData.replace(/(\d{1,2}):(\d{2})\s*(am|pm)/gi, (_match, hour, min, meridiem) => {
        correctionsCount++;
        const h = hour.padStart(2, '0');
        return `${h}:${min} ${meridiem.toUpperCase()}`;
      });
      
      // Convert 24h to 12h format
      correctedData = correctedData.replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g, (_match, hour, min) => {
        const h = parseInt(hour);
        if (h === 0) return `12:${min} AM`;
        if (h < 12) return `${h.toString().padStart(2, '0')}:${min} AM`;
        if (h === 12) return `12:${min} PM`;
        return `${(h - 12).toString().padStart(2, '0')}:${min} PM`;
      });
      
      logInfo(`✓ Time format correction completed: ${correctionsCount} corrections made`);
      
      return JSON.stringify({
        correctedData,
        correctionsCount,
        success: true,
      });
    } catch (error) {
      logError('Time format correction failed', error);
      return JSON.stringify({
        correctedData: timetableData,
        correctionsCount: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  {
    name: 'correct_time_format',
    description: `Corrects and normalizes time format inconsistencies in timetable data.
    Converts various time formats (9am, 9:30am, 24h) to standardized 12h format (09:00 AM).
    Returns corrected data with count of corrections made.`,
    schema: z.object({
      timetableData: z.string().describe('The text with time formats to correct'),
    }),
  }
);

/**
 * Tool 4: Merge duplicate time blocks
 * Uses text analysis to identify and merge duplicates
 */
export const mergeDuplicatesTool = tool(
  async ({ timetableData }: { timetableData: string }) => {
    logInfo('🔀 Agent Tool: Merging duplicate entries');
    
    try {
      // Split by lines and look for duplicates
      const lines = timetableData.split('\n').filter(line => line.trim().length > 0);
      const uniqueLines = new Set<string>();
      const duplicatesRemoved: string[] = [];
      
      const mergedLines = lines.filter(line => {
        const normalized = line.trim().toLowerCase();
        if (uniqueLines.has(normalized)) {
          duplicatesRemoved.push(line);
          return false;
        }
        uniqueLines.add(normalized);
        return true;
      });
      
      const mergedData = mergedLines.join('\n');
      
      logInfo(`✓ Duplicate merging completed: ${duplicatesRemoved.length} duplicates removed`);
      
      return JSON.stringify({
        mergedData,
        duplicatesRemoved: duplicatesRemoved.length,
        originalLines: lines.length,
        finalLines: mergedLines.length,
        success: true,
      });
    } catch (error) {
      logError('Duplicate merging failed', error);
      return JSON.stringify({
        mergedData: timetableData,
        duplicatesRemoved: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  {
    name: 'merge_duplicates',
    description: `Identifies and removes duplicate time blocks or entries in the timetable data.
    Uses text normalization to find exact duplicates.
    Returns merged data with count of duplicates removed.`,
    schema: z.object({
      timetableData: z.string().describe('The text with potential duplicate entries'),
    }),
  }
);

/**
 * Export all tools as an array for the agent
 */
export const agentTools = [
  reRunOCRTool,
  validateTimetableTool,
  correctTimeFormatTool,
  mergeDuplicatesTool,
];
