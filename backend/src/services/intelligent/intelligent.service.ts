/**
 * Intelligent Extraction Service
 * 
 * This service provides two modes of timetable extraction:
 * 1. AGENTIC MODE (default): Uses LangGraph agent with reasoning and tool usage
 * 2. SIMPLE MODE: Direct LLM extraction (legacy/fallback)
 * 
 * Configuration: Set USE_AGENTIC_WORKFLOW=false to disable agent mode
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config } from '../../config/env';
import { runTimetableExtractionAgent } from './extraction.agent';
import { TimetableSchema, type TimetableExtractionResult } from '../llm.service';
import { logInfo, logWarn } from '../../utils/logger';

/**
 * Extract timetable using intelligent agent workflow
 * This is the primary extraction method when USE_AGENTIC_WORKFLOW=true
 */
export async function extractWithAgent(
  extractedText: string,
  ocrConfidence: number,
  ocrMethod: string,
  imagePath: string
): Promise<TimetableExtractionResult> {
  logInfo('🤖 Using INTELLIGENT AGENT MODE for extraction');
  
  try {
    // Run the agent workflow
    const agentResult = await runTimetableExtractionAgent(
      imagePath,
      extractedText,
      ocrConfidence,
      ocrMethod
    );
    
    if (!agentResult.success) {
      logWarn('Agent workflow failed, falling back to simple LLM');
      return extractWithSimpleLLM(extractedText, ocrConfidence, ocrMethod);
    }
    
    // After agent improves the data, do final LLM extraction
    const llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.1,
      apiKey: config.env.OPENAI_API_KEY,
    });
    
    const structuredLlm = llm.withStructuredOutput(TimetableSchema);
    
    const ENHANCED_PROMPT = `You are an expert at extracting teacher timetable information from text.
The text has been pre-processed and validated by an intelligent agent system.

Agent Processing Summary:
- Tools used: ${agentResult.toolsUsed.join(', ') || 'none'}
- Processing steps: ${agentResult.processingSteps.length}
- Enhanced confidence: ${agentResult.confidence}%

Extract the following information and structure it according to the schema:

1. Teacher Information:
   - Teacher name (REQUIRED)
   - Email (if available)

2. Time Blocks (for each class/session):
   - Day of week (MONDAY, TUESDAY, etc.)
   - Start time (24-hour format: HH:MM)
   - End time (24-hour format: HH:MM)
   - Subject/Course name
   - Classroom/Location (if available)
   - Grade/Level (if available)
   - Section/Group (if available)
   - Any additional notes

3. Academic Details:
   - Academic year (e.g., "2024-2025")
   - Semester/Term (e.g., "Fall 2024")

Important:
- Times MUST be in 24-hour format (HH:MM)
- Days MUST be full names (MONDAY not Mon)
- Group all sessions for the same day together
- If information is missing or unclear, omit that field
- Maintain consistency in formatting

Return ONLY the structured data, no explanations.`;

    const result = await structuredLlm.invoke([
      new SystemMessage(ENHANCED_PROMPT),
      new HumanMessage(extractedText),
    ]);
    
    logInfo('✅ Agent-enhanced extraction successful', {
      teacherName: result.teacherName,
      timeBlocksCount: result.timeBlocks.length,
      agentConfidence: agentResult.confidence,
    });
    
    return {
      ...result,
      metadata: {
        extractionMode: 'agent',
        agentToolsUsed: agentResult.toolsUsed,
        agentSteps: agentResult.processingSteps.length,
        enhancedConfidence: agentResult.confidence,
        originalConfidence: ocrConfidence,
      },
    };
  } catch (error) {
    logWarn('Agent extraction failed, falling back to simple LLM', error);
    return extractWithSimpleLLM(extractedText, ocrConfidence, ocrMethod);
  }
}

/**
 * Extract timetable using simple LLM (legacy method)
 * Used when USE_AGENTIC_WORKFLOW=false or as fallback
 */
export async function extractWithSimpleLLM(
  extractedText: string,
  ocrConfidence: number,
  ocrMethod: string
): Promise<TimetableExtractionResult> {
  logInfo('📝 Using SIMPLE LLM MODE for extraction');
  
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.1,
    apiKey: config.env.OPENAI_API_KEY,
  });
  
  const structuredLlm = llm.withStructuredOutput(TimetableSchema);
  
  const SIMPLE_PROMPT = `You are an expert at extracting teacher timetable information from text.

Extract the following information and structure it according to the schema:

1. Teacher Information:
   - Teacher name (REQUIRED)
   - Email (if available)

2. Time Blocks (for each class/session):
   - Day of week (MONDAY, TUESDAY, etc.)
   - Start time (24-hour format: HH:MM)
   - End time (24-hour format: HH:MM)
   - Subject/Course name
   - Classroom/Location (if available)
   - Grade/Level (if available)
   - Section/Group (if available)

3. Academic Details:
   - Academic year (e.g., "2024-2025")
   - Semester/Term (e.g., "Fall 2024")

Important:
- Times MUST be in 24-hour format (HH:MM)
- Days MUST be full names (MONDAY not Mon)
- If information is missing, omit that field

Return ONLY the structured data.`;

  const result = await structuredLlm.invoke([
    new SystemMessage(SIMPLE_PROMPT),
    new HumanMessage(extractedText),
  ]);
  
  logInfo('✅ Simple LLM extraction successful', {
    teacherName: result.teacherName,
    timeBlocksCount: result.timeBlocks.length,
  });
  
  return {
    ...result,
    metadata: {
      extractionMode: 'simple',
      ocrConfidence,
      ocrMethod,
    },
  };
}

/**
 * Main extraction function - automatically chooses agent or simple mode
 * based on configuration
 */
export async function intelligentExtraction(
  extractedText: string,
  ocrConfidence: number,
  ocrMethod: string,
  imagePath: string
): Promise<TimetableExtractionResult> {
  const useAgent = config.env.USE_AGENTIC_WORKFLOW;
  
  logInfo(`🎯 Extraction mode: ${useAgent ? 'AGENTIC' : 'SIMPLE'}`);
  
  if (useAgent) {
    return extractWithAgent(extractedText, ocrConfidence, ocrMethod, imagePath);
  } else {
    return extractWithSimpleLLM(extractedText, ocrConfidence, ocrMethod);
  }
}
