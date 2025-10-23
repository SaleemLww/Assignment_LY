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
  const response = await api.get<JobStatus>(`/upload/status/${jobId}`);
  return response.data;
};

// Get timetable by ID
export const getTimetable = async (id: string): Promise<Timetable> => {
  const response = await api.get<Timetable>(`/v1/timetables/${id}`);
  return response.data;
};

// List all timetables with pagination
export const listTimetables = async (params?: {
  page?: number;
  limit?: number;
  teacherId?: string;
  status?: string;
  sort?: string;
}): Promise<TimetablesListResponse> => {
  const response = await api.get<TimetablesListResponse>('/v1/timetables', { params });
  return response.data;
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
