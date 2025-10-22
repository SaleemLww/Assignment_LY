import { Queue, Job, QueueEvents } from 'bullmq';
import { config } from '../config/env';

// Job data interface
export interface TimetableJobData {
  timetableId: string;
  teacherId: string;
  filePath: string;
  fileType: string;
  fileName: string;
}

// Job result interface
export interface TimetableJobResult {
  timetableId: string;
  status: 'success' | 'failed';
  extractedData?: {
    timeBlocks: Array<{
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      subject: string;
      classroom?: string;
      grade?: string;
      section?: string;
      notes?: string;
      confidence?: number;
    }>;
  };
  error?: string;
  processingTime: number;
}

// Redis connection config for BullMQ
const connection = {
  host: config.env.REDIS_HOST,
  port: config.env.REDIS_PORT,
  password: config.env.REDIS_PASSWORD,
};

// Create timetable processing queue
export const timetableQueue = new Queue<TimetableJobData>('timetable-processing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // Keep for 24 hours
    },
    removeOnFail: {
      count: 50, // Keep last 50 failed jobs
    },
  },
});

// Queue events for monitoring
export const queueEvents = new QueueEvents('timetable-processing', { connection });

// Event handlers for queue monitoring
queueEvents.on('completed', ({ jobId }) => {
  console.log(`✅ Job ${jobId} completed successfully`);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`❌ Job ${jobId} failed: ${failedReason}`);
});

queueEvents.on('progress', ({ jobId, data }) => {
  console.log(`🔄 Job ${jobId} progress: ${JSON.stringify(data)}`);
});

// Add job to queue
export const addTimetableJob = async (
  data: TimetableJobData,
  priority?: number
): Promise<Job<TimetableJobData>> => {
  return await timetableQueue.add('process-timetable', data, {
    priority: priority || 0,
  });
};

// Get job status
export const getJobStatus = async (jobId: string) => {
  const job = await timetableQueue.getJob(jobId);
  if (!job) {
    return null;
  }

  return {
    id: job.id,
    name: job.name,
    data: job.data,
    progress: job.progress,
    state: await job.getState(),
    attemptsMade: job.attemptsMade,
    finishedOn: job.finishedOn,
    processedOn: job.processedOn,
    failedReason: job.failedReason,
    returnvalue: job.returnvalue,
  };
};

// Get queue stats
export const getQueueStats = async () => {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    timetableQueue.getWaitingCount(),
    timetableQueue.getActiveCount(),
    timetableQueue.getCompletedCount(),
    timetableQueue.getFailedCount(),
    timetableQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
};

// Clean old jobs
export const cleanQueue = async () => {
  await timetableQueue.clean(24 * 3600 * 1000, 100, 'completed'); // Clean completed jobs older than 24h
  await timetableQueue.clean(7 * 24 * 3600 * 1000, 50, 'failed'); // Clean failed jobs older than 7 days
};

// Close queue connections
export const closeQueue = async () => {
  await timetableQueue.close();
  await queueEvents.close();
  console.log('✅ Queue connections closed');
};

export default timetableQueue;
