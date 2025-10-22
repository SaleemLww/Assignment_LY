import { Request, Response, NextFunction } from 'express';
import { addTimetableJob, getJobStatus as getJobStatusFromQueue } from '../queues/timetable.queue';
import { databaseService } from '../services/database.service';
import { logInfo, logError } from '../utils/logger';
import fs from 'fs/promises';

/**
 * Upload Controller
 * Handles file upload and job creation for timetable processing
 */

/**
 * Handle timetable file upload
 * POST /api/upload
 */
export const uploadTimetable = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded. Please provide a timetable file.',
      });
      return;
    }

    // Get teacher name from request body
    const { teacherName, teacherEmail } = req.body;
    if (!teacherName || typeof teacherName !== 'string') {
      // Clean up uploaded file if validation fails
      await fs.unlink(req.file.path);
      res.status(400).json({
        success: false,
        error: 'Teacher name is required',
      });
      return;
    }

    const file = req.file;

    logInfo('📁 File uploaded', {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
    });

    // Step 1: Find or create teacher
    const teacher = await databaseService.findOrCreateTeacher({
      name: teacherName,
      email: teacherEmail,
    });

    // Step 2: Create timetable record in database
    const timetable = await databaseService.createTimetable({
      teacherId: teacher.id,
      filePath: file.path,
      fileType: file.mimetype,
      originalFileName: file.originalname,
      fileSize: file.size,
    });

    // Step 3: Add job to processing queue
    const job = await addTimetableJob({
      timetableId: timetable.id,
      teacherId: teacher.id,
      filePath: file.path,
      fileType: file.mimetype,
      fileName: file.originalname,
    });

    logInfo('✅ File uploaded and queued', {
      timetableId: timetable.id,
      jobId: job.id,
    });

    // Return success response with job ID
    res.status(201).json({
      success: true,
      message: 'File uploaded successfully and queued for processing',
      data: {
        jobId: job.id,
        timetableId: timetable.id,
        fileName: file.originalname,
        fileSize: file.size,
        status: 'queued',
      },
    });
  } catch (error) {
    logError('❌ Error uploading file', error);

    // Clean up file if it exists
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {
        // Ignore cleanup errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get job status
 * GET /api/upload/status/:jobId
 */
export const getJobStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { jobId } = req.params;

    const jobStatus = await getJobStatusFromQueue(jobId);

    if (!jobStatus) {
      res.status(404).json({
        success: false,
        error: 'Job not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Job status retrieved',
      data: jobStatus,
    });
  } catch (error) {
    logError('Error getting job status', error);
    next(error);
  }
};
