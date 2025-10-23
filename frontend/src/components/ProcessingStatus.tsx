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


import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { getJobStatus, getTimetable, type JobStatus, type Timetable } from '../services/api';

interface ProcessingStatusProps {
  jobId: string;
  timetableId: string | null;
  onComplete: () => void;
}

export default function ProcessingStatus({ jobId, timetableId, onComplete }: ProcessingStatusProps) {
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const jobStatus = await getJobStatus(jobId);
        setStatus(jobStatus);

        if (jobStatus.status === 'completed' && jobStatus.result?.timetableId && timetableId) {
          // Fetch timetable details
          const timetableData = await getTimetable(timetableId);
          setTimetable(timetableData);
          clearInterval(interval);
          onComplete();
        } else if (jobStatus.status === 'failed') {
          setError(jobStatus.failedReason || 'Processing failed');
          clearInterval(interval);
        }
      } catch (err: any) {
        console.error('Error polling status:', err);
        setError(err.response?.data?.message || 'Failed to fetch status');
        clearInterval(interval);
      }
    };

    // Initial poll
    pollStatus();

    // Poll every 2 seconds
    interval = setInterval(pollStatus, 2000);

    return () => clearInterval(interval);
  }, [jobId, timetableId, onComplete]);

  const getStatusIcon = () => {
    if (!status) return <Loader2 className="w-8 h-8 animate-spin text-primary" />;

    switch (status.status) {
      case 'waiting':
        return <Clock className="w-8 h-8 text-yellow-500" />;
      case 'active':
        return <Loader2 className="w-8 h-8 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-success" />;
      case 'failed':
        return <XCircle className="w-8 h-8 text-error" />;
      default:
        return <Loader2 className="w-8 h-8 animate-spin text-primary" />;
    }
  };

  const getStatusText = () => {
    if (!status) return 'Initializing...';

    switch (status.status) {
      case 'waiting':
        return 'Waiting in queue...';
      case 'active':
        return 'Processing with AI...';
      case 'completed':
        return 'Processing complete!';
      case 'failed':
        return 'Processing failed';
      default:
        return 'Processing...';
    }
  };

  const getProgressText = () => {
    if (!status) return '';

    const progress = status.progress || 0;

    if (progress <= 10) return 'Uploading file...';
    if (progress <= 60) return 'Extracting text with OCR...';
    if (progress <= 80) return 'Enhancing with Intelligent Agent...';
    if (progress <= 95) return 'Structuring data with LLM...';
    return 'Finalizing...';
  };

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="flex items-center gap-4">
        {getStatusIcon()}
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900">{getStatusText()}</h3>
          <p className="text-sm text-gray-600 mt-1">{getProgressText()}</p>
        </div>
      </div>

      {/* Progress Bar */}
      {status && status.status !== 'failed' && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span className="font-medium">{status.progress || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-primary-light h-full transition-all duration-500 ease-out"
              style={{ width: `${status.progress || 0}%` }}
            >
              <div className="w-full h-full bg-white/30 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Steps */}
      {status && status.status === 'active' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className={`p-4 rounded-lg border-2 ${(status.progress || 0) > 10 ? 'border-primary bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className={`w-5 h-5 ${(status.progress || 0) > 10 ? 'text-primary' : 'text-gray-400'}`} />
              <span className="font-medium text-sm">OCR Extraction</span>
            </div>
            <p className="text-xs text-gray-600">OpenAI Vision API</p>
          </div>

          <div className={`p-4 rounded-lg border-2 ${(status.progress || 0) > 60 ? 'border-primary bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className={`w-5 h-5 ${(status.progress || 0) > 60 ? 'text-primary' : 'text-gray-400'}`} />
              <span className="font-medium text-sm">Agent Enhancement</span>
            </div>
            <p className="text-xs text-gray-600">Validation & Correction</p>
          </div>

          <div className={`p-4 rounded-lg border-2 ${(status.progress || 0) > 80 ? 'border-primary bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className={`w-5 h-5 ${(status.progress || 0) > 80 ? 'text-primary' : 'text-gray-400'}`} />
              <span className="font-medium text-sm">LLM Structuring</span>
            </div>
            <p className="text-xs text-gray-600">Structured Output</p>
          </div>
        </div>
      )}

      {/* Success Summary */}
      {status && status.status === 'completed' && status.result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h4 className="font-semibold text-green-900 mb-4">Extraction Complete!</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-green-700">Confidence Score</p>
              <p className="text-2xl font-bold text-green-900">{status.result.confidence}%</p>
            </div>
            <div>
              <p className="text-sm text-green-700">Time Blocks</p>
              <p className="text-2xl font-bold text-green-900">{status.result.timeBlocksCount}</p>
            </div>
            <div>
              <p className="text-sm text-green-700">Status</p>
              <p className="text-sm font-semibold text-green-900">Redirecting...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h4 className="font-semibold text-red-900 mb-2">Processing Failed</h4>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
