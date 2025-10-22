import { Worker, Job } from 'bullmq';
import { config } from '../config/env';
import { TimetableJobData, TimetableJobResult } from './timetable.queue';

// Redis connection config for BullMQ
const connection = {
  host: config.env.REDIS_HOST,
  port: config.env.REDIS_PORT,
  password: config.env.REDIS_PASSWORD,
};

// Worker processor function
async function processTimetable(job: Job<TimetableJobData>): Promise<TimetableJobResult> {
  const startTime = Date.now();
  const { timetableId, filePath, fileType } = job.data;

  try {
    console.log(`🔄 Processing timetable: ${timetableId}`);
    console.log(`   File: ${filePath} (${fileType})`);

    // Update progress
    await job.updateProgress(10);

    // TODO: Implement actual processing steps:
    // 1. OCR extraction (if image/scanned PDF)
    await job.updateProgress(30);

    // 2. LLM-based extraction
    await job.updateProgress(60);

    // 3. Data validation and structuring
    await job.updateProgress(80);

    // 4. Save to database
    await job.updateProgress(100);

    const processingTime = Date.now() - startTime;

    // Return result
    return {
      timetableId,
      status: 'success',
      extractedData: {
        timeBlocks: [], // Will be populated by actual extraction service
      },
      processingTime,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Error processing timetable ${timetableId}:`, error);

    return {
      timetableId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime,
    };
  }
}

// Create worker
export const timetableWorker = new Worker<TimetableJobData, TimetableJobResult>(
  'timetable-processing',
  processTimetable,
  {
    connection,
    concurrency: 3, // Process up to 3 jobs concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000, // per 60 seconds
    },
  }
);

// Worker event handlers
timetableWorker.on('completed', (job: Job<TimetableJobData>, result: TimetableJobResult) => {
  console.log(`✅ Worker: Job ${job.id} completed in ${result.processingTime}ms`);
});

timetableWorker.on('failed', (job: Job<TimetableJobData> | undefined, error: Error) => {
  console.error(`❌ Worker: Job ${job?.id} failed:`, error.message);
});

timetableWorker.on('error', (error: Error) => {
  console.error('❌ Worker error:', error);
});

timetableWorker.on('active', (job: Job<TimetableJobData>) => {
  console.log(`🔄 Worker: Processing job ${job.id}`);
});

// Close worker
export const closeWorker = async () => {
  await timetableWorker.close();
  console.log('✅ Worker closed');
};

export default timetableWorker;
