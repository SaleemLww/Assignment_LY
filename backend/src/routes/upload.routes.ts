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
import { uploadTimetable, getJobStatus } from '../controllers/upload.controller';
import { uploadSingleFile } from '../middleware/upload';

const router = Router();

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a timetable file for processing
 *     description: |
 *       Upload a timetable document (PNG, JPEG, PDF, or DOCX) for AI-powered extraction.
 *       
 *       **Processing Pipeline:**
 *       1. File validation (type, size)
 *       2. Async job creation in queue
 *       3. AI/ML extraction (OCR/PDF/DOCX)
 *       4. LLM structuring with Zod validation
 *       5. Database persistence
 *       
 *       **Supported Formats:**
 *       - Images: PNG, JPEG (via OpenAI/Google Vision + Tesseract)
 *       - PDF: Text-based, scanned, or mixed (smart detection)
 *       - DOCX: Text and embedded images
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - teacherName
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Timetable file (PNG, JPEG, PDF, or DOCX, max 10MB)
 *               teacherName:
 *                 type: string
 *                 description: Name of the teacher
 *                 example: Dr. John Smith
 *               teacherEmail:
 *                 type: string
 *                 format: email
 *                 description: Email address of the teacher (optional)
 *                 example: john.smith@school.edu
 *           encoding:
 *             file:
 *               contentType: image/png, image/jpeg, application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document
 *     responses:
 *       200:
 *         description: File uploaded successfully and queued for processing
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
 *                   example: File uploaded successfully and queued for processing
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobId:
 *                       type: string
 *                       example: 1234567890-abcd-1234-efgh-567890abcdef
 *                       description: Job ID for tracking processing status
 *                     timetableId:
 *                       type: string
 *                       format: uuid
 *                       example: 123e4567-e89b-12d3-a456-426614174000
 *                     fileName:
 *                       type: string
 *                       example: timetable_2025.pdf
 *                     fileSize:
 *                       type: integer
 *                       example: 1024000
 *                       description: File size in bytes
 *                     status:
 *                       type: string
 *                       example: PENDING
 *                       enum: [PENDING, PROCESSING, COMPLETED, FAILED]
 *       400:
 *         description: Bad request - Invalid file or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               noFile:
 *                 summary: No file uploaded
 *                 value:
 *                   success: false
 *                   error: Validation Error
 *                   message: No file uploaded
 *               invalidType:
 *                 summary: Invalid file type
 *                 value:
 *                   success: false
 *                   error: Validation Error
 *                   message: Invalid file type. Allowed types - PNG, JPEG, PDF, DOCX
 *               fileToolar Large:
 *                 summary: File too large
 *                 value:
 *                   success: false
 *                   error: Validation Error
 *                   message: File size exceeds the maximum limit of 10MB
 *               missingTeacher:
 *                 summary: Missing teacher name
 *                 value:
 *                   success: false
 *                   error: Validation Error
 *                   message: Teacher name is required
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/', uploadSingleFile, uploadTimetable);

/**
 * @swagger
 * /api/upload/status/{jobId}:
 *   get:
 *     summary: Get processing status of an uploaded file
 *     description: |
 *       Retrieve the current processing status and progress of a timetable extraction job.
 *       
 *       **Status Flow:**
 *       - PENDING (0%): Job queued
 *       - PROCESSING (10-90%): Active extraction
 *       - COMPLETED (100%): Successfully extracted
 *       - FAILED: Processing error
 *     tags: [Status]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID returned from upload endpoint
 *         example: 1234567890-abcd-1234-efgh-567890abcdef
 *     responses:
 *       200:
 *         description: Job status retrieved successfully
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
 *                     jobId:
 *                       type: string
 *                       example: 1234567890-abcd-1234-efgh-567890abcdef
 *                     status:
 *                       type: string
 *                       enum: [waiting, active, completed, failed]
 *                       example: completed
 *                     progress:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 100
 *                       example: 100
 *                       description: Processing progress percentage
 *                     result:
 *                       type: object
 *                       nullable: true
 *                       description: Extraction result (only present when completed)
 *                       properties:
 *                         timetableId:
 *                           type: string
 *                           format: uuid
 *                         teacherId:
 *                           type: string
 *                           format: uuid
 *                         timeBlocksCount:
 *                           type: integer
 *                           example: 15
 *                         confidence:
 *                           type: number
 *                           format: float
 *                           minimum: 0
 *                           maximum: 1
 *                           example: 0.95
 *                         processingMethod:
 *                           type: string
 *                           example: ai-vision
 *                     error:
 *                       type: string
 *                       nullable: true
 *                       description: Error message (only present when failed)
 *                       example: Failed to extract text from document
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: Not Found
 *               message: Job not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/status/:jobId', getJobStatus);

export default router;
