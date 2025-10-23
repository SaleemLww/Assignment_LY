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


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listTimetables, type Timetable } from '../services/api';
import { FileText, ChevronLeft, Loader2, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

export default function TimetablesListPage() {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTimetables = async () => {
      try {
        const response = await listTimetables({ page: 1, limit: 20 });
        setTimetables(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load timetables');
      } finally {
        setLoading(false);
      }
    };

    fetchTimetables();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">All Timetables</h1>
              <p className="mt-1 text-sm text-gray-600">
                View and manage all extracted timetables
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">{error}</p>
          </div>
        ) : timetables.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No timetables found. Upload your first timetable!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {timetables.map((timetable) => (
              <div
                key={timetable.id}
                onClick={() => navigate(`/timetables/${timetable.id}`)}
                className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {timetable.fileName}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(timetable.status)}`}>
                        {timetable.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{timetable.teacherName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(timetable.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                      {timetable.timeBlocks && (
                        <span className="font-medium">{timetable.timeBlocks.length} time blocks</span>
                      )}
                      {timetable.confidence && (
                        <span className="font-medium text-green-600">{timetable.confidence}% confidence</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
