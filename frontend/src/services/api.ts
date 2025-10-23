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


import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface TimeBlock {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject: string;
  classroom?: string;
  grade?: string;
  section?: string;
  notes?: string;
  confidence: number;
}

export interface Timetable {
  id: string;
  teacherId: string;
  teacherName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  processingProgress: number;
  confidence?: number;
  errorMessage?: string;
  academicYear?: string;
  semester?: string;
  createdAt: string;
  updatedAt: string;
  timeBlocks: TimeBlock[];
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    jobId: string;
    timetableId: string;
    fileName: string;
    fileSize: number;
    status: string;
  };
}

export interface JobStatus {
  jobId: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  result?: {
    timetableId: string;
    confidence: number;
    timeBlocksCount: number;
  };
  failedReason?: string;
}

export interface TimetablesListResponse {
  data: Timetable[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Upload timetable file
export const uploadTimetable = async (file: File, teacherName: string): Promise<UploadResponse> => {
  console.log('🚀 Uploading file:', file.name, 'for teacher:', teacherName);
  console.log('📡 API Base URL:', API_BASE_URL);
  console.log('🎯 Full URL will be:', `${API_BASE_URL}/upload`);
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('teacherName', teacherName);

  try {
    const response = await api.post<UploadResponse>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('✅ Upload successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Upload failed:', error);
    throw error;
  }
};

// Get job status
export const getJobStatus = async (jobId: string): Promise<JobStatus> => {
  const response = await api.get<{ success: boolean; message: string; data: any }>(`/upload/status/${jobId}`);
  const jobData = response.data.data;
  
  // Transform backend response to frontend format
  return {
    jobId: jobData.id,
    status: jobData.state, // Backend uses 'state' instead of 'status'
    progress: jobData.progress || 0,
    result: jobData.returnvalue, // Backend uses 'returnvalue' for job result
    failedReason: jobData.failedReason,
  };
};

// Get timetable by ID
export const getTimetable = async (id: string): Promise<Timetable> => {
  const response = await api.get<{ success: boolean; message: string; data: any }>(`/v1/timetables/${id}`);
  const data = response.data.data;
  
  // Transform backend response to frontend format
  return {
    id: data.id,
    teacherId: data.teacher.id,
    teacherName: data.teacher.name,
    fileName: data.fileInfo.originalName,
    fileSize: data.fileInfo.fileSize,
    mimeType: data.fileInfo.fileType,
    status: data.status,
    processingProgress: 100, // Completed timetables are at 100%
    confidence: data.confidence,
    errorMessage: data.errorMessage,
    academicYear: data.academicYear,
    semester: data.semester,
    createdAt: data.uploadedAt,
    updatedAt: data.uploadedAt,
    timeBlocks: data.timeBlocks,
  };
};

// List all timetables with pagination
export const listTimetables = async (params?: {
  page?: number;
  limit?: number;
  teacherId?: string;
  status?: string;
  sort?: string;
}): Promise<TimetablesListResponse> => {
  const response = await api.get<{ success: boolean; data: any; meta: any }>('/v1/timetables', { params });
  
  // Transform each timetable in the list
  const transformedData = response.data.data.map((item: any) => ({
    id: item.id,
    teacherId: item.teacher.id,
    teacherName: item.teacher.name,
    fileName: item.fileInfo.originalName,
    fileSize: item.fileInfo.fileSize,
    mimeType: item.fileInfo.fileType,
    status: item.status,
    processingProgress: item.status === 'COMPLETED' ? 100 : item.status === 'PROCESSING' ? 50 : 0,
    confidence: item.confidence,
    errorMessage: item.errorMessage,
    academicYear: item.academicYear,
    semester: item.semester,
    createdAt: item.uploadedAt,
    updatedAt: item.uploadedAt,
    timeBlocks: item.timeBlocks || [],
  }));
  
  return {
    data: transformedData,
    meta: response.data.meta,
  };
};

// Delete timetable
export const deleteTimetable = async (id: string): Promise<void> => {
  await api.delete(`/v1/timetables/${id}`);
};

// Update time block
export const updateTimeBlock = async (
  timetableId: string,
  blockId: string,
  data: Partial<TimeBlock>
): Promise<TimeBlock> => {
  const response = await api.patch<TimeBlock>(
    `/v1/timetables/${timetableId}/blocks/${blockId}`,
    data
  );
  return response.data;
};

export default api;
