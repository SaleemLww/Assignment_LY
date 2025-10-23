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


import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadTimetable } from '../services/api';

interface FileUploadProps {
  onUploadSuccess: (jobId: string, timetableId: string) => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [teacherName, setTeacherName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      // PDF and DOCX temporarily disabled - coming soon
      // 'application/pdf': ['.pdf'],
      // 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    // Use a default name if not provided - will be replaced by extracted name
    const nameToUse = teacherName.trim() || 'Pending Extraction';

    setIsUploading(true);

    try {
      const response = await uploadTimetable(selectedFile, nameToUse);
      toast.success('File uploaded successfully! Processing...');
      onUploadSuccess(response.data.jobId, response.data.timetableId);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload file');
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Teacher Name Input */}
      <div>
        <label htmlFor="teacherName" className="block text-sm font-medium text-gray-700 mb-2">
          Teacher Name <span className="text-gray-500 text-xs">(will be auto-extracted from document)</span>
        </label>
        <input
          type="text"
          id="teacherName"
          value={teacherName}
          onChange={(e) => setTeacherName(e.target.value)}
          placeholder="Enter temporary name (optional - will be updated after extraction)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={isUploading}
        />
        <p className="mt-1 text-xs text-gray-500">
          💡 You can enter any temporary name. The actual teacher name will be extracted from the timetable document and updated automatically.
        </p>
      </div>

      {/* File Upload Dropzone */}
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-blue-50'
              : 'border-gray-300 hover:border-primary hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            {isDragActive ? 'Drop the file here' : 'Drag & drop or click to select'}
          </p>
          <p className="text-sm text-gray-600">
            Supported formats: PNG, JPEG (Max 10MB)
          </p>
          <p className="text-xs text-amber-600 mt-2 font-medium">
            🚧 PDF & DOCX support coming soon with LangGraph workflow
          </p>
        </div>
      ) : (
        <div className="border-2 border-green-300 bg-green-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <File className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              disabled={isUploading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || !teacherName.trim() || isUploading}
        className="w-full py-3 px-6 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Upload & Process
          </>
        )}
      </button>
    </div>
  );
}
