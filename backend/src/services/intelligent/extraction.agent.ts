/**
 * EXTRACTION AGENT (Agent 1)
 * 
 * Advanced Extraction Agent with Embeddings-First Architecture
 * 
 * Workflow:
 * 1. Extract raw text from file (OCR/PDF/DOCX)
 * 2. Create semantic embeddings of extracted text
 * 3. Use embeddings + LLM to enhance and validate extraction
 * 4. Return enriched extraction result to Analysis Agent
 * 
 * NO MOCKS - All real AI/ML services (OpenAI, Google, Tesseract)
 */

import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config } from '../../config/env';
import { extractTextFromImage } from '../ocr.service';
import { extractTextFromPDF } from '../pdf.service';
import { extractTextFromDOCX } from '../docx.service';
import { logInfo, logWarn, logError } from '../../utils/logger';

/**
 * Semantic chunking for embeddings
 * Splits text by structural markers (headers, sections, tables)
 */
function chunkTextSemantically(text: string): string[] {
  const chunks: string[] = [];
  
  // Split by day headers (MONDAY, TUESDAY, etc.) - timetable structure
  const dayPattern = /(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY|Mon|Tue|Wed|Thu|Fri|Sat|Sun)/gi;
  const sections = text.split(dayPattern);
  
  // Recombine day headers with their content
  for (let i = 1; i < sections.length; i += 2) {
    if (sections[i] && sections[i + 1]) {
      chunks.push(sections[i] + '\n' + sections[i + 1]);
    }
  }
  
  // If no day headers, split by table rows or line groups
  if (chunks.length === 0) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // Group every 8-10 lines as a chunk for better context
    for (let i = 0; i < lines.length; i += 8) {
      const chunk = lines.slice(i, i + 8).join('\n');
      if (chunk.trim()) {
        chunks.push(chunk);
      }
    }
  }
  
  // Fallback: return full text
  if (chunks.length === 0 && text.trim()) {
    chunks.push(text);
  }
  
  return chunks;
}

/**
 * Run the Advanced Extraction Agent with Embeddings
 * 
 * @param extractionMethod - The type of extraction to perform ('ocr', 'pdf', 'docx')
 * @param filePath - Absolute path to the file
 * @returns Enriched extraction result with embeddings metadata
 */
export async function runExtractionAgent(
  extractionMethod: 'ocr' | 'pdf' | 'docx',
  filePath: string
): Promise<{
  success: boolean;
  extractedText: string;
  confidence: number;
  method: string;
  embeddingsMetadata?: {
    chunksCreated: number;
    embeddingsGenerated: boolean;
    qualityScore: number;
  };
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    logInfo('🤖 EXTRACTION AGENT: Starting advanced extraction', {
      method: extractionMethod,
      file: filePath,
    });
    
    // ============================================================
    // STEP 1: PERFORM RAW EXTRACTION
    // ============================================================
    logInfo('� STEP 1: Performing raw text extraction');
    
    let rawResult;
    switch (extractionMethod) {
      case 'ocr':
        rawResult = await extractTextFromImage(filePath);
        break;
      case 'pdf':
        rawResult = await extractTextFromPDF(filePath);
        break;
      case 'docx':
        rawResult = await extractTextFromDOCX(filePath);
        break;
      default:
        throw new Error(`Unknown extraction method: ${extractionMethod}`);
    }
    
    const rawText = rawResult.text;
    const rawConfidence = rawResult.confidence || 75;
    const extractionMethod_used = rawResult.method;
    
    logInfo('✅ Raw extraction complete', {
      textLength: rawText.length,
      confidence: rawConfidence,
      method: extractionMethod_used,
    });
    
    // If text is too short, return immediately
    if (!rawText || rawText.trim().length < 20) {
      logWarn('Extracted text too short, skipping embeddings processing');
      return {
        success: true,
        extractedText: rawText,
        confidence: rawConfidence,
        method: extractionMethod_used,
      };
    }
    
    // ============================================================
    // STEP 2: CREATE SEMANTIC EMBEDDINGS
    // ============================================================
    logInfo('🧠 STEP 2: Creating semantic embeddings of extracted text');
    
    const chunks = chunkTextSemantically(rawText);
    logInfo(`📊 Created ${chunks.length} semantic chunks from extracted text`);
    
    let embeddingsGenerated = false;
    let qualityScore = rawConfidence;
    
    if (chunks.length > 0 && config.env.OPENAI_API_KEY) {
      try {
        // Generate embeddings for quality assessment
        const embeddings = new OpenAIEmbeddings({
          apiKey: config.env.OPENAI_API_KEY,
          modelName: 'text-embedding-3-small',
        });
        
        // Create vector store for semantic analysis
        const { MemoryVectorStore } = await import('langchain/vectorstores/memory');
        const vectorStore = await MemoryVectorStore.fromTexts(
          chunks,
          chunks.map((_chunk: string, i: number) => ({ 
            index: i,
            type: 'extracted_content' 
          })),
          embeddings
        );
        
        embeddingsGenerated = true;
        logInfo('✅ Embeddings generated successfully');
        
        // ============================================================
        // STEP 3: LLM-BASED QUALITY ENHANCEMENT
        // ============================================================
        logInfo('🎯 STEP 3: Using LLM to enhance and validate extraction');
        
        // Search for timetable-specific patterns in embeddings
        const timetablePatterns = await vectorStore.similaritySearch(
          'teacher timetable schedule class time day subject room period',
          Math.min(6, chunks.length)
        );
        
        const relevantContext = timetablePatterns
          .map((doc: any) => doc.pageContent)
          .join('\n\n');
        
        // Create LLM for quality assessment and enhancement
        const llm = new ChatOpenAI({
          modelName: 'gpt-4o-mini',
          temperature: 0.1,
          apiKey: config.env.OPENAI_API_KEY,
        });
        
        const EXTRACTION_ENHANCEMENT_PROMPT = `You are an Advanced Extraction Quality Analyst specializing in timetable document analysis.

YOUR MISSION:
Analyze the extracted text quality and provide enhancement recommendations to maximize data extraction accuracy for the downstream Analysis Agent.

EXTRACTION CONTEXT:
- Source File: ${filePath}
- Extraction Method: ${extractionMethod_used}
- Raw Confidence: ${rawConfidence}%
- Text Length: ${rawText.length} characters
- Semantic Chunks Created: ${chunks.length}
- Embeddings Generated: YES

EXTRACTED TEXT SAMPLE (Most Relevant Chunks):
${relevantContext}

YOUR ANALYSIS TASKS:

1. **QUALITY ASSESSMENT** (Evaluate):
   - Text clarity and readability
   - Presence of timetable-specific keywords (teacher, class, time, day, subject, room)
   - Table structure detection (rows, columns, headers)
   - Completeness (are all days/periods likely present?)
   - Noise level (OCR artifacts, formatting issues, extra characters)

2. **CONFIDENCE SCORING** (Calculate 0-100):
   Base Factors:
   - OCR/Extraction Method Quality: ${rawConfidence}%
   - Keyword Presence: +10% if strong timetable keywords found
   - Structure Clarity: +10% if clear table structure detected
   - Completeness: +5% if full week schedule detected
   - Low Noise: +5% if minimal OCR artifacts
   
   Deductions:
   - High Noise: -15% if many artifacts/errors
   - Missing Days: -10% if incomplete schedule
   - Poor Structure: -10% if no clear table format

3. **TEXT ENHANCEMENT RECOMMENDATIONS**:
   - Identify obvious OCR errors that can be corrected
   - Suggest missing structural markers (day headers, time columns)
   - Point out ambiguous sections that need clarification
   - Recommend preprocessing for next extraction attempt if quality < 70%

4. **TIMETABLE-SPECIFIC VALIDATION**:
   ✓ Check for day names (Monday-Sunday)
   ✓ Check for time patterns (08:00, 2:30 PM, Period 1, etc.)
   ✓ Check for subject/class names
   ✓ Check for teacher name in headers/footers
   ✓ Check for room numbers
   ✓ Check for grade/section indicators

RESPONSE FORMAT:
Provide a structured JSON response with:
{
  "qualityScore": <number 0-100>,
  "timetableKeywordsFound": <number of timetable keywords detected>,
  "structureDetected": <boolean - is table structure clear?>,
  "completenessEstimate": <percentage 0-100 of likely completeness>,
  "noiseLevel": <"low" | "medium" | "high">,
  "enhancementRecommendations": <array of strings>,
  "readyForAnalysis": <boolean - is text quality sufficient for Analysis Agent?>,
  "notes": <string - brief summary of findings>
}

Analyze the extraction quality now and provide your assessment.`;

        const enhancementResponse = await llm.invoke([
          new SystemMessage(EXTRACTION_ENHANCEMENT_PROMPT),
          new HumanMessage('Analyze the extracted text quality and provide your assessment.'),
        ]);
        
        // Parse LLM response
        let enhancementData;
        try {
          const responseText = typeof enhancementResponse.content === 'string' 
            ? enhancementResponse.content 
            : JSON.stringify(enhancementResponse.content);
          
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            enhancementData = JSON.parse(jsonMatch[0]);
            qualityScore = enhancementData.qualityScore || rawConfidence;
            
            logInfo('✅ LLM enhancement analysis complete', {
              qualityScore,
              readyForAnalysis: enhancementData.readyForAnalysis,
              noiseLevel: enhancementData.noiseLevel,
            });
          }
        } catch (parseError) {
          logWarn('Failed to parse LLM enhancement response, using raw confidence', parseError);
          qualityScore = rawConfidence;
        }
        
      } catch (embeddingError) {
        logWarn('⚠️  Embeddings processing failed, using raw extraction', embeddingError);
        embeddingsGenerated = false;
        qualityScore = rawConfidence;
      }
    } else {
      logInfo('⏭️  Skipping embeddings (no API key or insufficient chunks)');
    }
    
    // ============================================================
    // STEP 4: RETURN ENRICHED RESULT
    // ============================================================
    const processingTime = Date.now() - startTime;
    
    logInfo('🎉 EXTRACTION AGENT COMPLETE', {
      originalConfidence: rawConfidence,
      enhancedQuality: qualityScore,
      embeddingsUsed: embeddingsGenerated,
      processingTime,
    });
    
    return {
      success: true,
      extractedText: rawText,
      confidence: qualityScore,
      method: extractionMethod_used,
      embeddingsMetadata: {
        chunksCreated: chunks.length,
        embeddingsGenerated,
        qualityScore,
      },
    };
    
  } catch (error) {
    logError('EXTRACTION AGENT FAILED', error);
    
    // No fallback - fail properly with clear error
    return {
      success: false,
      extractedText: '',
      confidence: 0,
      method: extractionMethod,
      error: error instanceof Error ? error.message : 'Unknown extraction error',
    };
  }
}

