import { Router } from 'express';
import { uploadTimetable, getJobStatus } from '../controllers/upload.controller';

const router = Router();

/**
 * @route   POST /api/upload
 * @desc    Upload timetable file
 * @access  Public
 * @body    {file: File, teacherName: string, teacherEmail?: string}
 */
router.post('/', uploadTimetable);

/**
 * @route   GET /api/upload/status/:jobId
 * @desc    Get upload processing status
 * @access  Public
 */
router.get('/status/:jobId', getJobStatus);

export default router;
