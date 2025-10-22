/**
 * REAL Integration Test for Intelligent Agent
 * 
 * This test uses REAL OpenAI API, REAL Google AI, and actual timetable images
 * NO MOCKS - All API calls are real!
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { runTimetableExtractionAgent } from '../../src/services/intelligent/extraction.agent';
import { extractTextFromImage } from '../../src/services/ocr.service';
import { extractTimetableWithLLM } from '../../src/services/llm.service';
import * as path from 'path';
import * as fs from 'fs';

describe('Real Agent Integration Tests', () => {
  let testImagePath: string;
  
  beforeAll(() => {
    // Find the actual timetable image in the project
    const possiblePaths = [
      path.join(__dirname, '../../../TA_Assignment_Pack/examples/Teacher Timetable Example 1.1.png'),
      path.join(__dirname, '../../TA_Assignment_Pack/examples/Teacher Timetable Example 1.1.png'),
      path.join(__dirname, '../../../Teacher Timetable Example 1.1.png'),
    ];
    
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        testImagePath = p;
        break;
      }
    }
    
    if (!testImagePath) {
      throw new Error('Could not find Teacher Timetable Example 1.1.png');
    }
    
    console.log(`✓ Found test image: ${testImagePath}`);
  });
  
  test('Real OCR extraction with OpenAI Vision API', async () => {
    console.log('\n🎯 Test 1: Real OCR Extraction');
    console.log('   Using: OpenAI Vision API (GPT-4o-mini)');
    console.log('   Image:', testImagePath);
    
    const result = await extractTextFromImage(testImagePath);
    
    console.log(`\n✓ OCR Results:`);
    console.log(`   - Method: ${result.method}`);
    console.log(`   - Confidence: ${result.confidence}%`);
    console.log(`   - Text Length: ${result.text.length} characters`);
    console.log(`   - Text Sample: ${result.text.substring(0, 150)}...`);
    
    // Validate real results
    expect(result.text).toBeTruthy();
    expect(result.text.length).toBeGreaterThan(50);
    expect(result.confidence).toBeGreaterThan(0);
    expect(['openai_vision', 'google_vision', 'tesseract']).toContain(result.method);
  }, 60000); // 60s timeout for real API
  
  test('Real Intelligent Agent with OpenAI LLM', async () => {
    console.log('\n🎯 Test 2: Real Intelligent Agent');
    console.log('   Using: OpenAI GPT-4o-mini with React Agent');
    console.log('   Tools: rerun_ocr, validate_timetable, correct_time_format, merge_duplicates');
    
    // Step 1: Extract text with real OCR
    const ocrResult = await extractTextFromImage(testImagePath);
    console.log(`\n   Step 1: OCR completed (${ocrResult.confidence}% confidence)`);
    
    // Step 2: Run intelligent agent with real OpenAI
    const agentResult = await runTimetableExtractionAgent(
      testImagePath,
      ocrResult.text,
      ocrResult.confidence,
      ocrResult.method
    );
    
    console.log(`\n✓ Agent Results:`);
    console.log(`   - Success: ${agentResult.success}`);
    console.log(`   - Tools Used: ${agentResult.toolsUsed.length} (${agentResult.toolsUsed.join(', ')})`);
    console.log(`   - Initial Confidence: ${ocrResult.confidence}%`);
    console.log(`   - Final Confidence: ${agentResult.confidence}%`);
    console.log(`   - Processing Steps: ${agentResult.processingSteps.length}`);
    console.log(`   - Agent Output: ${agentResult.agentOutput.substring(0, 200)}...`);
    
    // Validate agent results
    expect(agentResult.success).toBe(true);
    expect(agentResult.processingSteps.length).toBeGreaterThan(0);
    expect(agentResult.confidence).toBeGreaterThanOrEqual(ocrResult.confidence);
    
    // Log all processing steps
    console.log('\n   Processing Steps:');
    agentResult.processingSteps.forEach((step, i) => {
      console.log(`      ${i + 1}. ${step}`);
    });
  }, 120000); // 120s timeout for agent workflow
  
  test('Real LLM Structured Output with OpenAI', async () => {
    console.log('\n🎯 Test 3: Real LLM Structured Output');
    console.log('   Using: OpenAI GPT-4o-mini with Zod schema');
    
    // Step 1: Extract text
    const ocrResult = await extractTextFromImage(testImagePath);
    console.log(`   Step 1: OCR completed`);
    
    // Step 2: Run agent
    const agentResult = await runTimetableExtractionAgent(
      testImagePath,
      ocrResult.text,
      ocrResult.confidence,
      ocrResult.method
    );
    console.log(`   Step 2: Agent processing completed`);
    
    // Step 3: Extract structured timetable with real LLM
    console.log(`   Step 3: Extracting structured timetable with OpenAI...`);
    const timetableResult = await extractTimetableWithLLM(ocrResult.text);
    
    console.log(`\n✓ LLM Results:`);
    console.log(`   - Teacher Name: ${timetableResult.timetableData.teacherName || 'N/A'}`);
    console.log(`   - Time Blocks: ${timetableResult.timetableData.timeBlocks.length}`);
    console.log(`   - Processing Time: ${timetableResult.processingTime}ms`);
    console.log(`   - Model Used: ${timetableResult.model}`);
    
    // Validate structured output
    expect(timetableResult.timetableData).toBeTruthy();
    expect(Array.isArray(timetableResult.timetableData.timeBlocks)).toBe(true);
    expect(timetableResult.model).toContain('gpt-4o-mini');
    
    // Show first 3 time blocks
    if (timetableResult.timetableData.timeBlocks.length > 0) {
      console.log('\n   Sample Time Blocks:');
      timetableResult.timetableData.timeBlocks.slice(0, 3).forEach((block: any, i: number) => {
        console.log(`      ${i + 1}. ${block.dayOfWeek} ${block.startTime}-${block.endTime}: ${block.subject || 'N/A'}`);
      });
    }
  }, 120000); // 120s timeout
  
  test('End-to-End: Image → Agent → LLM → Structured Output', async () => {
    console.log('\n🎯 Test 4: Complete End-to-End Pipeline');
    console.log('   Pipeline: Upload → OCR → Agent → LLM → Validation');
    
    const startTime = Date.now();
    
    // Step 1: OCR with real OpenAI Vision
    console.log('\n   [1/4] OCR Extraction...');
    const ocrResult = await extractTextFromImage(testImagePath);
    console.log(`         ✓ Extracted ${ocrResult.text.length} chars (${ocrResult.confidence}% confidence)`);
    
    // Step 2: Agent processing with real OpenAI
    console.log('\n   [2/4] Intelligent Agent Processing...');
    const agentResult = await runTimetableExtractionAgent(
      testImagePath,
      ocrResult.text,
      ocrResult.confidence,
      ocrResult.method
    );
    console.log(`         ✓ Agent used ${agentResult.toolsUsed.length} tools, confidence: ${agentResult.confidence}%`);
    
    // Step 3: LLM extraction with real OpenAI
    console.log('\n   [3/4] LLM Structured Extraction...');
    const llmResult = await extractTimetableWithLLM(ocrResult.text);
    console.log(`         ✓ Extracted ${llmResult.timetableData.timeBlocks.length} time blocks`);
    
    // Step 4: Validation
    console.log('\n   [4/4] Validation...');
    const hasTimeBlocks = llmResult.timetableData.timeBlocks.length > 0;
    const hasTeacherName = Boolean(llmResult.timetableData.teacherName);
    
    const totalTime = Date.now() - startTime;
    
    console.log(`\n✓ End-to-End Results:`);
    console.log(`   - Total Processing Time: ${totalTime}ms`);
    console.log(`   - OCR Confidence: ${ocrResult.confidence}%`);
    console.log(`   - Agent Confidence: ${agentResult.confidence}%`);
    console.log(`   - Time Blocks Extracted: ${llmResult.timetableData.timeBlocks.length}`);
    console.log(`   - Has Teacher Name: ${hasTeacherName}`);
    console.log(`   - Agent Tools Used: ${agentResult.toolsUsed.join(', ') || 'none'}`);
    
    // Validate complete pipeline
    expect(ocrResult.text.length).toBeGreaterThan(50);
    expect(agentResult.success).toBe(true);
    expect(llmResult.timetableData.timeBlocks.length).toBeGreaterThan(0);
    expect(totalTime).toBeLessThan(180000); // < 3 minutes
  }, 180000); // 180s timeout for complete pipeline
});
