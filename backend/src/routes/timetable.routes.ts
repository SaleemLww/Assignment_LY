import { Router } from 'express';
import {
  getTimetableById,
  listTimetables,
  updateTimeBlock,
  deleteTimetable,
} from '../controllers/timetable.controller';

const router = Router();

/**
 * @route   GET /api/v1/timetables/:id
 * @desc    Get timetable by ID with all time blocks
 * @access  Public
 */
router.get('/:id', getTimetableById);

/**
 * @route   GET /api/v1/timetables
 * @desc    List timetables with pagination and filtering
 * @access  Public
 * @query   {teacherId?: string, page?: number, limit?: number, status?: string, sort?: string}
 */
router.get('/', listTimetables);

/**
 * @route   PATCH /api/v1/timetables/:timetableId/blocks/:blockId
 * @desc    Update a specific time block
 * @access  Public
 */
router.patch('/:timetableId/blocks/:blockId', updateTimeBlock);

/**
 * @route   DELETE /api/v1/timetables/:id
 * @desc    Delete timetable and associated data
 * @access  Public
 */
router.delete('/:id', deleteTimetable);

export default router;
