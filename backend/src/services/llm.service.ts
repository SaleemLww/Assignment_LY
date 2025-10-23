import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { z } from 'zod';
import { config } from '../config/env';
import { logInfo, logError } from '../utils/logger';

// Define the timetable entry schema with enhanced field descriptions
const TimeBlockSchema = z.object({
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])
    .describe('Day of week in full uppercase format (MONDAY, TUESDAY, etc.)'),
  startTime: z.string()
    .describe('Start time in strict 24-hour HH:MM format (e.g., "08:35", "09:00", "14:30"). Must be two digits for hours and minutes.'),
  endTime: z.string()
    .describe('End time in strict 24-hour HH:MM format (e.g., "09:30", "10:00", "15:45"). Must be after startTime.'),
  subject: z.string()
    .describe('Subject or course name. Use full names (Mathematics not Maths). Include breaks (Break, Lunch, Assembly, Registration).'),
  classroom: z.string()
    .describe('Classroom or room number in canonical format (e.g., "Room 101", "Lab 2"). Use empty string if not available.'),
  grade: z.string()
    .describe('Grade or class level (e.g., "Year 10", "Grade 7"). Use empty string if not specified.'),
  section: z.string()
    .describe('Section or division (e.g., "A", "Section B"). Use empty string if not specified.'),
  notes: z.string()
    .describe('Additional notes: topics, period labels (P1, P2), special instructions, break types. Use empty string if none.'),
});

// Define the full timetable schema with semantic metadata
const TimetableSchema = z.object({
  teacherName: z.string()
    .describe('Full name of the teacher as it appears in the document. Search headers, titles, and signature areas. Required field.'),
  timeBlocks: z.array(TimeBlockSchema)
    .describe('Array of ALL timetable entries. Extract every visible entry comprehensively. Must include all sessions, breaks, and special periods.'),
  academicYear: z.string()
    .describe('Academic year in format "YYYY-YYYY" or "YYYY/YY" (e.g., "2024-2025", "2024/25"). Extract from document headers/footers/titles. Use empty string if not found - DO NOT guess.'),
  semester: z.string()
    .describe('Semester or term in format "Season YYYY" or "Term N" or "Semester N" (e.g., "Fall 2024", "Spring 2025", "Term 1"). Extract from document metadata. Use empty string if not found - DO NOT guess.'),
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
 * Extract timetable data from text using LLM with advanced Data Extraction Agent prompt
 */
export async function extractTimetableWithLLM(text: string): Promise<LLMExtractionResult> {
  const startTime = Date.now();

  try {
    logInfo('Starting LLM extraction with Data Extraction Agent', { textLength: text.length });

    const llm = initializeLLM();

    // Create structured output parser
    const structuredLLM = llm.withStructuredOutput(TimetableSchema);

    // Advanced Data Extraction Agent Prompt
    const prompt = `You are the Data Extraction Agent. Your mission is to extract all visible timetable data from the uploaded document and produce a reliable, provenance-rich, high-quality structured JSON output.

HIGH-LEVEL GOALS:
• Extract text, table structure, and layout metadata from the document
• Detect tables, cells, row/column boundaries, merged cells, and rotated text
• For each extracted datum, ensure accuracy and completeness
• Produce consistent structured JSON with raw text and semantic fields (teacher name, day, time, subject, class, room, topic, remarks)

CAPABILITIES YOU HAVE:
• Advanced OCR text understanding with layout/table detection awareness
• Table structure recognition with cell boundary detection
• Language normalization (English primary)
• Confidence scoring per text block and field extraction
• Smart field candidate discovery using patterns and heuristics

STEP-BY-STEP EXTRACTION STRATEGY:
1. **Preprocess & Normalize**: Identify table structure, normalize text (trim whitespace, unify unicode, fix OCR errors like O→0 in times, l/I confusion)

2. **Table Structure Detection**: Recognize table layouts with days (columns/rows), time slots, and subject cells. If no clear table, use line/column segmentation.

3. **Field Candidate Discovery**: For each cell/line, identify candidate fields:
   - Teacher name (search headers, top text, large fonts)
   - Day of week (MONDAY, TUESDAY, etc. - detect from headers or row labels)
   - Start/End times (normalize to HH:mm 24-hour format, handle periods P1/P2 if no times)
   - Subject/course name
   - Classroom/room (normalize: Rm/R./Room → Room, Lab patterns)
   - Grade/class level (Year + Section format like 10A)
   - Section/division
   - Topic or additional notes
   - Break detection (lunch, recess, assembly, registration)

4. **Time Normalization**: Convert all times to 24-hour HH:mm format. Try multiple formats (12-hour AM/PM, 24-hour, colon/dot separators). If only period labels (P1, P2) exist without times, still capture the period structure.

5. **Data Quality Checks**:
   - Mark fields with low confidence (< 0.6) for review
   - If teacher name missing or confidence < 0.7, search entire document for candidate names
   - Validate time formats strictly (HH:mm)
   - Ensure day names are uppercase (MONDAY, TUESDAY, etc.)
   - Detect and mark duplicate or overlapping entries

6. **Academic Metadata Extraction**:
   - Extract academic year (e.g., "2024-2025", "Academic Year 2024-2025")
   - Extract semester/term (e.g., "Fall 2024", "Spring 2025", "Term 1", "Semester 2")
   - These often appear in headers, footers, or title areas

EXTRACTION RULES:
✓ Extract ALL visible timetable entries you can find - no data should be missed
✓ Use EXACT text from document - don't invent or hallucinate data
✓ If information is missing or uncertain, leave field empty (don't guess)
✓ Normalize times consistently: 8:30 AM → 08:30, 2:45 PM → 14:45
✓ Preserve breaks, assemblies, registration periods (mark in notes)
✓ For merged cells spanning multiple time slots, create separate entries for clarity
✓ Handle multi-line cell content (subject + room in same cell)

QUALITY THRESHOLDS:
• Minimum confidence for auto-acceptance: 0.7
• Fields with confidence < 0.6 should be marked but still extracted
• If teacher name has confidence < 0.7, provide reasoning
• Validate no time overlaps for same day

OUTPUT FORMAT:
Return structured JSON with:
- teacherName (string) - extracted teacher name
- timeBlocks (array) - all timetable entries with day, times, subject, classroom, grade, section, notes
- academicYear (string) - academic year if found (e.g., "2024-2025")
- semester (string) - semester/term if found (e.g., "Fall 2024")

Each timeBlock must have:
- dayOfWeek: MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY
- startTime: HH:mm format (24-hour)
- endTime: HH:mm format (24-hour)
- subject: course/subject name
- classroom: room number (empty string if not found)
- grade: grade/year level (empty string if not found)
- section: section/division (empty string if not found)
- notes: additional information, breaks, topics (empty string if none)

TIMETABLE TEXT TO EXTRACT FROM:
${text}

Now extract the complete timetable data with maximum accuracy and completeness:`;

    // Execute extraction
    const result = await structuredLLM.invoke(prompt);

    const processingTime = Date.now() - startTime;

    // Calculate confidence based on completeness
    const confidence = calculateConfidence(result);

    logInfo('LLM extraction completed with Data Extraction Agent', {
      entriesExtracted: result.timeBlocks.length,
      confidence,
      processingTime,
      teacherFound: !!result.teacherName,
      academicYearFound: !!result.academicYear,
      semesterFound: !!result.semester,
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
