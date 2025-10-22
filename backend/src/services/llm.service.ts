import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { z } from 'zod';
import { config } from '../config/env';
import { logInfo, logError } from '../utils/logger';

// Define the timetable entry schema
const TimeBlockSchema = z.object({
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.string().describe('Time in HH:mm format (24-hour), e.g., "09:00"'),
  endTime: z.string().describe('Time in HH:mm format (24-hour), e.g., "10:00"'),
  subject: z.string().describe('Subject or course name'),
  classroom: z.string().describe('Classroom or room number'),
  grade: z.string().describe('Grade or class level'),
  section: z.string().describe('Section or division'),
  notes: z.string().describe('Additional notes or remarks'),
});

// Define the full timetable schema
const TimetableSchema = z.object({
  teacherName: z.string().describe('Name of the teacher'),
  timeBlocks: z.array(TimeBlockSchema).describe('Array of timetable entries'),
  academicYear: z.string().describe('Academic year, e.g., "2024-2025"'),
  semester: z.string().describe('Semester or term'),
});

// Export schemas for use by intelligent agent
export { TimetableSchema, TimeBlockSchema };

export type TimeBlock = z.infer<typeof TimeBlockSchema>;
export type TimetableData = z.infer<typeof TimetableSchema>;
export type TimetableExtractionResult = TimetableData & { metadata?: any };

export interface LLMExtractionResult {
  timetableData: TimetableData;
  confidence: number;
  processingTime: number;
  model: string;
}

/**
 * Initialize LLM based on available API keys
 */
function initializeLLM() {
  if (config.env.OPENAI_API_KEY) {
    logInfo('Using OpenAI GPT-4 for extraction');
    return new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0,
      apiKey: config.env.OPENAI_API_KEY,
    });
  } else if (config.env.ANTHROPIC_API_KEY) {
    logInfo('Using Anthropic Claude for extraction');
    return new ChatAnthropic({
      modelName: 'claude-3-haiku-20240307',
      temperature: 0,
      apiKey: config.env.ANTHROPIC_API_KEY,
    });
  } else {
    throw new Error('No LLM API key configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY');
  }
}

/**
 * Extract timetable data from text using LLM
 */
export async function extractTimetableWithLLM(text: string): Promise<LLMExtractionResult> {
  const startTime = Date.now();

  try {
    logInfo('Starting LLM extraction', { textLength: text.length });

    const llm = initializeLLM();

    // Create structured output parser
    const structuredLLM = llm.withStructuredOutput(TimetableSchema);

    // Create extraction prompt
    const prompt = `You are an expert at extracting structured timetable data from text.

Extract the following information from the teacher's timetable text:
1. Teacher name (if mentioned)
2. All timetable entries with:
   - Day of week (MONDAY, TUESDAY, etc.)
   - Start time (in HH:mm format, 24-hour)
   - End time (in HH:mm format, 24-hour)
   - Subject/course name
   - Classroom/room number (if available)
   - Grade/class level (if available)
   - Section (if available)
   - Any additional notes

Guidelines:
- Convert all times to 24-hour format (HH:mm)
- Use uppercase for day names (MONDAY, TUESDAY, etc.)
- Extract ALL timetable entries you can find
- If information is missing, omit that field (don't make up data)
- Be precise with time formats

Timetable Text:
${text}

Extract the timetable data:`;

    // Execute extraction
    const result = await structuredLLM.invoke(prompt);

    const processingTime = Date.now() - startTime;

    // Calculate confidence based on completeness
    const confidence = calculateConfidence(result);

    logInfo('LLM extraction completed', {
      entriesExtracted: result.timeBlocks.length,
      confidence,
      processingTime,
    });

    return {
      timetableData: result,
      confidence,
      processingTime,
      model: config.env.OPENAI_API_KEY ? 'gpt-4o-mini' : 'claude-3-haiku',
    };
  } catch (error) {
    logError('LLM extraction failed', error);
    throw new Error(`LLM extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate confidence score based on data completeness
 */
function calculateConfidence(data: TimetableData): number {
  if (data.timeBlocks.length === 0) {
    return 0;
  }

  let totalScore = 0;
  let maxScore = 0;

  for (const block of data.timeBlocks) {
    // Required fields (5 points each)
    totalScore += 5; // dayOfWeek
    totalScore += 5; // startTime
    totalScore += 5; // endTime
    totalScore += 5; // subject
    maxScore += 20;

    // Optional fields (2 points each)
    if (block.classroom) totalScore += 2;
    if (block.grade) totalScore += 2;
    if (block.section) totalScore += 2;
    if (block.notes) totalScore += 2;
    maxScore += 8;
  }

  return Math.round((totalScore / maxScore) * 100);
}

/**
 * Validate and clean extracted time blocks
 */
export function validateTimeBlocks(timeBlocks: TimeBlock[]): TimeBlock[] {
  return timeBlocks.filter((block) => {
    // Validate time format (HH:mm)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!timeRegex.test(block.startTime) || !timeRegex.test(block.endTime)) {
      logError('Invalid time format', { block });
      return false;
    }

    // Validate day of week
    const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    if (!validDays.includes(block.dayOfWeek)) {
      logError('Invalid day of week', { block });
      return false;
    }

    return true;
  });
}
