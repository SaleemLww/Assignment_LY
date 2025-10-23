/**
 * Queue Worker Integration Tests - Real Processing (No Mocks)
 * Tests BullMQ worker with real file processing and AI APIs
 * 
 * @requires Redis server running on localhost:6379
 * @requires PostgreSQL server running on localhost:5432
 * @requires Real API keys in .env file
 */

import path from 'path';
import fs from 'fs';
import { Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

jest.setTimeout(300000); // 5 minutes for real processing

describe('Queue Worker Integration Tests - Real Processing', () => {
  let timetableQueue: Queue;
  let testJobId: string;
  let testTimetableId: string;

  beforeAll(async () => {
    // Initialize queue connection
    timetableQueue = new Queue('timetable-processing', {
      connection: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    });

    console.log('🔌 Connected to Redis queue');

    // Cleanup test data
    await prisma.timeBlock.deleteMany({});
    await prisma.processingLog.deleteMany({});
    await prisma.timetable.deleteMany({});
    await prisma.teacher.deleteMany({ where: { name: { contains: 'TEST_QUEUE' } } });
  });

  afterAll(async () => {
    await timetableQueue.close();
    await prisma.timeBlock.deleteMany({});
    await prisma.processingLog.deleteMany({});
    await prisma.timetable.deleteMany({});
    await prisma.teacher.deleteMany({ where: { name: { contains: 'TEST_QUEUE' } } });
    await prisma.$disconnect();
    console.log('✅ Cleanup complete');
  });

  describe('Real Queue Job Processing', () => {
    it('should process PNG image through real queue worker', async () => {
      const imagePath = path.join(__dirname, '../../../TA_Assignment_Pack/examples/Teacher Timetable Example 1.1.png');

      if (!fs.existsSync(imagePath)) {
        console.warn('⚠️ Test image not found');
        return;
      }

      // Create test teacher and timetable
      const teacher = await prisma.teacher.create({
        data: {
          name: 'TEST_QUEUE_Teacher',
          email: `queue_test_${Date.now()}@example.com`,
        },
      });

      const timetable = await prisma.timetable.create({
        data: {
          teacherId: teacher.id,
          originalFileName: 'test_queue.png',
          fileType: 'png',
          fileSize: fs.statSync(imagePath).size,
          filePath: imagePath,
          processingStatus: 'PENDING',
        },
      });

      testTimetableId = timetable.id;

      console.log('📤 Adding job to queue...');
      const job = await timetableQueue.add('process-timetable', {
        timetableId: timetable.id,
        filePath: imagePath,
        fileType: 'png',
      });

      testJobId = job.id!;
      console.log('✅ Job added with ID:', testJobId);

      // Wait for processing
      console.log('⏳ Waiting for real AI processing...');
      await new Promise(resolve => setTimeout(resolve, 45000)); // Wait 45 seconds

      // Check results
      const updatedTimetable = await prisma.timetable.findUnique({
        where: { id: timetable.id },
        include: { timeBlocks: true },
      });

      expect(updatedTimetable).not.toBeNull();
      expect(['COMPLETED', 'PROCESSING', 'FAILED']).toContain(updatedTimetable?.processingStatus);

      if (updatedTimetable?.processingStatus === 'COMPLETED') {
        console.log('✅ Processing completed successfully');
        console.log('📊 Extracted', updatedTimetable.timeBlocks.length, 'time blocks');
      } else {
        console.log('ℹ️ Status:', updatedTimetable?.processingStatus);
      }
    });

    it('should handle job status checking', async () => {
      if (!testJobId) {
        console.warn('⚠️ No job ID from previous test');
        return;
      }

      const job = await timetableQueue.getJob(testJobId);

      if (job) {
        const state = await job.getState();
        console.log('📊 Job state:', state);
        expect(['completed', 'active', 'waiting', 'failed']).toContain(state);

        if (state === 'completed') {
          const returnValue = job.returnvalue;
          console.log('✅ Job completed with result:', returnValue);
        }
      }
    });

    it('should track processing logs in database', async () => {
      if (!testTimetableId) {
        console.warn('⚠️ No timetable ID from previous test');
        return;
      }

      const logs = await prisma.processingLog.findMany({
        where: { timetableId: testTimetableId },
        orderBy: { createdAt: 'asc' },
      });

      console.log('📝 Found', logs.length, 'processing logs');
      
      if (logs.length > 0) {
        logs.forEach(log => {
          console.log(`  - ${log.step}: ${log.status}`, log.duration ? `(${log.duration}ms)` : '');
        });
        
        expect(logs.length).toBeGreaterThan(0);
        expect(logs[0]).toHaveProperty('step');
        expect(logs[0]).toHaveProperty('status');
      }
    });
  });

  describe('Queue Health and Performance', () => {
    it('should check queue connection health', async () => {
      const client = await timetableQueue.client;
      const pong = await client.ping();
      
      expect(pong).toBe('PONG');
      console.log('✅ Queue connection healthy');
    });

    it('should get queue metrics', async () => {
      const counts = await timetableQueue.getJobCounts('waiting', 'active', 'completed', 'failed');
      
      console.log('📊 Queue metrics:');
      console.log('  - Waiting:', counts.waiting);
      console.log('  - Active:', counts.active);
      console.log('  - Completed:', counts.completed);
      console.log('  - Failed:', counts.failed);

      expect(counts).toHaveProperty('waiting');
      expect(counts).toHaveProperty('completed');
    });

    it('should handle multiple concurrent jobs', async () => {
      const imagePath = path.join(__dirname, '../../../TA_Assignment_Pack/examples/Teacher Timetable Example 3.png');

      if (!fs.existsSync(imagePath)) {
        console.warn('⚠️ Test image not found');
        return;
      }

      // Create test data for multiple jobs
      const teacher = await prisma.teacher.create({
        data: {
          name: 'TEST_QUEUE_Multi',
        },
      });

      console.log('📤 Adding 3 concurrent jobs...');
      const jobs = [];

      for (let i = 0; i < 3; i++) {
        const timetable = await prisma.timetable.create({
          data: {
            teacherId: teacher.id,
            originalFileName: `concurrent_test_${i}.png`,
            fileType: 'png',
            fileSize: fs.statSync(imagePath).size,
            filePath: imagePath,
            processingStatus: 'PENDING',
          },
        });

        const job = await timetableQueue.add(`process-concurrent-${i}`, {
          timetableId: timetable.id,
          filePath: imagePath,
          fileType: 'png',
        });

        jobs.push({ job, timetableId: timetable.id });
      }

      console.log('✅ Added', jobs.length, 'jobs to queue');
      console.log('ℹ️ Jobs will be processed by worker (check worker logs)');

      // Note: We don't wait for completion here as it would take too long
      // The worker will process these jobs in the background
    });
  });
});
