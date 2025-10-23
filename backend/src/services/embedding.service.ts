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
 *    Learning Yogi (LY) assignment purpose and should be used as a reference
 *    or learning material only.
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


/**
 * Embedding-Enhanced Extraction Service
 * 
 * This service implements semantic understanding using OpenAI embeddings
 * to improve data quality between the two-agent pipeline:
 * 
 * Agent 1 (Extraction) → Embeddings → Semantic Analysis → Agent 2 (Refinement)
 * 
 * Benefits:
 * - Duplicate detection via semantic similarity
 * - Conflict detection via time overlap analysis
 * - Gap detection for missing data
 * - Context-aware refinement instead of raw JSON passing
 */

import { OpenAIEmbeddings } from '@langchain/openai';
import { SimpleVectorStore } from './simple-vector-store';
import { Document } from '@langchain/core/documents';
import { type TimeBlock, type TimetableData } from './llm.service';
import { logInfo, logError, logWarn } from '../utils/logger';
import { config } from '../config/env';

interface EmbeddedTimeBlock extends TimeBlock {
  embedding?: number[];
  semanticContext?: string;
  blockIndex?: number;
}

export interface SemanticInsights {
  duplicates: Array<{
    original: string;
    duplicate: string;
    similarity: number;
    originalIndex: number;
    duplicateIndex: number;
  }>;
  conflicts: Array<{
    block1: string;
    block2: string;
    reason: string;
    index1: number;
    index2: number;
  }>;
  gaps: Array<{
    day: string;
    time: string;
    reason: string;
  }>;
  statistics: {
    totalBlocks: number;
    blocksPerDay: Record<string, number>;
    averageBlockDuration: number;
    totalDuration: number;
  };
}

export interface EnhancedExtractionResult {
  timetableData: TimetableData;
  embeddedBlocks: EmbeddedTimeBlock[];
  vectorStore: SimpleVectorStore;
  semanticInsights: SemanticInsights;
  refinementContext: string;
}

/**
 * Initialize OpenAI embeddings model
 */
function initializeEmbeddings(): OpenAIEmbeddings {
  if (!config.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key required for embeddings');
  }

  return new OpenAIEmbeddings({
    openAIApiKey: config.env.OPENAI_API_KEY,
    modelName: 'text-embedding-3-small', // Cost-effective, 1536 dimensions
  });
}

/**
 * Convert TimeBlock to semantic text representation for embedding
 */
function timeBlockToSemanticText(block: TimeBlock, teacherName: string): string {
  return `
Teacher: ${teacherName}
Day: ${block.dayOfWeek}
Time: ${block.startTime} to ${block.endTime}
Subject: ${block.subject}
Location: ${block.classroom || 'Not specified'}
Class: ${block.grade || 'Not specified'} ${block.section || ''}
Notes: ${block.notes || 'None'}
`.trim();
}

/**
 * Convert time string (HH:mm) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Calculate duration of a time block in minutes
 */
function calculateDuration(startTime: string, endTime: string): number {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
}

/**
 * MAIN FUNCTION: Process extraction with embeddings
 * This is called after Agent 1 (Data Extraction) completes
 */
export async function processWithEmbeddings(
  timetableData: TimetableData
): Promise<EnhancedExtractionResult> {
  const startTime = Date.now();

  try {
    logInfo('🧠 Starting embedding-enhanced semantic analysis', {
      teacherName: timetableData.teacherName,
      totalBlocks: timetableData.timeBlocks.length,
    });

    // Step 1: Initialize embeddings model
    const embeddings = initializeEmbeddings();

    // Step 2: Create semantic documents for each time block
    const documents: Document[] = timetableData.timeBlocks.map((block, index) => {
      const semanticText = timeBlockToSemanticText(block, timetableData.teacherName);

      return new Document({
        pageContent: semanticText,
        metadata: {
          blockIndex: index,
          dayOfWeek: block.dayOfWeek,
          startTime: block.startTime,
          endTime: block.endTime,
          subject: block.subject,
          classroom: block.classroom,
          grade: block.grade,
          section: block.section,
          notes: block.notes,
        },
      });
    });

    // Step 3: Create vector store with embeddings
    logInfo('📊 Creating vector store with embeddings', {
      totalDocuments: documents.length,
    });

    const vectorStore = await SimpleVectorStore.fromDocuments(documents, embeddings);

    // Step 4: Generate embeddings for each block
    logInfo('🔢 Generating individual block embeddings');

    const embeddedBlocks: EmbeddedTimeBlock[] = await Promise.all(
      timetableData.timeBlocks.map(async (block, index) => {
        const semanticText = timeBlockToSemanticText(block, timetableData.teacherName);
        const embedding = await embeddings.embedQuery(semanticText);

        return {
          ...block,
          embedding,
          semanticContext: semanticText,
          blockIndex: index,
        };
      })
    );

    // Step 5: Perform semantic analysis
    logInfo('🔍 Performing semantic analysis');

    const semanticInsights = await performSemanticAnalysis(
      embeddedBlocks,
      vectorStore,
      timetableData
    );

    // Step 6: Build refinement context
    const refinementContext = buildRefinementContext(timetableData, semanticInsights);

    const processingTime = Date.now() - startTime;

    logInfo('✅ Embedding-enhanced analysis completed', {
      totalBlocks: embeddedBlocks.length,
      duplicatesFound: semanticInsights.duplicates.length,
      conflictsFound: semanticInsights.conflicts.length,
      gapsFound: semanticInsights.gaps.length,
      processingTime,
    });

    return {
      timetableData,
      embeddedBlocks,
      vectorStore,
      semanticInsights,
      refinementContext,
    };
  } catch (error) {
    logError('Embedding-enhanced analysis failed', error);
    // Gracefully degrade: return without embeddings
    logWarn('Falling back to non-embedding mode');
    
    return {
      timetableData,
      embeddedBlocks: timetableData.timeBlocks.map((block, index) => ({
        ...block,
        blockIndex: index,
      })),
      vectorStore: null as any, // Will not be used in fallback
      semanticInsights: {
        duplicates: [],
        conflicts: [],
        gaps: [],
        statistics: {
          totalBlocks: timetableData.timeBlocks.length,
          blocksPerDay: {},
          averageBlockDuration: 0,
          totalDuration: 0,
        },
      },
      refinementContext: 'Semantic analysis unavailable - using basic mode',
    };
  }
}

/**
 * Perform comprehensive semantic analysis using embeddings
 */
async function performSemanticAnalysis(
  blocks: EmbeddedTimeBlock[],
  vectorStore: SimpleVectorStore,
  timetableData: TimetableData
): Promise<SemanticInsights> {
  const duplicates: SemanticInsights['duplicates'] = [];
  const conflicts: SemanticInsights['conflicts'] = [];
  const gaps: SemanticInsights['gaps'] = [];

  // 1. DUPLICATE DETECTION using semantic similarity
  logInfo('🔎 Detecting duplicates via semantic similarity');
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const semanticText = block.semanticContext || timeBlockToSemanticText(block, timetableData.teacherName);

    // Find similar blocks (top 3 most similar)
    const similarDocs = await vectorStore.similaritySearchWithScore(semanticText, 3);

    for (const [doc, score] of similarDocs) {
      const similarBlockIndex = doc.metadata.blockIndex as number;

      // Skip self-comparison and already processed pairs
      if (similarBlockIndex === i) continue;
      if (similarBlockIndex < i) continue; // Avoid duplicate pairs

      // High similarity (>0.95) = likely duplicate
      if (score > 0.95) {
        duplicates.push({
          original: `${block.dayOfWeek} ${block.startTime}-${block.endTime}: ${block.subject}`,
          duplicate: `${blocks[similarBlockIndex].dayOfWeek} ${blocks[similarBlockIndex].startTime}-${blocks[similarBlockIndex].endTime}: ${blocks[similarBlockIndex].subject}`,
          similarity: score,
          originalIndex: i,
          duplicateIndex: similarBlockIndex,
        });
      }
    }
  }

  // 2. CONFLICT DETECTION - time overlaps on same day
  logInfo('⚠️ Detecting time conflicts');
  
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const block1 = blocks[i];
      const block2 = blocks[j];

      // Only check same day
      if (block1.dayOfWeek === block2.dayOfWeek) {
        const start1 = timeToMinutes(block1.startTime);
        const end1 = timeToMinutes(block1.endTime);
        const start2 = timeToMinutes(block2.startTime);
        const end2 = timeToMinutes(block2.endTime);

        // Check for overlap: (start1 < end2) AND (end1 > start2)
        if (start1 < end2 && end1 > start2) {
          conflicts.push({
            block1: `${block1.dayOfWeek} ${block1.startTime}-${block1.endTime}: ${block1.subject}`,
            block2: `${block2.dayOfWeek} ${block2.startTime}-${block2.endTime}: ${block2.subject}`,
            reason: 'Time overlap detected',
            index1: i,
            index2: j,
          });
        }
      }
    }
  }

  // 3. GAP DETECTION - missing expected slots
  logInfo('🕳️ Detecting schedule gaps');
  
  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  
  for (const day of daysOfWeek) {
    const dayBlocks = blocks.filter((b) => b.dayOfWeek === day);

    if (dayBlocks.length === 0) {
      gaps.push({
        day,
        time: 'Full day',
        reason: `No entries found for ${day}`,
      });
    } else {
      // Sort by start time
      const sortedBlocks = [...dayBlocks].sort((a, b) =>
        timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
      );

      // Check for large gaps between consecutive blocks
      for (let i = 0; i < sortedBlocks.length - 1; i++) {
        const currentEnd = timeToMinutes(sortedBlocks[i].endTime);
        const nextStart = timeToMinutes(sortedBlocks[i + 1].startTime);
        const gapMinutes = nextStart - currentEnd;

        // Flag gaps larger than 2 hours (excluding lunch/break periods)
        if (gapMinutes > 120) {
          gaps.push({
            day,
            time: `${sortedBlocks[i].endTime} to ${sortedBlocks[i + 1].startTime}`,
            reason: `Large gap of ${Math.floor(gapMinutes / 60)}h ${gapMinutes % 60}m`,
          });
        }
      }
    }
  }

  // 4. STATISTICS CALCULATION
  const statistics = calculateStatistics(blocks);

  return {
    duplicates,
    conflicts,
    gaps,
    statistics,
  };
}

/**
 * Calculate timetable statistics
 */
function calculateStatistics(blocks: EmbeddedTimeBlock[]): SemanticInsights['statistics'] {
  const blocksPerDay: Record<string, number> = {};
  let totalDuration = 0;

  for (const block of blocks) {
    // Count blocks per day
    blocksPerDay[block.dayOfWeek] = (blocksPerDay[block.dayOfWeek] || 0) + 1;

    // Calculate total duration
    const duration = calculateDuration(block.startTime, block.endTime);
    totalDuration += duration;
  }

  const averageBlockDuration = blocks.length > 0 ? totalDuration / blocks.length : 0;

  return {
    totalBlocks: blocks.length,
    blocksPerDay,
    averageBlockDuration: Math.round(averageBlockDuration),
    totalDuration,
  };
}

/**
 * Build concise refinement context for Agent 2
 * This replaces passing full JSON in the prompt
 */
export function buildRefinementContext(
  timetableData: TimetableData,
  semanticInsights: SemanticInsights
): string {
  let context = '=== SEMANTIC ANALYSIS RESULTS ===\n\n';

  // Summary statistics
  context += `EXTRACTION SUMMARY:\n`;
  context += `- Teacher: ${timetableData.teacherName}\n`;
  context += `- Total blocks: ${semanticInsights.statistics.totalBlocks}\n`;
  context += `- Academic Year: ${timetableData.academicYear || 'Not found'}\n`;
  context += `- Semester: ${timetableData.semester || 'Not found'}\n`;
  context += `- Average block duration: ${semanticInsights.statistics.averageBlockDuration} minutes\n`;
  context += `- Total teaching time: ${Math.floor(semanticInsights.statistics.totalDuration / 60)} hours ${semanticInsights.statistics.totalDuration % 60} minutes\n\n`;

  // Blocks per day
  context += `BLOCKS PER DAY:\n`;
  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  for (const day of daysOfWeek) {
    const count = semanticInsights.statistics.blocksPerDay[day] || 0;
    if (count > 0) {
      context += `- ${day}: ${count} blocks\n`;
    }
  }
  context += '\n';

  // Duplicates found
  if (semanticInsights.duplicates.length > 0) {
    context += `⚠️ DUPLICATES DETECTED (${semanticInsights.duplicates.length}):\n`;
    semanticInsights.duplicates.forEach((dup, i) => {
      context += `${i + 1}. [Block ${dup.originalIndex}] ${dup.original}\n`;
      context += `   ≈ [Block ${dup.duplicateIndex}] ${dup.duplicate}\n`;
      context += `   Similarity: ${(dup.similarity * 100).toFixed(1)}%\n`;
    });
    context += '\n';
  } else {
    context += `✅ No duplicates detected\n\n`;
  }

  // Conflicts found
  if (semanticInsights.conflicts.length > 0) {
    context += `⚠️ TIME CONFLICTS DETECTED (${semanticInsights.conflicts.length}):\n`;
    semanticInsights.conflicts.forEach((conflict, i) => {
      context += `${i + 1}. [Block ${conflict.index1}] ${conflict.block1}\n`;
      context += `   vs [Block ${conflict.index2}] ${conflict.block2}\n`;
      context += `   Reason: ${conflict.reason}\n`;
    });
    context += '\n';
  } else {
    context += `✅ No time conflicts detected\n\n`;
  }

  // Gaps found
  if (semanticInsights.gaps.length > 0) {
    context += `📋 SCHEDULE GAPS DETECTED (${semanticInsights.gaps.length}):\n`;
    semanticInsights.gaps.forEach((gap, i) => {
      context += `${i + 1}. ${gap.day} - ${gap.time}\n`;
      context += `   Reason: ${gap.reason}\n`;
    });
    context += '\n';
  } else {
    context += `✅ No significant gaps detected\n\n`;
  }

  // Refinement instructions
  context += `=== REFINEMENT TASKS ===\n\n`;
  
  if (semanticInsights.duplicates.length > 0) {
    context += `1. RESOLVE DUPLICATES: Merge or remove duplicate entries while preserving most complete data\n`;
  }
  
  if (semanticInsights.conflicts.length > 0) {
    context += `2. FIX CONFLICTS: Resolve time overlaps by adjusting times or removing incorrect entries\n`;
  }
  
  if (semanticInsights.gaps.length > 0) {
    context += `3. VALIDATE GAPS: Confirm if gaps are legitimate breaks/lunch or missing data\n`;
  }
  
  context += `4. CANONICALIZE: Standardize room names (Rm→Room), subjects (Maths→Mathematics), grades\n`;
  context += `5. VALIDATE FORMATS: Ensure all times are HH:mm, days are uppercase, no invalid data\n\n`;

  context += `=== EVIDENCE-BASED RULES ===\n`;
  context += `✓ Only merge duplicates with similarity > 95%\n`;
  context += `✓ Resolve conflicts by keeping most complete entry\n`;
  context += `✓ Do NOT invent data - use only what's extracted\n`;
  context += `✓ Mark uncertain refinements with notes\n`;

  return context;
}

/**
 * Export helper function to check if embeddings are available
 */
export function areEmbeddingsAvailable(): boolean {
  return !!config.env.OPENAI_API_KEY;
}
