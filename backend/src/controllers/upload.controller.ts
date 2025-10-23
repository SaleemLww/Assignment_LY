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
 *    Learning Yogi (LY) assignment purpose and should be used as a reference
 *    or learning material only.
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
export const uploadTimetable = async (req: Request & { file?: any }, res: Response): Promise<void> => {
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
