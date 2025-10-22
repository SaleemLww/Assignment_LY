import { Request, Response, NextFunction } from 'express';
import { uploadSingleFile, getFileInfo, deleteFile } from '../middleware/upload';
import { addTimetableJob } from '../queues/timetable.queue';
import { logInfo, logError } from '../utils/logger';

// Upload controller
export const uploadTimetable = (req: Request, res: Response, _next: NextFunction): void => {
  // Handle file upload
  uploadSingleFile(req, res, async (err) => {
      if (err) {
        logError('File upload error', err);
        return res.status(400).json({
          error: 'Upload failed',
          message: err.message,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: 'No file provided',
          message: 'Please upload a file',
        });
      }

      try {
        // Get teacher info from request body
        const { teacherName } = req.body;

        if (!teacherName) {
          deleteFile(req.file.path);
          return res.status(400).json({
            error: 'Missing required field',
            message: 'Teacher name is required',
          });
        }

        // Get file info
        const fileInfo = getFileInfo(req.file);

        // TODO: Create teacher and timetable records in database
        const timetableId = 'temp-' + Date.now(); // Temporary ID
        const teacherId = 'temp-teacher-' + Date.now(); // Temporary ID

        // Add job to queue for processing
        const job = await addTimetableJob({
          timetableId,
          teacherId,
          filePath: fileInfo.path,
          fileType: fileInfo.mimetype,
          fileName: fileInfo.originalName,
        });

        logInfo('Timetable upload successful', {
          jobId: job.id,
          timetableId,
          fileName: fileInfo.originalName,
        });

        // Return success response
        res.status(200).json({
          message: 'File uploaded successfully',
          data: {
            jobId: job.id,
            timetableId,
            fileName: fileInfo.originalName,
            fileSize: fileInfo.size,
            uploadedAt: fileInfo.uploadedAt,
            status: 'queued',
          },
        });
      } catch (error) {
        // Clean up uploaded file on error
        if (req.file) {
          deleteFile(req.file.path);
        }
        logError('Upload processing error', error);
        return res.status(500).json({
          error: 'Processing failed',
          message: 'An error occurred while processing the upload',
        });
      }
    });
};

// Get job status controller
export const getJobStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;

    // TODO: Implement get job status from queue
    // const jobStatus = await getJobStatusFromQueue(jobId);

    res.status(200).json({
      message: 'Job status retrieved',
      data: {
        jobId,
        status: 'processing', // Temporary
      },
    });
  } catch (error) {
    logError('Get job status error', error);
    next(error);
  }
};
