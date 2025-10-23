import path from 'path';
import { extractTextFromImage } from '../../src/services/ocr.service';
import { extractWithAgent } from '../../src/services/intelligent/intelligent.service';
import { extractTimetableWithLLM } from '../../src/services/llm.service';

/**
 * Comprehensive test suite for all example timetable files
 * Tests real extraction with all 5 example files provided
 */
describe('All Example Timetable Files - Real API Tests', () => {
  // 3 minutes timeout for real API calls
  jest.setTimeout(180000);

  const examplesDir = path.resolve(__dirname, '../../../TA_Assignment_Pack/examples');
  
  const testFiles = [
    {
      name: 'Teacher Timetable Example 1.1.png',
      path: path.join(examplesDir, 'Teacher Timetable Example 1.1.png'),
      type: 'png',
      description: 'Primary school teacher timetable (Week view)',
    },
    {
      name: 'Teacher Timetable Example 1.2.png',
      path: path.join(examplesDir, 'Teacher Timetable Example 1.2.png'),
      type: 'png',
      description: 'Alternative teacher timetable format',
    },
    {
      name: 'Teacher Timetable Example 2.pdf',
      path: path.join(examplesDir, 'Teacher Timetable Example 2.pdf'),
      type: 'pdf',
      description: 'PDF format timetable',
    },
    {
      name: 'Teacher Timetable Example 3.png',
      path: path.join(examplesDir, 'Teacher Timetable Example 3.png'),
      type: 'png',
      description: 'Third timetable variation',
    },
    {
      name: 'Teacher Timetable Example 4.jpeg',
      path: path.join(examplesDir, 'Teacher Timetable Example 4.jpeg'),
      type: 'jpeg',
      description: 'JPEG format timetable',
    },
  ];

  // Test each file individually
  testFiles.forEach((testFile) => {
    describe(`${testFile.name}`, () => {
      
      test(`📄 OCR Extraction - ${testFile.description}`, async () => {
        console.log(`\n📄 Testing: ${testFile.name}`);
        console.log(`   Description: ${testFile.description}`);
        console.log(`   File Type: ${testFile.type.toUpperCase()}`);
        
        const startTime = Date.now();
        
        // Perform OCR extraction
        const ocrResult = await extractTextFromImage(testFile.path);
        
        const processingTime = Date.now() - startTime;
        
        console.log(`\n   ✅ OCR Results:`);
        console.log(`      - Method: ${ocrResult.method}`);
        console.log(`      - Confidence: ${ocrResult.confidence}%`);
        console.log(`      - Text Length: ${ocrResult.text.length} characters`);
        console.log(`      - Processing Time: ${(processingTime / 1000).toFixed(2)}s`);
        console.log(`      - Text Sample: ${ocrResult.text.substring(0, 100)}...`);
        
        // Assertions
        expect(ocrResult.text).toBeTruthy();
        expect(ocrResult.text.length).toBeGreaterThan(50);
        expect(ocrResult.confidence).toBeGreaterThan(0);
        expect(ocrResult.method).toBeTruthy();
      });

      test(`🤖 Intelligent Agent Extraction - ${testFile.description}`, async () => {
        console.log(`\n🤖 Testing Agent with: ${testFile.name}`);
        
        const startTime = Date.now();
        
        // First get OCR text
        const ocrResult = await extractTextFromImage(testFile.path);
        console.log(`   Step 1: OCR completed (${ocrResult.confidence}% confidence)`);
        
        // Run intelligent agent (returns TimetableExtractionResult with metadata)
        const agentResult = await extractWithAgent(ocrResult.text, ocrResult.confidence, ocrResult.method, testFile.path);
        
        const processingTime = Date.now() - startTime;
        
        const metadata = agentResult.metadata || {};
        
        console.log(`\n   ✅ Agent Results:`);
        console.log(`      - Time Blocks: ${agentResult.timeBlocks.length}`);
        console.log(`      - Teacher: ${agentResult.teacherName || 'N/A'}`);
        console.log(`      - Tools Used: ${metadata.agentToolsUsed?.length || 0} (${metadata.agentToolsUsed?.join(', ') || 'none'})`);
        console.log(`      - Initial Confidence: ${ocrResult.confidence}%`);
        console.log(`      - Enhanced Confidence: ${metadata.enhancedConfidence || 'N/A'}%`);
        console.log(`      - Agent Steps: ${metadata.agentSteps || 0}`);
        console.log(`      - Total Processing Time: ${(processingTime / 1000).toFixed(2)}s`);
        
        // Assertions
        expect(agentResult.timeBlocks).toBeDefined();
        expect(agentResult.timeBlocks.length).toBeGreaterThan(0);
        expect(agentResult.timeBlocks[0].dayOfWeek).toBeTruthy();
        expect(agentResult.timeBlocks[0].subject).toBeTruthy();
      });

      test(`📊 Full Extraction Pipeline - ${testFile.description}`, async () => {
        console.log(`\n📊 Full Pipeline Test: ${testFile.name}`);
        
        const pipelineStart = Date.now();
        
        // Step 1: OCR
        console.log(`   [1/3] OCR Extraction...`);
        const ocrStart = Date.now();
        const ocrResult = await extractTextFromImage(testFile.path);
        const ocrTime = Date.now() - ocrStart;
        console.log(`         ✓ Completed in ${(ocrTime / 1000).toFixed(2)}s (${ocrResult.text.length} chars, ${ocrResult.confidence}% confidence)`);
        
        // Step 2: Agent Processing
        console.log(`   [2/3] Intelligent Agent Processing...`);
        const agentStart = Date.now();
        const agentResult = await extractWithAgent(ocrResult.text, ocrResult.confidence, ocrResult.method, testFile.path);
        const agentTime = Date.now() - agentStart;
        const metadata = agentResult.metadata || {};
        console.log(`         ✓ Completed in ${(agentTime / 1000).toFixed(2)}s (${metadata.agentToolsUsed?.length || 0} tools used, ${metadata.enhancedConfidence || 'N/A'}% confidence)`);
        
        // Step 3: LLM Structured Extraction
        console.log(`   [3/3] LLM Structured Extraction...`);
        const llmStart = Date.now();
        const llmResult = await extractTimetableWithLLM(ocrResult.text);
        const llmTime = Date.now() - llmStart;
        console.log(`         ✓ Completed in ${(llmTime / 1000).toFixed(2)}s (${llmResult.timetableData.timeBlocks.length} time blocks extracted)`);
        
        const totalTime = Date.now() - pipelineStart;
        
        console.log(`\n   📊 Pipeline Summary:`);
        console.log(`      ═══════════════════════════════════════════════`);
        console.log(`      📝 File: ${testFile.name}`);
        console.log(`      📏 Type: ${testFile.type.toUpperCase()}`);
        console.log(`      ⏱️  Total Time: ${(totalTime / 1000).toFixed(2)}s`);
        console.log(`      ├─ OCR: ${(ocrTime / 1000).toFixed(2)}s (${((ocrTime / totalTime) * 100).toFixed(1)}%)`);
        console.log(`      ├─ Agent: ${(agentTime / 1000).toFixed(2)}s (${((agentTime / totalTime) * 100).toFixed(1)}%)`);
        console.log(`      └─ LLM: ${(llmTime / 1000).toFixed(2)}s (${((llmTime / totalTime) * 100).toFixed(1)}%)`);
        console.log(`      📊 Text Extracted: ${ocrResult.text.length} chars`);
        console.log(`      🎯 OCR Confidence: ${ocrResult.confidence}%`);
        console.log(`      🤖 Agent Confidence: ${metadata.enhancedConfidence || 'N/A'}%`);
        console.log(`      🛠️  Tools Used: ${metadata.agentToolsUsed?.join(', ') || 'none'}`);
        console.log(`      📅 Time Blocks: ${llmResult.timetableData.timeBlocks.length}`);
        console.log(`      👨‍🏫 Teacher: ${llmResult.timetableData.teacherName || 'N/A'}`);
        console.log(`      📚 Semester: ${llmResult.timetableData.semester || 'N/A'}`);
        console.log(`      ═══════════════════════════════════════════════\n`);
        
        // Assertions
        expect(ocrResult.text.length).toBeGreaterThan(50);
        expect(agentResult.timeBlocks).toBeDefined();
        expect(agentResult.timeBlocks.length).toBeGreaterThan(0);
        expect(llmResult.timetableData.timeBlocks.length).toBeGreaterThan(0);
        expect(llmResult.timetableData.timeBlocks[0].dayOfWeek).toBeTruthy();
        expect(llmResult.timetableData.timeBlocks[0].startTime).toBeTruthy();
        expect(llmResult.timetableData.timeBlocks[0].subject).toBeTruthy();
      });
    });
  });

  // Summary test - compare all files
  test('📈 Performance Comparison - All Files', async () => {
    console.log('\n\n📈 PERFORMANCE COMPARISON ACROSS ALL FILES');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const results = [];
    
    for (const testFile of testFiles) {
      const startTime = Date.now();
      
      const ocrResult = await extractTextFromImage(testFile.path);
      const agentResult = await extractWithAgent(ocrResult.text, ocrResult.confidence, ocrResult.method, testFile.path);
      const llmResult = await extractTimetableWithLLM(ocrResult.text);
      
      const totalTime = Date.now() - startTime;
      const metadata = agentResult.metadata || {};
      
      results.push({
        name: testFile.name,
        type: testFile.type,
        totalTime,
        ocrConfidence: ocrResult.confidence,
        agentConfidence: metadata.enhancedConfidence || ocrResult.confidence,
        confidenceGain: (metadata.enhancedConfidence || ocrResult.confidence) - ocrResult.confidence,
        textLength: ocrResult.text.length,
        timeBlocks: llmResult.timetableData.timeBlocks.length,
        toolsUsed: metadata.agentToolsUsed?.length || 0,
      });
    }
    
    // Sort by performance
    results.sort((a, b) => a.totalTime - b.totalTime);
    
    console.log('┌────────────────────────────────────────────────────────────────┐');
    console.log('│                    PERFORMANCE RANKING                          │');
    console.log('├────────────────────────────────────────────────────────────────┤');
    
    results.forEach((result, index) => {
      console.log(`│ ${index + 1}. ${result.name.padEnd(45)} │`);
      console.log(`│    ⏱️  Time: ${(result.totalTime / 1000).toFixed(2)}s | 🎯 Confidence: ${result.ocrConfidence}%→${result.agentConfidence}% (+${result.confidenceGain}%)`.padEnd(63) + '│');
      console.log(`│    📝 ${result.textLength} chars | 📅 ${result.timeBlocks} blocks | 🛠️  ${result.toolsUsed} tools`.padEnd(63) + '│');
      console.log('├────────────────────────────────────────────────────────────────┤');
    });
    
    console.log('└────────────────────────────────────────────────────────────────┘\n');
    
    // Calculate statistics
    const avgTime = results.reduce((sum, r) => sum + r.totalTime, 0) / results.length;
    const avgConfidence = results.reduce((sum, r) => sum + r.agentConfidence, 0) / results.length;
    const avgGain = results.reduce((sum, r) => sum + r.confidenceGain, 0) / results.length;
    const totalBlocks = results.reduce((sum, r) => sum + r.timeBlocks, 0);
    
    console.log('📊 AGGREGATE STATISTICS:');
    console.log(`   • Average Processing Time: ${(avgTime / 1000).toFixed(2)}s`);
    console.log(`   • Average Agent Confidence: ${avgConfidence.toFixed(1)}%`);
    console.log(`   • Average Confidence Gain: +${avgGain.toFixed(1)}%`);
    console.log(`   • Total Time Blocks Extracted: ${totalBlocks}`);
    console.log(`   • Fastest File: ${results[0].name} (${(results[0].totalTime / 1000).toFixed(2)}s)`);
    console.log(`   • Slowest File: ${results[results.length - 1].name} (${(results[results.length - 1].totalTime / 1000).toFixed(2)}s)`);
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    
    // All files should pass
    expect(results.length).toBe(5);
    results.forEach(result => {
      expect(result.agentConfidence).toBeGreaterThan(0);
      expect(result.timeBlocks).toBeGreaterThan(0);
    });
  });
});
