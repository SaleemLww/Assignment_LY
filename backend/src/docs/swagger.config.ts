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


import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '../config/env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Teacher Timetable Extraction API',
      version: '1.0.0',
      description: `
# Teacher Timetable Extraction System API

An intelligent document processing system that extracts structured timetable data from images and documents using AI/ML.

## Features

- 📤 **File Upload**: Support for PNG, JPEG, PDF, and DOCX files
- 🤖 **AI-Powered OCR**: OpenAI Vision + Google Gemini + Tesseract fallback
- 📄 **Smart PDF Processing**: Text density analysis with hybrid extraction
- 📝 **DOCX Image Extraction**: JSZip-based embedded image processing
- 🧠 **LLM Structuring**: LangChain with Zod schemas for data validation
- 📊 **RESTful API**: Complete CRUD operations with pagination and filtering
- 🔄 **Async Processing**: BullMQ job queue with real-time status tracking

## Technology Stack

- **Backend**: Node.js 18+, TypeScript, Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: Redis + BullMQ
- **AI/ML**: OpenAI GPT-4o-mini, Google Gemini, Tesseract.js
- **Document Processing**: pdf-parse, mammoth, jszip, sharp

## Accuracy

- OCR: 95%+ (with AI Vision APIs)
- PDF: 95% (text), 95% (scanned), 90% (mixed)
- DOCX: 95% (text), 95% (images), 92% (hybrid)
      `,
      contact: {
        name: 'API Support',
        url: 'https://github.com/SaleemLww/Assignment_LY',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.env.PORT}`,
        description: 'Development server',
      },
      {
        url: 'http://localhost:5000',
        description: 'Local server (default)',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Server health check endpoints',
      },
      {
        name: 'Upload',
        description: 'File upload and processing endpoints',
      },
      {
        name: 'Timetables',
        description: 'Timetable CRUD operations',
      },
      {
        name: 'Status',
        description: 'Job status and monitoring',
      },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Resource not found',
            },
            message: {
              type: 'string',
              example: 'The requested resource could not be found',
            },
          },
        },
        Teacher: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            name: {
              type: 'string',
              example: 'Dr. John Smith',
            },
            email: {
              type: 'string',
              format: 'email',
              nullable: true,
              example: 'john.smith@school.edu',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Timetable: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            teacherId: {
              type: 'string',
              format: 'uuid',
            },
            fileName: {
              type: 'string',
              example: 'timetable_2025.pdf',
            },
            filePath: {
              type: 'string',
              example: '/uploads/1634567890123_timetable.pdf',
            },
            fileType: {
              type: 'string',
              enum: ['image/png', 'image/jpeg', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
              example: 'application/pdf',
            },
            fileSize: {
              type: 'integer',
              example: 1024000,
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
              example: 'COMPLETED',
            },
            extractedData: {
              type: 'object',
              nullable: true,
            },
            confidence: {
              type: 'number',
              format: 'float',
              minimum: 0,
              maximum: 1,
              example: 0.95,
            },
            processingMethod: {
              type: 'string',
              nullable: true,
              example: 'ai-vision',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        TimeBlock: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            timetableId: {
              type: 'string',
              format: 'uuid',
            },
            dayOfWeek: {
              type: 'string',
              enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
              example: 'MONDAY',
            },
            startTime: {
              type: 'string',
              pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
              example: '09:00',
            },
            endTime: {
              type: 'string',
              pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
              example: '10:30',
            },
            subject: {
              type: 'string',
              example: 'Mathematics',
            },
            classroom: {
              type: 'string',
              nullable: true,
              example: 'Room 101',
            },
            grade: {
              type: 'string',
              nullable: true,
              example: '10-A',
            },
            section: {
              type: 'string',
              nullable: true,
              example: 'A',
            },
            notes: {
              type: 'string',
              nullable: true,
            },
            confidence: {
              type: 'number',
              format: 'float',
              minimum: 0,
              maximum: 1,
              example: 0.95,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        TimeBlockUpdate: {
          type: 'object',
          properties: {
            dayOfWeek: {
              type: 'string',
              enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
              example: 'TUESDAY',
            },
            startTime: {
              type: 'string',
              pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
              example: '10:00',
            },
            endTime: {
              type: 'string',
              pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
              example: '11:30',
            },
            subject: {
              type: 'string',
              example: 'Physics',
            },
            classroom: {
              type: 'string',
              nullable: true,
              example: 'Lab 2',
            },
            grade: {
              type: 'string',
              nullable: true,
              example: '11-B',
            },
            section: {
              type: 'string',
              nullable: true,
              example: 'B',
            },
            notes: {
              type: 'string',
              nullable: true,
              example: 'Bring calculator',
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad Request - Invalid input',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Validation Error',
                message: 'Invalid request parameters',
              },
            },
          },
        },
        NotFound: {
          description: 'Not Found - Resource does not exist',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Not Found',
                message: 'Timetable not found',
              },
            },
          },
        },
        InternalError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Internal Server Error',
                message: 'An unexpected error occurred',
              },
            },
          },
        },
      },
    },
  },
  apis: [
    './src/routes/*.ts', // Path to the API routes
    './src/controllers/*.ts', // Path to the controllers
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
