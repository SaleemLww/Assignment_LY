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


import { Request, Response, NextFunction } from 'express';
import { logInfo, logError } from '../utils/logger';
import { databaseService, prisma } from '../services/database.service';
import { DayOfWeek } from '@prisma/client';
import { z } from 'zod';

/**
 * Timetable Controller
 * Handles CRUD operations for timetables and time blocks
 */

// Validation schemas
const TimeBlockUpdateSchema = z.object({
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  subject: z.string().min(1).optional(),
  classroom: z.string().optional(),
  grade: z.string().optional(),
  section: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Get timetable by ID with all time blocks
 * GET /api/v1/timetables/:id
 */
export async function getTimetableById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    logInfo(`Fetching timetable with ID: ${id}`);

    const timetable = await databaseService.getTimetableWithDetails(id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        error: 'Timetable not found',
      });
    }

    return res.json({
      success: true,
      data: {
        id: timetable.id,
        teacher: {
          id: timetable.teacher.id,
          name: timetable.teacher.name,
          email: timetable.teacher.email,
        },
        status: timetable.processingStatus,
        extractionMethod: timetable.extractionMethod,
        // Calculate average confidence from time blocks
        confidence: timetable.timeBlocks.length > 0
          ? Math.round(
              timetable.timeBlocks.reduce((sum, block) => sum + (block.confidence || 0), 0) /
              timetable.timeBlocks.length
            )
          : null,
        semester: null, // Not stored in database yet
        timeBlocks: timetable.timeBlocks.map((block) => ({
          id: block.id,
          dayOfWeek: block.dayOfWeek,
          startTime: block.startTime,
          endTime: block.endTime,
          subject: block.subject,
          classroom: block.classroom,
          grade: block.grade,
          section: block.section,
          notes: block.notes,
          confidence: block.confidence,
        })),
        fileInfo: {
          originalName: timetable.originalFileName,
          fileType: timetable.fileType,
          fileSize: timetable.fileSize,
        },
        uploadedAt: timetable.uploadedAt,
      },
    });
  } catch (error) {
    logError('Error fetching timetable', error);
    return next(error);
  }
}

/**
 * List timetables with pagination and filtering
 * GET /api/v1/timetables?teacherId=uuid&page=1&limit=10&status=COMPLETED&sort=uploadedAt:desc
 */
export async function listTimetables(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      teacherId,
      page = '1',
      limit = '10',
      status,
      sort = 'uploadedAt:desc',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid page number',
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit (must be between 1 and 100)',
      });
    }

    logInfo('Listing timetables', { teacherId, page: pageNum, limit: limitNum, status, sort });

    // Build filter
    const where: any = {};
    
    if (teacherId) {
      where.teacherId = teacherId as string;
    }

    if (status) {
      where.processingStatus = status;
    }

    // Build sorting
    const [sortField, sortOrder] = (sort as string).split(':');
    const orderBy: any = {};
    orderBy[sortField] = sortOrder === 'desc' ? 'desc' : 'asc';

    // Pagination
    const skip = (pageNum - 1) * limitNum;

    // Fetch data
    const [timetables, total] = await Promise.all([
      prisma.timetable.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          teacher: true,
          timeBlocks: true,
        },
      }),
      prisma.timetable.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      success: true,
      data: timetables.map((timetable) => ({
        id: timetable.id,
        teacher: {
          id: timetable.teacher.id,
          name: timetable.teacher.name,
          email: timetable.teacher.email,
        },
        status: timetable.processingStatus,
        extractionMethod: timetable.extractionMethod,
        timeBlocksCount: timetable.timeBlocks.length,
        fileInfo: {
          originalName: timetable.originalFileName,
          fileType: timetable.fileType,
        },
        uploadedAt: timetable.uploadedAt,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    logError('Error listing timetables', error);
    return next(error);
  }
}

/**
 * Update a specific time block
 * PATCH /api/v1/timetables/:timetableId/blocks/:blockId
 */
export async function updateTimeBlock(req: Request, res: Response, next: NextFunction) {
  try {
    const { timetableId, blockId } = req.params;

    // Validate request body
    const validationResult = TimeBlockUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: validationResult.error.issues,
      });
    }

    const updateData = validationResult.data;

    logInfo(`Updating time block ${blockId} in timetable ${timetableId}`);

    // Check if timetable exists
    const timetable = await prisma.timetable.findUnique({
      where: { id: timetableId },
    });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        error: 'Timetable not found',
      });
    }

    // Check if time block exists and belongs to this timetable
    const timeBlock = await prisma.timeBlock.findUnique({
      where: { id: blockId },
    });

    if (!timeBlock || timeBlock.timetableId !== timetableId) {
      return res.status(404).json({
        success: false,
        error: 'Time block not found or does not belong to this timetable',
      });
    }

    // Update time block
    const updatedBlock = await prisma.timeBlock.update({
      where: { id: blockId },
      data: {
        ...(updateData.dayOfWeek && { dayOfWeek: updateData.dayOfWeek as DayOfWeek }),
        ...(updateData.startTime && { startTime: updateData.startTime }),
        ...(updateData.endTime && { endTime: updateData.endTime }),
        ...(updateData.subject && { subject: updateData.subject }),
        ...(updateData.classroom !== undefined && { classroom: updateData.classroom }),
        ...(updateData.grade !== undefined && { grade: updateData.grade }),
        ...(updateData.section !== undefined && { section: updateData.section }),
        ...(updateData.notes !== undefined && { notes: updateData.notes }),
      },
    });

    return res.json({
      success: true,
      message: 'Time block updated successfully',
      data: {
        id: updatedBlock.id,
        dayOfWeek: updatedBlock.dayOfWeek,
        startTime: updatedBlock.startTime,
        endTime: updatedBlock.endTime,
        subject: updatedBlock.subject,
        classroom: updatedBlock.classroom,
        grade: updatedBlock.grade,
        section: updatedBlock.section,
        notes: updatedBlock.notes,
        confidence: updatedBlock.confidence,
      },
    });
  } catch (error) {
    logError('Error updating time block', error);
    return next(error);
  }
}

/**
 * Delete timetable and associated data
 * DELETE /api/v1/timetables/:id
 */
export async function deleteTimetable(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    logInfo(`Deleting timetable with ID: ${id}`);

    // Check if timetable exists
    const timetable = await prisma.timetable.findUnique({
      where: { id },
      include: {
        timeBlocks: true,
        processingLogs: true,
      },
    });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        error: 'Timetable not found',
      });
    }

    // Delete associated file (if it exists)
    if (timetable.filePath) {
      const fs = require('fs').promises;
      const path = require('path');
      const filePath = path.join(process.cwd(), timetable.filePath);
      
      try {
        await fs.unlink(filePath);
        logInfo(`Deleted file: ${filePath}`);
      } catch (error) {
        logError(`Failed to delete file: ${filePath}`, error);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete timetable (cascading delete will handle time blocks and logs)
    await prisma.timetable.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Timetable deleted successfully',
      data: {
        id,
        deletedTimeBlocks: timetable.timeBlocks.length,
        deletedLogs: timetable.processingLogs.length,
      },
    });
  } catch (error) {
    logError('Error deleting timetable', error);
    return next(error);
  }
}
