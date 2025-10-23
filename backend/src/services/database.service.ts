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


import { PrismaClient, DayOfWeek, ProcessingStatus } from '@prisma/client';
import { logInfo, logError } from '../utils/logger';

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Types for database operations
interface CreateTeacherInput {
  name: string;
  email?: string;
}

interface CreateTimetableInput {
  teacherId: string;
  filePath: string;
  fileType: string;
  originalFileName: string;
  fileSize: number;
}

interface TimeBlockInput {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  subject: string;
  classroom?: string;
  grade?: string;
  section?: string;
  notes?: string;
  confidence?: number;
}

interface CreateProcessingLogInput {
  timetableId: string;
  step: string;
  status: 'success' | 'failed';
  message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Database Service
 * Handles all database operations using Prisma Client
 */
class DatabaseService {
  /**
   * Create or get existing teacher by name
   */
  async findOrCreateTeacher(input: CreateTeacherInput) {
    try {
      // Try to find existing teacher by name
      let teacher = await prisma.teacher.findFirst({
        where: { name: input.name },
      });

      if (!teacher) {
        // Create new teacher if not found
        teacher = await prisma.teacher.create({
          data: {
            name: input.name,
            email: input.email,
          },
        });
        logInfo(`Created new teacher: ${teacher.name} (ID: ${teacher.id})`);
      } else {
        logInfo(`Found existing teacher: ${teacher.name} (ID: ${teacher.id})`);
      }

      return teacher;
    } catch (error) {
      logError('Error finding or creating teacher', error);
      throw error;
    }
  }

  /**
   * Update teacher information
   */
  async updateTeacher(teacherId: string, input: Partial<CreateTeacherInput>) {
    try {
      const teacher = await prisma.teacher.update({
        where: { id: teacherId },
        data: {
          name: input.name,
          email: input.email,
        },
      });

      logInfo(`Updated teacher: ${teacher.name} (ID: ${teacher.id})`);
      return teacher;
    } catch (error) {
      logError(`Error updating teacher ${teacherId}`, error);
      throw error;
    }
  }

  /**
   * Create a new timetable record
   */
  async createTimetable(input: CreateTimetableInput) {
    try {
      const timetable = await prisma.timetable.create({
        data: {
          teacherId: input.teacherId,
          filePath: input.filePath,
          fileType: input.fileType,
          originalFileName: input.originalFileName,
          fileSize: input.fileSize,
          processingStatus: ProcessingStatus.PENDING,
        },
      });

      logInfo(`Created timetable record (ID: ${timetable.id})`);
      return timetable;
    } catch (error) {
      logError('Error creating timetable', error);
      throw error;
    }
  }

  /**
   * Update timetable processing status
   */
  async updateTimetableStatus(
    timetableId: string,
    status: ProcessingStatus,
    errorMessage?: string
  ) {
    try {
      const timetable = await prisma.timetable.update({
        where: { id: timetableId },
        data: {
          processingStatus: status,
          errorMessage,
        },
      });

      logInfo(`Updated timetable ${timetableId} status to ${status}`);
      return timetable;
    } catch (error) {
      logError(`Error updating timetable ${timetableId} status`, error);
      throw error;
    }
  }

  /**
   * Create time blocks for a timetable
   */
  async createTimeBlocks(timetableId: string, timeBlocks: TimeBlockInput[]) {
    try {
      const createdBlocks = await prisma.timeBlock.createMany({
        data: timeBlocks.map((block) => ({
          timetableId,
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
      });

      logInfo(`Created ${createdBlocks.count} time blocks for timetable ${timetableId}`);
      return createdBlocks;
    } catch (error) {
      logError(`Error creating time blocks for timetable ${timetableId}`, error);
      throw error;
    }
  }

  /**
   * Create processing log entry
   */
  async createProcessingLog(input: CreateProcessingLogInput) {
    try {
      const log = await prisma.processingLog.create({
        data: {
          timetableId: input.timetableId,
          step: input.step,
          status: input.status,
          message: input.message,
          metadata: input.metadata as any,
        },
      });

      return log;
    } catch (error) {
      logError('Error creating processing log', error);
      throw error;
    }
  }

  /**
   * Get timetable with all related data
   */
  async getTimetableWithDetails(timetableId: string) {
    try {
      const timetable = await prisma.timetable.findUnique({
        where: { id: timetableId },
        include: {
          teacher: true,
          timeBlocks: {
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
          },
          processingLogs: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      return timetable;
    } catch (error) {
      logError(`Error fetching timetable ${timetableId}`, error);
      throw error;
    }
  }

  /**
   * Get all timetables for a teacher
   */
  async getTeacherTimetables(teacherId: string) {
    try {
      const timetables = await prisma.timetable.findMany({
        where: { teacherId },
        include: {
          timeBlocks: {
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
          },
        },
        orderBy: { uploadedAt: 'desc' },
      });

      return timetables;
    } catch (error) {
      logError(`Error fetching timetables for teacher ${teacherId}`, error);
      throw error;
    }
  }

  /**
   * Clean up: disconnect Prisma Client
   */
  async disconnect() {
    await prisma.$disconnect();
    logInfo('Disconnected from database');
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();

// Export Prisma Client for direct access if needed
export { prisma };
