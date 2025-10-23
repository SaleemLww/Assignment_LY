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
 *    Learning Yogi (LY) assignment purpose and should be used as a reference.
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
 * API Integration Tests - Real API Calls (No Mocks)
 * Tests all API endpoints with real file uploads and processing
 * 
 * @requires Redis server running on localhost:6379
 * @requires PostgreSQL server running on localhost:5432
 * @requires Real API keys in .env file (OPENAI_API_KEY, GOOGLE_API_KEY)
 */

import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';

const prisma = new PrismaClient();

// Test timeout for real API calls
jest.setTimeout(300000); // 5 minutes

describe('API Integration Tests - Real API Calls', () => {
  let uploadedTimetableId: string;
  let uploadedJobId: string;

  // Cleanup before all tests
  beforeAll(async () => {
    console.log('🧹 Cleaning up test data before tests...');
    // Delete all test timetables
    await prisma.timeBlock.deleteMany({});
    await prisma.processingLog.deleteMany({});
    await prisma.timetable.deleteMany({});
    await prisma.teacher.deleteMany({});
    console.log('✅ Test data cleaned');
  });

  // Cleanup after all tests
  afterAll(async () => {
    console.log('🧹 Cleaning up test data after tests...');
    await prisma.timeBlock.deleteMany({});
    await prisma.processingLog.deleteMany({});
    await prisma.timetable.deleteMany({});
    await prisma.teacher.deleteMany({});
    await prisma.$disconnect();
    console.log('✅ Test data cleaned and connections closed');
  });

  describe('Health Check Endpoints', () => {
    it('GET /health - should return server health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('File Upload - Real Image Processing', () => {
    it('POST /api/upload - should upload PNG image and start real AI processing', async () => {
      const testImagePath = path.join(__dirname, '../../../TA_Assignment_Pack/examples/Teacher Timetable Example 1.1.png');

      if (!fs.existsSync(testImagePath)) {
        console.warn('⚠️ Test image not found:', testImagePath);
        return;
      }

      console.log('📤 Uploading PNG image for real AI processing...');
      const response = await request(app)
        .post('/api/upload')
        .field('teacherName', 'Test Teacher')
        .field('title', 'Integration Test Timetable - PNG')
        .attach('file', testImagePath);

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('jobId');
      expect(response.body.data).toHaveProperty('message');

      uploadedJobId = response.body.data.jobId;
      console.log('✅ Upload successful, Job ID:', uploadedJobId);

      // Wait for processing to complete (real AI API calls take time)
      console.log('⏳ Waiting for AI processing to complete...');
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
    });

    it('POST /api/upload - should upload JPEG image and start real AI processing', async () => {
      const testImagePath = path.join(__dirname, '../../../TA_Assignment_Pack/examples/Teacher Timetable Example 4.jpeg');

      if (!fs.existsSync(testImagePath)) {
        console.warn('⚠️ Test image not found:', testImagePath);
        return;
      }

      console.log('📤 Uploading JPEG image for real AI processing...');
      const response = await request(app)
        .post('/api/upload')
        .field('teacherName', 'Test Teacher JPEG')
        .field('title', 'Integration Test Timetable - JPEG')
        .attach('file', testImagePath);

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('jobId');

      console.log('✅ JPEG upload successful, Job ID:', response.body.data.jobId);

      // Wait for processing
      console.log('⏳ Waiting for AI processing to complete...');
      await new Promise(resolve => setTimeout(resolve, 30000));
    });

    it('POST /api/upload - should reject invalid file type', async () => {
      const testFilePath = path.join(__dirname, '../../package.json');

      const response = await request(app)
        .post('/api/upload')
        .field('teacherName', 'Test Teacher')
        .attach('file', testFilePath);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('POST /api/upload - should reject request without file', async () => {
      const response = await request(app)
        .post('/api/upload')
        .field('teacherName', 'Test Teacher');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Job Status Checking - Real Processing Results', () => {
    it('GET /api/upload/status/:jobId - should return real processing status', async () => {
      if (!uploadedJobId) {
        console.warn('⚠️ No job ID from previous tests, skipping...');
        return;
      }

      console.log('🔍 Checking job status for:', uploadedJobId);
      const response = await request(app).get(`/api/upload/status/${uploadedJobId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status');
      expect(['completed', 'processing', 'failed']).toContain(response.body.data.status);

      if (response.body.data.status === 'completed') {
        expect(response.body.data).toHaveProperty('timetableId');
        uploadedTimetableId = response.body.data.timetableId;
        console.log('✅ Processing completed, Timetable ID:', uploadedTimetableId);
      } else {
        console.log('⏳ Status:', response.body.data.status);
      }
    });

    it('GET /api/upload/status/:jobId - should return 404 for invalid job ID', async () => {
      const response = await request(app).get('/api/upload/status/invalid-job-id-12345');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Timetable Retrieval - Real AI Extracted Data', () => {
    beforeAll(async () => {
      // If we don't have a timetableId from previous tests, find one
      if (!uploadedTimetableId) {
        const timetable = await prisma.timetable.findFirst({
          where: { processingStatus: 'COMPLETED' },
          orderBy: { uploadedAt: 'desc' },
        });
        if (timetable) {
          uploadedTimetableId = timetable.id;
          console.log('📋 Using existing timetable:', uploadedTimetableId);
        }
      }
    });

    it('GET /api/v1/timetables - should list all timetables with real data', async () => {
      const response = await request(app).get('/api/v1/timetables');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('timetables');
      expect(Array.isArray(response.body.data.timetables)).toBe(true);
      expect(response.body.data).toHaveProperty('pagination');

      if (response.body.data.timetables.length > 0) {
        const timetable = response.body.data.timetables[0];
        expect(timetable).toHaveProperty('id');
        expect(timetable).toHaveProperty('title');
        expect(timetable).toHaveProperty('status');
        expect(timetable).toHaveProperty('createdAt');
        console.log('✅ Found', response.body.data.timetables.length, 'timetables');
      }
    });

    it('GET /api/v1/timetables?page=1&limit=5 - should handle pagination', async () => {
      const response = await request(app).get('/api/v1/timetables?page=1&limit=5');

      expect(response.status).toBe(200);
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 5);
      expect(response.body.data.timetables.length).toBeLessThanOrEqual(5);
    });

    it('GET /api/v1/timetables/:id - should retrieve specific timetable with AI extracted blocks', async () => {
      if (!uploadedTimetableId) {
        console.warn('⚠️ No timetable ID available, skipping...');
        return;
      }

      console.log('📋 Retrieving timetable:', uploadedTimetableId);
      const response = await request(app).get(`/api/v1/timetables/${uploadedTimetableId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', uploadedTimetableId);
      expect(response.body.data).toHaveProperty('title');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('timeBlocks');
      expect(Array.isArray(response.body.data.timeBlocks)).toBe(true);

      if (response.body.data.timeBlocks.length > 0) {
        const block = response.body.data.timeBlocks[0];
        expect(block).toHaveProperty('dayOfWeek');
        expect(block).toHaveProperty('startTime');
        expect(block).toHaveProperty('endTime');
        expect(block).toHaveProperty('eventName');
        expect(block).toHaveProperty('confidenceScore');
        console.log('✅ Retrieved', response.body.data.timeBlocks.length, 'time blocks');
        console.log('📊 First block:', block.dayOfWeek, block.startTime, '-', block.endTime, ':', block.eventName);
      }
    });

    it('GET /api/v1/timetables/:id - should return 404 for non-existent timetable', async () => {
      const response = await request(app).get('/api/v1/timetables/non-existent-id-12345');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Timetable Updates - Real Data Modifications', () => {
    let testBlockId: string;

    beforeAll(async () => {
      if (!uploadedTimetableId) {
        console.warn('⚠️ No timetable ID for update tests, skipping...');
        return;
      }

      // Get a time block to update
      const timetable = await prisma.timetable.findUnique({
        where: { id: uploadedTimetableId },
        include: { timeBlocks: true },
      });

      if (timetable && timetable.timeBlocks.length > 0) {
        testBlockId = timetable.timeBlocks[0].id;
        console.log('📝 Using block for update tests:', testBlockId);
      }
    });

    it('PATCH /api/v1/timetables/:timetableId/blocks/:blockId - should update time block', async () => {
      if (!uploadedTimetableId || !testBlockId) {
        console.warn('⚠️ No timetable/block ID, skipping...');
        return;
      }

      const updateData = {
        eventName: 'Updated Mathematics Class',
        notes: 'Updated via integration test',
      };

      console.log('✏️ Updating block:', testBlockId);
      const response = await request(app)
        .patch(`/api/v1/timetables/${uploadedTimetableId}/blocks/${testBlockId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('eventName', updateData.eventName);
      expect(response.body.data).toHaveProperty('notes', updateData.notes);
      console.log('✅ Block updated successfully');
    });

    it('PATCH /api/v1/timetables/:timetableId/blocks/:blockId - should reject invalid time format', async () => {
      if (!uploadedTimetableId || !testBlockId) {
        console.warn('⚠️ No timetable/block ID, skipping...');
        return;
      }

      const invalidData = {
        startTime: 'invalid-time-format',
      };

      const response = await request(app)
        .patch(`/api/v1/timetables/${uploadedTimetableId}/blocks/${testBlockId}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Timetable Deletion - Real Data Cleanup', () => {
    it('DELETE /api/v1/timetables/:id - should delete timetable and all related data', async () => {
      if (!uploadedTimetableId) {
        console.warn('⚠️ No timetable ID for deletion, skipping...');
        return;
      }

      console.log('🗑️ Deleting timetable:', uploadedTimetableId);
      const response = await request(app).delete(`/api/v1/timetables/${uploadedTimetableId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      console.log('✅ Timetable deleted successfully');

      // Verify deletion
      const checkResponse = await request(app).get(`/api/v1/timetables/${uploadedTimetableId}`);
      expect(checkResponse.status).toBe(404);
    });

    it('DELETE /api/v1/timetables/:id - should return 404 for non-existent timetable', async () => {
      const response = await request(app).delete('/api/v1/timetables/non-existent-id-12345');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });
});
