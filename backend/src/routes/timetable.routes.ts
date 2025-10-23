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


import { Router } from 'express';
import {
  getTimetableById,
  listTimetables,
  updateTimeBlock,
  deleteTimetable,
} from '../controllers/timetable.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/timetables/{id}:
 *   get:
 *     summary: Retrieve a timetable by ID
 *     description: Get detailed information about a specific timetable including teacher info, time blocks, and file metadata
 *     tags: [Timetables]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Timetable UUID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Timetable retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     timetable:
 *                       allOf:
 *                         - $ref: '#/components/schemas/Timetable'
 *                         - type: object
 *                           properties:
 *                             teacher:
 *                               $ref: '#/components/schemas/Teacher'
 *                             timeBlocks:
 *                               type: array
 *                               items:
 *                                 $ref: '#/components/schemas/TimeBlock'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id', getTimetableById);

/**
 * @swagger
 * /api/v1/timetables:
 *   get:
 *     summary: List all timetables
 *     description: Retrieve a paginated list of timetables with optional filtering and sorting
 *     tags: [Timetables]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page (max 100)
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by teacher ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, COMPLETED, FAILED]
 *         description: Filter by processing status
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: createdAt:desc
 *         description: 'Sort format: field:order (e.g., createdAt:desc, fileName:asc)'
 *     responses:
 *       200:
 *         description: Timetables retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     timetables:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Timetable'
 *                           - type: object
 *                             properties:
 *                               teacher:
 *                                 $ref: '#/components/schemas/Teacher'
 *                               timeBlocks:
 *                                 type: array
 *                                 items:
 *                                   $ref: '#/components/schemas/TimeBlock'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         total:
 *                           type: integer
 *                           example: 42
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', listTimetables);

/**
 * @swagger
 * /api/v1/timetables/{timetableId}/blocks/{blockId}:
 *   patch:
 *     summary: Update a time block
 *     description: Update specific fields of a time block within a timetable
 *     tags: [Timetables]
 *     parameters:
 *       - in: path
 *         name: timetableId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Timetable UUID
 *       - in: path
 *         name: blockId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Time block UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TimeBlockUpdate'
 *           examples:
 *             updateSubject:
 *               summary: Update subject only
 *               value:
 *                 subject: Physics
 *             updateTime:
 *               summary: Update time and classroom
 *               value:
 *                 startTime: '10:00'
 *                 endTime: '11:30'
 *                 classroom: 'Lab 2'
 *             updateAll:
 *               summary: Update multiple fields
 *               value:
 *                 dayOfWeek: TUESDAY
 *                 startTime: '14:00'
 *                 endTime: '15:30'
 *                 subject: Chemistry
 *                 classroom: 'Lab 3'
 *                 grade: '11-A'
 *                 notes: 'Bring lab coat'
 *     responses:
 *       200:
 *         description: Time block updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     timeBlock:
 *                       $ref: '#/components/schemas/TimeBlock'
 *                 message:
 *                   type: string
 *                   example: Time block updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.patch('/:timetableId/blocks/:blockId', updateTimeBlock);

/**
 * @swagger
 * /api/v1/timetables/{id}:
 *   delete:
 *     summary: Delete a timetable
 *     description: Delete a timetable and all associated time blocks. Also removes the uploaded file from storage.
 *     tags: [Timetables]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Timetable UUID to delete
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Timetable deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Timetable and associated data deleted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedTimetableId:
 *                       type: string
 *                       format: uuid
 *                     deletedTimeBlocksCount:
 *                       type: integer
 *                       example: 5
 *                     fileRemoved:
 *                       type: boolean
 *                       example: true
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/:id', deleteTimetable);

export default router;
