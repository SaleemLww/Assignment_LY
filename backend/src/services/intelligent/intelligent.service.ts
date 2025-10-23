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
import { processWithEmbeddings, areEmbeddingsAvailable } from '../embedding.service';
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
    
    const ENHANCED_PROMPT = `You are the Data Analysis & Normalization Agent. Your mission is to consume the extracted timetable data, improve and complete the dataset with contextual inference (only when evidence exists), deduplicate and canonicalize fields, and output final structured JSON suitable for database storage and frontend grid rendering.

HIGH-LEVEL GOALS:
• Consume extraction data and improve/complete with contextual inference (evidence-based only)
• Deduplicate and canonicalize fields (times, dates, classes, rooms, subjects)
• Apply consistency rules and validate data integrity
• Attach semantic metadata for provenance and confidence tracking
• Output final per-teacher JSON suitable for direct database saving and beautiful frontend display

CAPABILITIES YOU HAVE:
• Schema mapping and normalization utilities
• Fuzzy string matching for deduplication
• Named Entity Recognition (NER) for teacher names, subjects, rooms
• Time/date canonicalization (24-hour HH:MM format)
• Duplicate detection using similarity matching
• Gap-filling heuristics based on document context

STEP-BY-STEP NORMALIZATION STRATEGY:

1. **Load & Index Extraction Data**: Process the pre-extracted text and agent processing results

2. **Normalize Canonical Fields**:
   - **Times**: Convert to HH:MM 24-hour format strictly (09:00, 14:30)
     • Handle 12-hour format: 8:30 AM → 08:30, 2:45 PM → 14:45
     • Handle period labels: If only P1/P2 exists, save as notes, leave times structured
   - **Days**: Full uppercase day names (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY)
   - **Rooms**: Canonicalize patterns (Rm/R./Room → Room, Lab 1 → Lab 1)
   - **Classes**: Unify to Year + Section format (e.g., 10A, Year 7 Section B)
   - **Subjects**: Standardize common abbreviations (Maths → Mathematics, PE → Physical Education)

3. **Build Normalized Timetable Grid**: Create day-ordered slot structure:
   - Group by days of week (Monday → Friday typically)
   - Order slots chronologically by start time
   - Detect breaks, assemblies, registration periods (mark in notes field)

4. **Gap Filling (Evidence-Based Only)**:
   - For missing teacher name: Search headers, footers, large-font text in source
   - For missing room: Look for repeated patterns or column headers
   - For missing subject: Check table structure and cell adjacency
   - **NEVER INVENT DATA** - only fill when found in source with confidence ≥ 0.7
   - Record provenance for any filled data

5. **Conflict Resolution**:
   - When multiple interpretations exist (e.g., ambiguous time "9:00" could be AM/PM):
     • Use context clues (previous/next entries, typical school hours 08:00-16:00)
     • Pick highest confidence interpretation
     • Mark conflicts for review if equal confidence
   - Detect overlapping lessons for same teacher/time → mark as conflict

6. **Data Quality Validation**:
   - Ensure no time overlaps for same teacher on same day
   - Validate time sequences (end time > start time)
   - Check day ordering and chronological flow
   - Verify all times in 24-hour HH:MM format
   - Flag entries with confidence < 0.6 for review

7. **Semantic Metadata Extraction**:
   - Extract academic year from headers/titles (e.g., "Academic Year 2024-2025", "2024/25")
   - Extract semester/term info (e.g., "Fall 2024", "Spring Term", "Semester 1")
   - These often appear in document headers, footers, or title blocks

8. **Final Confidence Scoring**: Calculate aggregate confidence based on:
   - OCR confidence from extraction
   - Field completeness (all required fields present)
   - Validation pass rate (no conflicts/overlaps)
   - Normalization certainty

NORMALIZATION RULES & CONSTRAINTS:
✓ DO NOT invent subjects/rooms/teacher names unless exact string appears in source
✓ ALWAYS preserve provenance - track where each datum came from
✓ ONLY fill gaps when evidence exists with confidence ≥ 0.7
✓ Validate no overlapping lessons for same teacher/time
✓ Ensure time-ordered slots per day
✓ Handle merged cells by creating separate entries for clarity
✓ Canonicalize times strictly to HH:MM 24-hour format

QUALITY THRESHOLDS:
• Auto-accept threshold: confidence ≥ 0.7
• Review threshold: 0.6 ≤ confidence < 0.7 (mark but include)
• Reject threshold: confidence < 0.6 (flag for manual review)
• Teacher name minimum confidence: 0.7
• Time format validation: must match HH:MM regex strictly

OUTPUT STRUCTURE REQUIREMENTS:

**TeacherName** (string, REQUIRED):
- Full name as it appears in document
- If multiple candidates, use highest confidence
- Minimum confidence: 0.7

**TimeBlocks** (array, REQUIRED):
Each entry must have:
- dayOfWeek: MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY (enum, uppercase)
- startTime: HH:MM format (24-hour, e.g., "08:35", "14:00")
- endTime: HH:MM format (24-hour, e.g., "09:30", "15:45")
- subject: Subject/course name (standardized, e.g., "Mathematics", "Physical Education")
- classroom: Room identifier (canonicalized, e.g., "Room 101", "Lab 2", empty string if N/A)
- grade: Grade/year level (e.g., "Year 7", "Grade 10", empty string if N/A)
- section: Section/division (e.g., "A", "Section B", empty string if N/A)
- notes: Additional info including breaks, assemblies, topics, period labels (e.g., "Break", "Assembly", "Registration", "P1", empty string if none)

**AcademicYear** (string, OPTIONAL):
- Format: "YYYY-YYYY" (e.g., "2024-2025") or "YYYY/YY" (e.g., "2024/25")
- Extract from document headers, footers, titles
- Empty string if not found

**Semester** (string, OPTIONAL):
- Format: "Season YYYY" (e.g., "Fall 2024", "Spring 2025") or "Term N" or "Semester N"
- Extract from document metadata areas
- Empty string if not found

AGENT PROCESSING CONTEXT:
The text has been pre-processed by the Data Extraction Agent with the following results:
- OCR Method: ${ocrMethod}
- OCR Confidence: ${ocrConfidence}%
- Agent Tools Used: ${agentResult.toolsUsed.join(', ') || 'none'}
- Processing Steps Completed: ${agentResult.processingSteps.length}
- Enhanced Extraction Confidence: ${agentResult.confidence}%

Now perform comprehensive data analysis and normalization to produce the final, high-quality structured timetable ready for database storage and beautiful frontend grid display:`;


    const result = await structuredLlm.invoke([
      new SystemMessage(ENHANCED_PROMPT),
      new HumanMessage(extractedText),
    ]);
    
    logInfo('✅ Agent-enhanced extraction successful', {
      teacherName: result.teacherName,
      timeBlocksCount: result.timeBlocks.length,
      agentConfidence: agentResult.confidence,
    });
    
    // EMBEDDING ENHANCEMENT: Process with semantic analysis
    if (areEmbeddingsAvailable()) {
      try {
        logInfo('🧠 Applying embedding-enhanced semantic analysis');
        
        const embeddingResult = await processWithEmbeddings(result);
        
        // Use embedding insights for final refinement
        if (embeddingResult.semanticInsights.duplicates.length > 0 ||
            embeddingResult.semanticInsights.conflicts.length > 0) {
          
          logInfo('🔄 Refining based on semantic insights', {
            duplicates: embeddingResult.semanticInsights.duplicates.length,
            conflicts: embeddingResult.semanticInsights.conflicts.length,
          });
          
          // Second pass with embedding context
          const refinedResult = await structuredLlm.invoke([
            new SystemMessage(`${ENHANCED_PROMPT}

=== EMBEDDING-BASED SEMANTIC ANALYSIS ===

${embeddingResult.refinementContext}

Based on the semantic analysis above, refine the timetable to:
1. Remove or merge duplicates identified by similarity > 95%
2. Resolve time conflicts by keeping the most complete entry
3. Validate gaps are legitimate (breaks/lunch) or missing data
4. Ensure final output is clean, deduplicated, and conflict-free`),
            new HumanMessage(extractedText),
          ]);
          
          return {
            ...refinedResult,
            metadata: {
              extractionMode: 'agent-with-embeddings',
              agentToolsUsed: agentResult.toolsUsed,
              agentSteps: agentResult.processingSteps.length,
              enhancedConfidence: agentResult.confidence,
              originalConfidence: ocrConfidence,
              semanticAnalysis: {
                duplicatesFound: embeddingResult.semanticInsights.duplicates.length,
                conflictsFound: embeddingResult.semanticInsights.conflicts.length,
                gapsFound: embeddingResult.semanticInsights.gaps.length,
                statistics: embeddingResult.semanticInsights.statistics,
              },
            },
          };
        }
      } catch (embeddingError) {
        logWarn('Embedding analysis failed, continuing without', embeddingError);
      }
    }
    
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
  
  const SIMPLE_PROMPT = `You are the Data Extraction and Analysis Agent (Simple Mode). Extract and normalize teacher timetable information from the provided text with high accuracy and completeness.

EXTRACTION OBJECTIVES:
• Extract ALL visible timetable data comprehensively
• Normalize and canonicalize all fields to consistent formats
• Validate data integrity and flag any issues
• Produce clean, structured output ready for database storage

FIELD EXTRACTION REQUIREMENTS:

1. **Teacher Information** (REQUIRED):
   - Full teacher name as it appears in the document
   - Search document headers, titles, and signature areas if not immediately obvious
   - Minimum confidence requirement: 0.7

2. **Time Blocks** (REQUIRED - extract ALL entries):
   For each class/session/period, extract:
   
   a) **Day of Week** (REQUIRED):
      - Format: Full uppercase day names (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY)
      - NOT abbreviated (no Mon, Tue, etc.)
      - Detect from table headers, row labels, or section markers
   
   b) **Start Time & End Time** (REQUIRED):
      - Format: Strict 24-hour HH:MM (e.g., "08:35", "09:00", "14:30")
      - Convert 12-hour to 24-hour: 8:30 AM → 08:30, 2:45 PM → 14:45
      - Handle various formats: 8:30, 08:30, 8.30, 830 → all become 08:30
      - If only period labels (P1, P2, Period 1) exist, include in notes field
      - Validate: end time must be after start time
   
   c) **Subject/Course** (REQUIRED):
      - Full subject name (Mathematics, Physical Education, English Language)
      - Standardize common abbreviations: Maths → Mathematics, PE → Physical Education
      - Include break periods: Break, Lunch, Assembly, Registration
   
   d) **Classroom/Room** (OPTIONAL):
      - Canonicalize format: Rm 101 → Room 101, R. 5 → Room 5, Lab1 → Lab 1
      - Empty string if not available in document
   
   e) **Grade/Year Level** (OPTIONAL):
      - Format: Year N, Grade N, or just the number with context
      - Empty string if not specified
   
   f) **Section/Division** (OPTIONAL):
      - Format: Single letter (A, B) or Section name (Section A)
      - Empty string if not specified
   
   g) **Notes/Additional Info** (OPTIONAL):
      - Include: topics, period labels (P1, P2), special instructions
      - Mark breaks: "Break", "Lunch Break", "Morning Assembly", "Registration"
      - Empty string if none

3. **Academic Metadata** (OPTIONAL but important):
   
   a) **Academic Year**:
      - Search document headers, footers, title areas
      - Format: "YYYY-YYYY" (e.g., "2024-2025") or "YYYY/YY"
      - Common patterns: "Academic Year 2024-2025", "AY 2024-25", "2024/2025"
      - Empty string if not found (DO NOT guess)
   
   b) **Semester/Term**:
      - Search document metadata areas
      - Format: "Season YYYY" (Fall 2024, Spring 2025) or "Term N" or "Semester N"
      - Common patterns: "Fall Term 2024", "Spring Semester", "Term 1", "Semester 2"
      - Empty string if not found (DO NOT guess)

EXTRACTION RULES & VALIDATION:
✓ Extract EVERY timetable entry you can find - completeness is critical
✓ Use EXACT text from document - never invent or hallucinate data
✓ If a field is missing or ambiguous, leave it empty (empty string)
✓ Validate no overlapping time slots for same day
✓ Ensure chronological order (earlier times come first)
✓ Preserve break periods and special sessions (assembly, registration)
✓ Handle merged cells by creating separate entries if needed
✓ Normalize times consistently across all entries
✓ Group entries by day for logical organization

DATA QUALITY STANDARDS:
• All times must strictly match HH:MM format (two digits for hours and minutes)
• All days must be full uppercase names (MONDAY not Mon)
• No duplicate entries with identical day/time/subject combinations
• Time ranges must be valid (end > start, reasonable school hours 07:00-18:00)
• Maintain consistency in room naming, subject naming across entries

COMMON PATTERNS TO RECOGNIZE:
• Break periods: "Break", "Morning Break", "Lunch", "Lunch Break", "Recess"
• Special sessions: "Assembly", "Registration", "Form Time", "Homeroom"
• Period labels: "P1", "P2", "Period 1", "Lesson 1" (include in notes)
• Multi-purpose cells: Subject + Room in same cell (split appropriately)
• Merged time slots: 90-minute blocks, double periods

OUTPUT FORMAT:
Return structured JSON with:
- teacherName (string) - extracted teacher name
- timeBlocks (array) - all timetable entries with complete field structure
- academicYear (string) - academic year if found in document
- semester (string) - semester/term if found in document

Each timeBlock object structure:
{
  "dayOfWeek": "MONDAY",
  "startTime": "08:35",
  "endTime": "09:30",
  "subject": "Mathematics",
  "classroom": "Room 201",
  "grade": "Year 10",
  "section": "A",
  "notes": "Advanced Calculus"
}

Return ONLY the structured data. Extract with maximum completeness and accuracy.`;

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
