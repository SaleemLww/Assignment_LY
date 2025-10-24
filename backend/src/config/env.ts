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


import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  CORS_ORIGIN: string;
  DATABASE_URL: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  GOOGLE_SERVICE_ACCOUNT_JSON?: string;
  DEEPSEEK_API_KEY?: string;
  WHICH_OCR_KEY?: string;
  LANGCHAIN_TRACING_V2?: string;
  LANGCHAIN_API_KEY?: string;
  LANGCHAIN_PROJECT?: string;
  UPLOAD_DIR: string;
  MAX_FILE_SIZE: number;
  // Intelligent Agent Configuration
  USE_AGENTIC_WORKFLOW: boolean;
  AGENT_MAX_ITERATIONS: number;
  AGENT_VERBOSE: boolean;
}

class Config {
  public readonly env: EnvironmentConfig;

  constructor() {
    this.env = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): EnvironmentConfig {
    return {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: parseInt(process.env.PORT || '5000', 10),
      CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
      DATABASE_URL: process.env.DATABASE_URL || '',
      REDIS_HOST: process.env.REDIS_HOST || 'localhost',
      REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
      REDIS_PASSWORD: process.env.REDIS_PASSWORD,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      GOOGLE_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
      WHICH_OCR_KEY: process.env.WHICH_OCR_KEY,
      LANGCHAIN_TRACING_V2: process.env.LANGCHAIN_TRACING_V2,
      LANGCHAIN_API_KEY: process.env.LANGCHAIN_API_KEY,
      LANGCHAIN_PROJECT: process.env.LANGCHAIN_PROJECT,
      UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
      MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
      // Intelligent Agent Configuration - Defaults to use agents
      USE_AGENTIC_WORKFLOW: process.env.USE_AGENTIC_WORKFLOW !== 'false', // true by default
      AGENT_MAX_ITERATIONS: parseInt(process.env.AGENT_MAX_ITERATIONS || '5', 10),
      AGENT_VERBOSE: process.env.AGENT_VERBOSE === 'true',
    };
  }

  private validateConfig(): void {
    const required = ['DATABASE_URL'];
    const missing = required.filter((key) => !this.env[key as keyof EnvironmentConfig]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Check if at least one LLM API key is provided
    if (!this.env.OPENAI_API_KEY && !this.env.ANTHROPIC_API_KEY) {
      throw new Error('At least one LLM API key (OPENAI_API_KEY or ANTHROPIC_API_KEY) must be provided');
    }
  }

  public isDevelopment(): boolean {
    return this.env.NODE_ENV === 'development';
  }

  public isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }

  public isTest(): boolean {
    return this.env.NODE_ENV === 'test';
  }
}

export const config = new Config();
