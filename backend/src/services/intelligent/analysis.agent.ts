/**
 * ANALYSIS & GENERATION AGENT (Agent 2)
 * 
 * Responsibility: Raw Text → Structured Timetable
 * 
 * This agent takes raw extracted text and performs:
 * 1. Semantic chunking and embeddings
 * 2. Vector search for relevant context
 * 3. LLM-based structuring with advanced prompts
 * 4. Validation and normalization
 * 5. Returns final structured timetable
 */

import { ChatOpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config } from '../../config/env';
import { TimetableSchema, type TimetableExtractionResult } from '../llm.service';
import { processWithEmbeddings, areEmbeddingsAvailable } from '../embedding.service';
import { logInfo, logWarn, logError } from '../../utils/logger';

/**
 * Chunk text semantically for embedding-based retrieval
 * Splits text into logical sections (by day headers, periods, etc.)
 */
function chunkTextSemantically(text: string): string[] {
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
    
    // Group every 10 lines as a chunk for better context
    for (let i = 0; i < lines.length; i += 10) {
      chunks.push(lines.slice(i, i + 10).join('\n'));
    }
  }
  
  // If still no chunks, return full text as single chunk
  if (chunks.length === 0) {
    chunks.push(text);
  }
  
  return chunks;
}

/**
 * Run the Analysis & Generation Agent
 * 
 * @param extractedText - Raw text from Extraction Agent
 * @param ocrConfidence - Confidence score from extraction
 * @param ocrMethod - Method used for extraction
 * @returns Structured timetable with metadata
 */
export async function runAnalysisAgent(
  extractedText: string,
  ocrConfidence: number,
  ocrMethod: string
): Promise<TimetableExtractionResult & { success: boolean; error?: string }> {
  const startTime = Date.now();
  
  try {
    logInfo('🧠 ANALYSIS AGENT: Starting semantic analysis and structuring', {
      textLength: extractedText.length,
      confidence: ocrConfidence,
      method: ocrMethod,
    });
    
    // ============================================================
    // STEP 1: SEMANTIC CHUNKING & EMBEDDING
    // ============================================================
    let contextToSend = extractedText;
    let tokenReduction = 0;
    let embeddingsUsed = false;
    
    if (areEmbeddingsAvailable() && extractedText.length > 2000) {
      try {
        logInfo('📊 Chunking text semantically for embeddings');
        const chunks = chunkTextSemantically(extractedText);
        logInfo(`📄 Created ${chunks.length} semantic chunks`);
        
        // Create embeddings
        const embeddings = new OpenAIEmbeddings({
          apiKey: config.env.OPENAI_API_KEY,
          modelName: 'text-embedding-3-small',
        });
        
        // Create vector store - use dynamic import
        const { MemoryVectorStore } = await import('langchain/vectorstores/memory');
        const vectorStore = await MemoryVectorStore.fromTexts(
          chunks,
          chunks.map((_chunk: string, i: number) => ({ index: i })),
          embeddings
        );
        
        // Retrieve top 6 most relevant chunks for timetable context
        const relevantChunks = await vectorStore.similaritySearch(
          'timetable schedule teacher class time subject room grade day period',
          6
        );
        
        contextToSend = relevantChunks.map((doc: any) => doc.pageContent).join('\n\n');
        tokenReduction = Math.round((1 - contextToSend.length / extractedText.length) * 100);
        embeddingsUsed = true;
        
        logInfo(`✅ Token optimization: ${extractedText.length} → ${contextToSend.length} chars (${tokenReduction}% reduction)`);
      } catch (embeddingError) {
        logWarn('⚠️  Embeddings preprocessing failed, using full text', embeddingError);
      }
    }
    
    // ============================================================
    // STEP 2: LLM STRUCTURING WITH ADVANCED PROMPT
    // ============================================================
    logInfo('🎯 Invoking LLM for timetable structuring');
    
    const llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.1,
      apiKey: config.env.OPENAI_API_KEY,
    });
    
    const structuredLlm = llm.withStructuredOutput(TimetableSchema);
    
    const ANALYSIS_PROMPT = `You are the Analysis & Generation Agent - an expert in transforming raw timetable text into perfect structured data.

YOUR MISSION:
Transform the extracted text into a clean, normalized, database-ready timetable structure with maximum accuracy and completeness.

EXTRACTION CONTEXT:
- Source Method: ${ocrMethod}
- Extraction Confidence: ${ocrConfidence}%
- Text Length: ${contextToSend.length} characters
- Token Optimization: ${embeddingsUsed ? `${tokenReduction}% reduction via embeddings` : 'No optimization (text < 2000 chars)'}

CORE RESPONSIBILITIES:

1. **COMPREHENSIVE DATA EXTRACTION**
   - Extract EVERY timetable entry visible in the text
   - Never skip or omit entries due to formatting issues
   - Handle merged cells, irregular layouts, and complex structures

2. **FIELD NORMALIZATION** (Apply strictly):
   a) **Teacher Name** (REQUIRED):
      - Extract full name from headers, titles, or signatures
      - Minimum confidence: 0.7
      - Search multiple locations if not obvious
   
   b) **Day of Week** (REQUIRED):
      - Full uppercase: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
      - Never use abbreviations
   
   c) **Times** (REQUIRED - CRITICAL):
      - Strict 24-hour format: HH:MM (e.g., "08:30", "14:45")
      - Convert 12-hour to 24-hour:
        • 8:30 AM → 08:30
        • 2:45 PM → 14:45
        • 12:30 PM → 12:30
        • 12:30 AM → 00:30
      - Handle various formats: "8:30", "08:30", "8.30", "830" → all become "08:30"
      - If only period labels (P1, P2) exist, save to notes field
      - Validate: endTime > startTime
   
   d) **Subject** (REQUIRED):
      - Standardize abbreviations:
        • Maths → Mathematics
        • PE → Physical Education
        • Eng → English
      - Include break periods: "Break", "Lunch", "Assembly", "Registration"
   
   e) **Classroom** (OPTIONAL):
      - Canonicalize: "Rm 101" → "Room 101", "R. 5" → "Room 5", "Lab1" → "Lab 1"
      - Empty string if not available
   
   f) **Grade/Year** (OPTIONAL):
      - Format: "Year 7", "Grade 10", or just number with context
      - Empty string if not specified
   
   g) **Section** (OPTIONAL):
      - Format: "A", "B", or "Section A"
      - Empty string if not specified
   
   h) **Notes** (OPTIONAL):
      - Include: topics, period labels, special instructions
      - Mark breaks: "Break", "Lunch Break", "Assembly"
      - Empty string if none

3. **ACADEMIC METADATA EXTRACTION** (Search carefully):
   a) **Academic Year** (OPTIONAL):
      - Look in: headers, footers, title blocks
      - Patterns: "Academic Year 2024-2025", "AY 2024/25", "2024-2025"
      - Format: "YYYY-YYYY" or "YYYY/YY"
      - Empty string if not found (DON'T GUESS)
   
   b) **Semester/Term** (OPTIONAL):
      - Look in: document metadata areas
      - Patterns: "Fall 2024", "Spring Term", "Semester 1", "Term 2"
      - Empty string if not found (DON'T GUESS)

4. **QUALITY VALIDATION**:
   - No time overlaps for same teacher on same day
   - Chronological order (earlier times first)
   - All times match HH:MM regex pattern
   - No duplicate entries (same day/time/subject)
   - Time ranges are valid (end > start, school hours 07:00-18:00)

5. **DATA INTEGRITY RULES**:
   ✓ Use EXACT text from document - never invent data
   ✓ If field missing/ambiguous, leave empty (empty string)
   ✓ Preserve all entries including breaks and special sessions
   ✓ Handle merged cells by creating separate entries
   ✓ Maintain consistency in naming across all entries

QUALITY THRESHOLDS:
• Auto-accept: confidence ≥ 0.7
• Review: 0.6 ≤ confidence < 0.7 (include but flag)
• Reject: confidence < 0.6 (flag for manual review)

OUTPUT REQUIREMENTS:
Return clean, complete JSON with:
- teacherName: string
- timeBlocks: array of normalized entries
- academicYear: string (or empty)
- semester: string (or empty)

Extract with MAXIMUM completeness and STRICT normalization.`;
    
    const result = await structuredLlm.invoke([
      new SystemMessage(ANALYSIS_PROMPT),
      new HumanMessage(contextToSend),
    ]);
    
    logInfo('✅ LLM structuring complete', {
      teacherName: result.teacherName,
      timeBlocksCount: result.timeBlocks.length,
    });
    
    // ============================================================
    // STEP 3: SEMANTIC ANALYSIS WITH EMBEDDINGS
    // ============================================================
    if (areEmbeddingsAvailable() && result.timeBlocks.length > 0) {
      try {
        logInfo('🔍 Running semantic analysis for duplicates/conflicts');
        
        const embeddingAnalysis = await processWithEmbeddings(result);
        
        if (embeddingAnalysis.semanticInsights.duplicates.length > 0 ||
            embeddingAnalysis.semanticInsights.conflicts.length > 0) {
          
          logInfo('🔄 Refining based on semantic insights', {
            duplicates: embeddingAnalysis.semanticInsights.duplicates.length,
            conflicts: embeddingAnalysis.semanticInsights.conflicts.length,
          });
          
          // Refinement pass with embedding context
          const refinedResult = await structuredLlm.invoke([
            new SystemMessage(`${ANALYSIS_PROMPT}

=== SEMANTIC ANALYSIS FINDINGS ===

${embeddingAnalysis.refinementContext}

REFINEMENT INSTRUCTIONS:
1. Remove or merge duplicates with similarity > 95%
2. Resolve conflicts by keeping most complete entry
3. Validate gaps are legitimate (breaks/lunch) or missing data
4. Ensure final output is clean, deduplicated, conflict-free`),
            new HumanMessage(contextToSend),
          ]);
          
          return {
            success: true,
            ...refinedResult,
            metadata: {
              extractionMode: 'two-agent-with-semantic-analysis',
              embeddingsUsed: true,
              tokenReduction: `${tokenReduction}%`,
              semanticAnalysis: {
                duplicatesFound: embeddingAnalysis.semanticInsights.duplicates.length,
                conflictsFound: embeddingAnalysis.semanticInsights.conflicts.length,
                gapsFound: embeddingAnalysis.semanticInsights.gaps.length,
                statistics: embeddingAnalysis.semanticInsights.statistics,
              },
              processingTime: Date.now() - startTime,
            },
          };
        }
      } catch (embeddingAnalysisError) {
        logWarn('Semantic analysis failed, using initial result', embeddingAnalysisError);
      }
    }
    
    // ============================================================
    // FINAL RESULT
    // ============================================================
    return {
      success: true,
      ...result,
      metadata: {
        extractionMode: 'two-agent-analysis',
        embeddingsUsed,
        tokenReduction: `${tokenReduction}%`,
        processingTime: Date.now() - startTime,
      },
    };
    
  } catch (error) {
    logError('ANALYSIS AGENT FAILED', error);
    
    return {
      success: false,
      teacherName: '',
      timeBlocks: [],
      academicYear: '',
      semester: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
