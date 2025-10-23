import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { z } from 'zod';
import { config } from '../config/env';
import { logInfo, logError, logWarn } from '../utils/logger';
import { processWithEmbeddings, areEmbeddingsAvailable } from './embedding.service';
import { SimpleVectorStore } from './simple-vector-store';

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
 * Chunk text semantically for embedding-based retrieval
 * Splits text into logical sections (by day, by time periods, etc.)
 */
function chunkTextSemanticly(text: string): string[] {
  const chunks: string[] = [];
  
  // Split by day headers (MONDAY, TUESDAY, etc.)
  const dayPattern = /(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)/gi;
  const sections = text.split(dayPattern);
  
  // Recombine day headers with their content
  for (let i = 1; i < sections.length; i += 2) {
    if (sections[i] && sections[i + 1]) {
      chunks.push(sections[i] + '\n' + sections[i + 1]);
    }
  }
  
  // If no day headers found, chunk by line breaks (fallback)
  if (chunks.length === 0) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // Group every 5-10 lines as a chunk
    for (let i = 0; i < lines.length; i += 8) {
      chunks.push(lines.slice(i, i + 8).join('\n'));
    }
  }
  
  // If still no chunks, return full text as single chunk
  if (chunks.length === 0) {
    chunks.push(text);
  }
  
  return chunks;
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
 * Uses embeddings-first approach: chunk text → embed → retrieve relevant chunks → single LLM call
 */
export async function extractTimetableWithLLM(text: string): Promise<LLMExtractionResult> {
  const startTime = Date.now();

  try {
    logInfo('Starting LLM extraction with Data Extraction Agent', { textLength: text.length });

    const llm = initializeLLM();

    // Create structured output parser
    const structuredLLM = llm.withStructuredOutput(TimetableSchema);
    
    // Step 1: PRE-PROCESS with embeddings to reduce token usage (if available)
    let contextToSend = text;
    let embeddingContext = '';
    
    if (areEmbeddingsAvailable() && text.length > 2000) {
      try {
        logInfo('🧠 Pre-processing text with embeddings to reduce tokens');
        
        // Chunk large text into semantic sections
        const chunks = chunkTextSemanticly(text);
        logInfo(`📄 Chunked text into ${chunks.length} semantic sections`);
        
        // Create embeddings for chunks and retrieve most relevant ones
        const { OpenAIEmbeddings } = await import('@langchain/openai');
        
        const embeddings = new OpenAIEmbeddings({
          apiKey: config.env.OPENAI_API_KEY,
          modelName: 'text-embedding-3-small',
        });
        
        const vectorStore = await SimpleVectorStore.fromTexts(
          chunks,
          chunks.map((_chunk: string, i: number) => ({ index: i })),
          embeddings
        );
        
        // Retrieve top 5 most relevant chunks (instead of all text)
        const relevantChunks = await vectorStore.similaritySearch('timetable schedule teacher class', 5);
        const conciseText = relevantChunks.map((doc: any) => doc.pageContent).join('\n\n');
        
        contextToSend = conciseText;
        embeddingContext = `\n\n**Note**: This is a semantically-filtered excerpt (${conciseText.length} chars) from the original text (${text.length} chars) to reduce token usage while preserving key information.`;
        
        logInfo(`✅ Token optimization: ${text.length} → ${conciseText.length} chars (${Math.round((1 - conciseText.length/text.length) * 100)}% reduction)`);
      } catch (embeddingError) {
        logWarn('⚠️  Embedding pre-processing failed, using full text', embeddingError);
        // Fallback to full text if embeddings fail
        contextToSend = text;
      }
    } else if (text.length <= 2000) {
      logInfo('ℹ️  Text is small (<2000 chars), using full text without embeddings');
    } else {
      logInfo('ℹ️  Embeddings not available, using full text');
    }

    // Step 2: Single LLM call with optimized context
    // Advanced Data Structuring & Analysis Agent Prompt (Stage 2: Text → JSON)
    const prompt = `You are the Data Structuring & Analysis Agent. Your mission is to parse already-extracted timetable text into clean, structured, validated, database-ready JSON.${embeddingContext}

**CRITICAL CONTEXT**: The text you receive has already been extracted from documents using OCR/PDF parsers. Your job is NOT to perform OCR extraction - it's to UNDERSTAND, STRUCTURE, NORMALIZE, and VALIDATE the pre-extracted text.

## Your Input - Pre-Extracted Text
You receive raw text that has already been extracted by OCR/Vision APIs from timetable images/PDFs. This text may contain:
- Unstructured time entries (e.g., "Monday 8:00 AM Math Room 101 Grade 10A")
- Inconsistent formatting variations (Rm vs Room, 8:00 vs 08:00, Math vs Mathematics)
- Day headers scattered throughout the text
- Break periods mixed with regular classes
- Academic metadata in headers (academic year, semester, teacher name)
- OCR artifacts (O→0, l/I confusion, spacing issues)

## Your Job - Transform RAW TEXT → STRUCTURED JSON

### Stage 1: Identify & Extract Academic Metadata
Search the ENTIRE text for:
- **Teacher name**: Usually in headers ("Teacher:", "Instructor:", prominent text at top)
- **Academic year**: Patterns like "2024-2025", "Academic Year 2024-2025", "2024/25"
- **Semester/Term**: "Fall 2024", "Spring 2025", "Term 1", "Semester 2", "Autumn Term"

### Stage 2: Parse & Structure Time Blocks
For EACH time entry found in the text, extract and structure:

**Time Parsing & Normalization:**
- Convert ALL time formats to strict 24-hour HH:MM format:
  - "8:00 AM" → "08:00"
  - "2:30 PM" → "14:30"
  - "12:00" (noon) → "12:00"
  - "8.30" or "8-30" → "08:30"
- Fix OCR errors in times (O→0, l→1)
- If only period labels exist (P1, P2, Period 3), extract period and estimate typical school times

**Day of Week Detection & Normalization:**
- Map variations to full uppercase format:
  - "Monday", "Mon", "M" → "MONDAY"
  - "Tuesday", "Tue", "T" → "TUESDAY"
  - Handle multi-day entries: "Mon-Wed" → create separate blocks for Monday, Tuesday, Wednesday

**Field Extraction & Normalization:**
- **subject**: Course/class name
  - Normalize common abbreviations: "Math" → "Mathematics", "PE" → "Physical Education", "Sci" → "Science"
  - Detect breaks: "lunch", "break", "free", "assembly", "registration" → mark as break type
- **classroom**: Room number/location
  - Normalize patterns: "Rm 101" → "Room 101", "R.101" → "Room 101", "Lab1" → "Lab 1"
- **grade**: Student year/grade level
  - Normalize patterns: "10A" → "Grade 10", "Y10" → "Year 10", "Form 5" → "Grade 5"
- **section**: Class section letter if present (A, B, C, etc.)
- **topic**: Specific lesson topic if mentioned (e.g., "Algebra", "World War II", "Cell Division")
- **notes**: Additional information, period labels, special instructions

**Confidence Scoring (0.0-1.0):**
- **0.9-1.0**: Clear, complete data (all key fields present and unambiguous)
- **0.7-0.89**: Most fields present, minor formatting inconsistencies
- **0.5-0.69**: Missing some fields or unclear formatting
- **Below 0.5**: Highly uncertain, significant data missing or ambiguous

### Stage 3: Data Quality Validation
Perform these checks:
- ✅ NO duplicate time blocks (same day + time + subject)
- ✅ NO overlapping time slots (same teacher can't be in two places)
- ✅ Time blocks chronologically ordered per day
- ✅ startTime MUST be before endTime
- ✅ Day names in proper format (MONDAY, TUESDAY, etc.)
- ✅ Times in HH:MM 24-hour format
- ⚠️ If conflicts found, keep highest confidence entry and mark conflict in notes

### Stage 4: Handle Missing Data (Evidence-Based Only)
- **If teacher name not found**: Search headers, top lines, signature areas, large text
- **If room missing**: Leave as empty string (do NOT invent)
- **If grade missing**: Leave as empty string (do NOT guess)
- **If times ambiguous**: Use context clues (typical school hours 08:00-16:00)
- **CRITICAL**: NEVER hallucinate data - only extract what explicitly exists in the text

## Output Format - Structured JSON Schema

Return ONLY valid JSON matching this exact structure:

\`\`\`json
{
  "teacherName": "Full teacher name extracted from document headers",
  "academicYear": "2024-2025" or null if not found,
  "semester": "Fall 2024" or "Spring 2025" or null if not found,
  "timeBlocks": [
    {
      "dayOfWeek": "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY",
      "startTime": "HH:MM" (24-hour format, e.g., "08:35", "14:00"),
      "endTime": "HH:MM" (24-hour format, e.g., "09:30", "15:45"),
      "subject": "Full subject name (normalized)",
      "classroom": "Room identifier (normalized)" or empty string,
      "grade": "Grade/Year level" or empty string,
      "section": "Section letter" or empty string,
      "notes": "Additional info, breaks, topics" or empty string
    }
  ]
}
\`\`\`

## Critical Rules - MUST FOLLOW
1. ✅ DO normalize inconsistent formats (Rm → Room, Math → Mathematics)
2. ✅ DO convert all times to HH:MM 24-hour format strictly
3. ✅ DO detect and mark breaks/lunch/assembly periods
4. ✅ DO use context for ambiguous data (school hours typically 08:00-16:00)
5. ❌ DO NOT invent data that doesn't exist in the text
6. ❌ DO NOT duplicate time blocks
7. ❌ DO NOT create overlapping schedules for same teacher
8. ❌ DO NOT hallucinate teacher names, rooms, or subjects

## Example Transformation

### Input (Raw Extracted Text):
\`\`\`
Teacher Timetable
Ms. Sarah Johnson
Academic Year: 2024-2025

MONDAY
8:00 AM - 9:00 AM    Mathematics    Room 101    Grade 10A
9:15 AM - 10:15 AM   Mathematics    Room 101    Grade 10B
10:30 AM - 11:00 AM  BREAK
11:00 AM - 12:00 PM  Geometry       Rm 103      Y9A

TUESDAY
8:00 - 9:00          Math           Lab1        10C
\`\`\`

### Output (Structured JSON):
\`\`\`json
{
  "teacherName": "Ms. Sarah Johnson",
  "academicYear": "2024-2025",
  "semester": "",
  "timeBlocks": [
    {
      "dayOfWeek": "MONDAY",
      "startTime": "08:00",
      "endTime": "09:00",
      "subject": "Mathematics",
      "classroom": "Room 101",
      "grade": "Grade 10A",
      "section": "",
      "notes": ""
    },
    {
      "dayOfWeek": "MONDAY",
      "startTime": "09:15",
      "endTime": "10:15",
      "subject": "Mathematics",
      "classroom": "Room 101",
      "grade": "Grade 10B",
      "section": "",
      "notes": ""
    },
    {
      "dayOfWeek": "MONDAY",
      "startTime": "10:30",
      "endTime": "11:00",
      "subject": "Break",
      "classroom": "",
      "grade": "",
      "section": "",
      "notes": "Morning break"
    },
    {
      "dayOfWeek": "MONDAY",
      "startTime": "11:00",
      "endTime": "12:00",
      "subject": "Geometry",
      "classroom": "Room 103",
      "grade": "Year 9A",
      "section": "",
      "notes": ""
    },
    {
      "dayOfWeek": "TUESDAY",
      "startTime": "08:00",
      "endTime": "09:00",
      "subject": "Mathematics",
      "classroom": "Lab 1",
      "grade": "Grade 10C",
      "section": "",
      "notes": ""
    }
  ]
}
\`\`\`

---

## Now Process This Pre-Extracted Timetable Text:

${contextToSend}

Parse and structure this text into clean, validated JSON following all rules above:`;

    // Step 3: Execute SINGLE LLM call with optimized context
    const result = await structuredLLM.invoke(prompt);

    const processingTime = Date.now() - startTime;

    // Calculate confidence based on completeness
    const confidence = calculateConfidence(result);

    logInfo('✅ LLM extraction completed with Data Structuring Agent', {
      entriesExtracted: result.timeBlocks.length,
      confidence,
      processingTime,
      teacherFound: !!result.teacherName,
      academicYearFound: !!result.academicYear,
      semesterFound: !!result.semester,
      tokenOptimization: embeddingContext ? 'enabled' : 'disabled',
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
