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


import app from './app';
import { config } from './config/env';
import timetableWorker, { closeWorker } from './queues/timetable.worker';

const PORT = config.env.PORT;

// Start server
const server = app.listen(PORT, () => {
  console.log('=================================');
  console.log(`🚀 Server is running`);
  console.log(`📍 Environment: ${config.env.NODE_ENV}`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log(`🔥 Worker: Started and listening for jobs`);
  console.log('=================================');
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Close worker first
  await closeWorker();
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    console.log('👋 Process terminated');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

export default server;
