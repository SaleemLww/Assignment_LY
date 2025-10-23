import { Worker, Job } from 'bullmq';
import { DayOfWeek, ProcessingStatus } from '@prisma/client';
import { config } from '../config/env';
import { TimetableJobData, TimetableJobResult } from './timetable.queue';
import { extractTimetable } from '../services/extraction.service';
import { databaseService } from '../services/database.service';
import { logInfo, logError } from '../utils/logger';

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
    logInfo(`🔄 Processing timetable: ${timetableId}`, {
      filePath,
      fileType,
    });

    // Update progress - Starting extraction
    await job.updateProgress(10);

    // Step 1: Extract timetable data from file
    logInfo('Step 1: Extracting timetable data');
    const extractionResult = await extractTimetable(filePath, fileType);
    await job.updateProgress(60);

    if (!extractionResult.success || !extractionResult.timetableData) {
      throw new Error(extractionResult.error || 'Extraction failed');
    }

    // Step 2: Data validation (already done in extraction service)
    logInfo('Step 2: Data validated');
    await job.updateProgress(70);

    // Step 3: Save to database
    logInfo('Step 3: Saving to database');
    
    // Update timetable status to PROCESSING
    await databaseService.updateTimetableStatus(timetableId, ProcessingStatus.PROCESSING);
    
    // Update teacher name with extracted name if available
    if (extractionResult.timetableData.teacherName && extractionResult.timetableData.teacherName.trim()) {
      const timetable = await databaseService.getTimetableWithDetails(timetableId);
      if (timetable) {
        logInfo('Updating teacher name with extracted value', {
          oldName: timetable.teacher.name,
          newName: extractionResult.timetableData.teacherName,
        });
        
        await databaseService.updateTeacher(timetable.teacher.id, {
          name: extractionResult.timetableData.teacherName,
        });
      }
    }
    
    // Create processing log
    await databaseService.createProcessingLog({
      timetableId,
      step: 'extraction',
      status: 'success',
      message: `Extracted ${extractionResult.timetableData.timeBlocks.length} time blocks`,
      metadata: {
        method: extractionResult.method,
        confidence: extractionResult.confidence,
        processingTime: extractionResult.processingTime,
        extractedTeacherName: extractionResult.timetableData.teacherName,
      },
    });
    
    await job.updateProgress(80);

    // Save time blocks to database
    await databaseService.createTimeBlocks(
      timetableId,
      extractionResult.timetableData.timeBlocks.map((block) => ({
        dayOfWeek: block.dayOfWeek as DayOfWeek,
        startTime: block.startTime,
        endTime: block.endTime,
        subject: block.subject,
        classroom: block.classroom,
        grade: block.grade,
        section: block.section,
        notes: block.notes,
        confidence: extractionResult.confidence,
      }))
    );

    await job.updateProgress(90);

    // Update timetable status to COMPLETED
    await databaseService.updateTimetableStatus(timetableId, ProcessingStatus.COMPLETED);

    // Step 4: Complete
    await job.updateProgress(100);

    const processingTime = Date.now() - startTime;

    logInfo(`✅ Timetable processing completed: ${timetableId}`, {
      entriesExtracted: extractionResult.timetableData.timeBlocks.length,
      confidence: extractionResult.confidence,
      processingTime,
    });

    // Return result
    return {
      timetableId,
      status: 'success',
      extractedData: {
        timeBlocks: extractionResult.timetableData.timeBlocks.map((block) => ({
          dayOfWeek: block.dayOfWeek,
          startTime: block.startTime,
          endTime: block.endTime,
          subject: block.subject,
          classroom: block.classroom,
          grade: block.grade,
          section: block.section,
          notes: block.notes,
          confidence: extractionResult.confidence,
        })),
      },
      processingTime,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError(`❌ Error processing timetable ${timetableId}`, error);

    // Update timetable status to FAILED
    try {
      await databaseService.updateTimetableStatus(
        timetableId,
        ProcessingStatus.FAILED,
        errorMessage
      );

      // Create processing log for error
      await databaseService.createProcessingLog({
        timetableId,
        step: 'processing',
        status: 'failed',
        message: errorMessage,
      });
    } catch (dbError) {
      logError('Error updating timetable status', dbError);
    }

    return {
      timetableId,
      status: 'failed',
      error: errorMessage,
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
