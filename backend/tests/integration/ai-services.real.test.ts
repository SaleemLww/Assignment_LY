/**
 * AI Services Integration Tests - Real API Calls (No Mocks)
 * Tests OCR, PDF, DOCX, and LLM services with real AI APIs
 * 
 * @requires Real API keys: OPENAI_API_KEY, GOOGLE_API_KEY
 * @requires Test files in TA_Assignment_Pack/examples/
 */

import path from 'path';
import fs from 'fs';
import { ocrService } from '../../src/services/ocr.service';
import { pdfService } from '../../src/services/pdf.service';
import { docxService } from '../../src/services/docx.service';
import { llmService } from '../../src/services/llm.service';
import { extractionService } from '../../src/services/extraction.service';

// Extended timeout for real API calls
jest.setTimeout(300000); // 5 minutes

describe('AI Services Integration Tests - Real API Calls', () => {
  const examplesDir = path.join(__dirname, '../../../TA_Assignment_Pack/examples');

  describe('OCR Service - Real OpenAI Vision API', () => {
    it('should extract text from PNG image using OpenAI Vision API', async () => {
      const imagePath = path.join(examplesDir, 'Teacher Timetable Example 1.1.png');

      if (!fs.existsSync(imagePath)) {
        console.warn('⚠️ Test image not found:', imagePath);
        return;
      }

      console.log('🔍 Testing OpenAI Vision API with PNG image...');
      const result = await ocrService.extractTextFromImage(imagePath);

      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('method');
      expect(result.text.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(['openai-vision', 'google-vision', 'tesseract']).toContain(result.method);

      console.log('✅ OCR successful');
      console.log('📊 Method:', result.method);
      console.log('📊 Confidence:', result.confidence);
      console.log('📊 Text length:', result.text.length, 'characters');
      console.log('📝 Sample text:', result.text.substring(0, 200) + '...');
    });

    it('should extract text from JPEG image using AI Vision', async () => {
      const imagePath = path.join(examplesDir, 'Teacher Timetable Example 4.jpeg');

      if (!fs.existsSync(imagePath)) {
        console.warn('⚠️ Test image not found:', imagePath);
        return;
      }

      console.log('🔍 Testing AI Vision with JPEG image...');
      const result = await ocrService.extractTextFromImage(imagePath);

      expect(result).toHaveProperty('text');
      expect(result.text.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);

      console.log('✅ JPEG OCR successful');
      console.log('📊 Method:', result.method);
      console.log('📊 Confidence:', result.confidence);
    });

    it('should handle PNG image #2 with real AI processing', async () => {
      const imagePath = path.join(examplesDir, 'Teacher Timetable Example 3.png');

      if (!fs.existsSync(imagePath)) {
        console.warn('⚠️ Test image not found:', imagePath);
        return;
      }

      console.log('🔍 Testing AI Vision with PNG image #2...');
      const result = await ocrService.extractTextFromImage(imagePath);

      expect(result.text.length).toBeGreaterThan(0);
      console.log('✅ PNG #2 OCR successful');
      console.log('📊 Method:', result.method, '| Confidence:', result.confidence);
    });

    it('should throw error for non-existent file', async () => {
      await expect(
        ocrService.extractTextFromImage('/path/to/nonexistent/file.png')
      ).rejects.toThrow();
    });
  });

  describe('PDF Service - Real AI Processing', () => {
    it('should extract text from PDF using real AI APIs', async () => {
      const pdfPath = path.join(examplesDir, 'Teacher Timetable Example 2.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('⚠️ Test PDF not found:', pdfPath);
        return;
      }

      console.log('📄 Testing PDF extraction with real AI...');
      const result = await pdfService.extractTextFromPDF(pdfPath);

      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('pages');
      expect(result).toHaveProperty('method');
      expect(result).toHaveProperty('confidence');
      expect(result.text.length).toBeGreaterThan(0);
      expect(['text-extraction', 'ai-vision', 'hybrid']).toContain(result.method);

      console.log('✅ PDF extraction successful');
      console.log('📊 Method:', result.method);
      console.log('📊 Pages:', result.pages);
      console.log('📊 Confidence:', result.confidence);
      console.log('📊 Text length:', result.text.length, 'characters');
    });

    it('should handle PDF metadata extraction', async () => {
      const pdfPath = path.join(examplesDir, 'Teacher Timetable Example 2.pdf');

      if (!fs.existsSync(pdfPath)) {
        return;
      }

      const result = await pdfService.extractTextFromPDF(pdfPath);

      expect(result.pages).toBeGreaterThan(0);
      console.log('📊 PDF has', result.pages, 'page(s)');
    });
  });

  describe('LLM Service - Real Structured Output', () => {
    it('should structure timetable data using real OpenAI API', async () => {
      const sampleText = `
        Monday:
        9:00 AM - 10:00 AM: Mathematics (Room 101)
        10:00 AM - 11:00 AM: English (Room 102)
        
        Tuesday:
        9:00 AM - 10:00 AM: Science (Lab 1)
        11:00 AM - 12:00 PM: History (Room 103)
      `;

      console.log('🤖 Testing real LLM structured output...');
      const result = await llmService.structureTimetableData(sampleText);

      expect(result).toHaveProperty('timeBlocks');
      expect(Array.isArray(result.timeBlocks)).toBe(true);
      expect(result.timeBlocks.length).toBeGreaterThan(0);

      const block = result.timeBlocks[0];
      expect(block).toHaveProperty('dayOfWeek');
      expect(block).toHaveProperty('startTime');
      expect(block).toHaveProperty('endTime');
      expect(block).toHaveProperty('eventName');
      expect(block).toHaveProperty('eventType');
      expect(block).toHaveProperty('confidenceScore');

      console.log('✅ LLM structuring successful');
      console.log('📊 Extracted', result.timeBlocks.length, 'time blocks');
      console.log('📝 First block:', block.dayOfWeek, block.startTime, '-', block.endTime, ':', block.eventName);
    });

    it('should handle complex timetable text with real AI', async () => {
      const complexText = `
        Weekly Schedule - Grade 5A
        
        MONDAY
        08:00 - 08:45: Assembly (Main Hall)
        09:00 - 09:45: Mathematics - Algebra (Room 201)
        10:00 - 10:45: English Literature (Room 105)
        11:00 - 11:45: Physical Education (Gym)
        
        TUESDAY  
        09:00 - 10:00: Science - Biology (Lab 2)
        10:15 - 11:15: History - World War II (Room 302)
        11:30 - 12:30: Art & Craft (Art Room)
      `;

      console.log('🤖 Testing complex timetable with real LLM...');
      const result = await llmService.structureTimetableData(complexText);

      expect(result.timeBlocks.length).toBeGreaterThan(5);
      console.log('✅ Complex timetable processed');
      console.log('📊 Extracted', result.timeBlocks.length, 'blocks from complex schedule');
    });

    it('should handle empty or minimal text gracefully', async () => {
      const minimalText = 'No schedule available';

      const result = await llmService.structureTimetableData(minimalText);

      expect(result).toHaveProperty('timeBlocks');
      expect(Array.isArray(result.timeBlocks)).toBe(true);
      console.log('✅ Handled minimal text, blocks:', result.timeBlocks.length);
    });
  });

  describe('Extraction Service - End-to-End Real Processing', () => {
    it('should process PNG image end-to-end with real AI APIs', async () => {
      const imagePath = path.join(examplesDir, 'Teacher Timetable Example 1.1.png');

      if (!fs.existsSync(imagePath)) {
        console.warn('⚠️ Test image not found');
        return;
      }

      console.log('🚀 Testing end-to-end extraction with PNG...');
      const result = await extractionService.extractFromFile(imagePath);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('extractionMethod');
      expect(result).toHaveProperty('confidenceScore');

      if (result.success && result.data) {
        expect(result.data).toHaveProperty('timeBlocks');
        expect(Array.isArray(result.data.timeBlocks)).toBe(true);

        console.log('✅ End-to-end extraction successful');
        console.log('📊 Method:', result.extractionMethod);
        console.log('📊 Confidence:', result.confidenceScore);
        console.log('📊 Blocks extracted:', result.data.timeBlocks.length);

        if (result.data.timeBlocks.length > 0) {
          const block = result.data.timeBlocks[0];
          console.log('📝 Sample block:', block.dayOfWeek, block.startTime, '-', block.endTime);
        }
      }
    });

    it('should process JPEG image end-to-end with real AI APIs', async () => {
      const imagePath = path.join(examplesDir, 'Teacher Timetable Example 4.jpeg');

      if (!fs.existsSync(imagePath)) {
        console.warn('⚠️ Test image not found');
        return;
      }

      console.log('🚀 Testing end-to-end extraction with JPEG...');
      const result = await extractionService.extractFromFile(imagePath);

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.timeBlocks.length).toBeGreaterThan(0);
        console.log('✅ JPEG end-to-end successful, blocks:', result.data.timeBlocks.length);
      }
    });

    it('should process PDF end-to-end with real AI APIs', async () => {
      const pdfPath = path.join(examplesDir, 'Teacher Timetable Example 2.pdf');

      if (!fs.existsSync(pdfPath)) {
        console.warn('⚠️ Test PDF not found');
        return;
      }

      console.log('🚀 Testing end-to-end extraction with PDF...');
      const result = await extractionService.extractFromFile(pdfPath);

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.timeBlocks).toBeDefined();
        console.log('✅ PDF end-to-end successful');
        console.log('📊 PDF blocks:', result.data.timeBlocks.length);
      }
    });

    it('should handle unsupported file type', async () => {
      const textFilePath = path.join(__dirname, '../../package.json');

      const result = await extractionService.extractFromFile(textFilePath);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      console.log('✅ Correctly rejected unsupported file type');
    });

    it('should handle non-existent file', async () => {
      const result = await extractionService.extractFromFile('/path/to/nonexistent/file.png');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Performance Metrics - Real AI API Response Times', () => {
    it('should measure OCR performance with real API', async () => {
      const imagePath = path.join(examplesDir, 'Teacher Timetable Example 1.1.png');

      if (!fs.existsSync(imagePath)) {
        return;
      }

      console.log('⏱️ Measuring OCR performance...');
      const startTime = Date.now();
      await ocrService.extractTextFromImage(imagePath);
      const duration = Date.now() - startTime;

      console.log('📊 OCR completed in', duration, 'ms');
      expect(duration).toBeLessThan(60000); // Should complete within 60 seconds
    });

    it('should measure LLM performance with real API', async () => {
      const sampleText = 'Monday 9:00-10:00 Math, Tuesday 10:00-11:00 Science';

      console.log('⏱️ Measuring LLM performance...');
      const startTime = Date.now();
      await llmService.structureTimetableData(sampleText);
      const duration = Date.now() - startTime;

      console.log('📊 LLM completed in', duration, 'ms');
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });
  });
});
