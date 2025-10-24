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
import { useParams, useNavigate } from 'react-router-dom';
import { getTimetable, type Timetable } from '../services/api';
import { ChevronLeft, Loader2, Calendar, User, BookOpen, Clock, CalendarDays, CalendarRange } from 'lucide-react';

type ViewMode = 'daily' | 'weekly' | 'monthly';

export default function TimetableDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');

  useEffect(() => {
    const fetchTimetable = async () => {
      if (!id) return;

      try {
        const data = await getTimetable(id);
        setTimetable(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load timetable');
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [id]);

  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  const getTimeBlocksByDay = (day: string) => {
    return timetable?.timeBlocks.filter((block) => block.dayOfWeek === day).sort((a, b) => {
      return a.startTime.localeCompare(b.startTime);
    }) || [];
  };

  // Helper function to format day for display
  const formatDayName = (day: string) => {
    return day.charAt(0) + day.slice(1).toLowerCase();
  };

  // Get all unique time slots across all days
  const getAllTimeSlots = () => {
    if (!timetable) return [];
    const timeSlots = new Set<string>();
    timetable.timeBlocks.forEach(block => {
      timeSlots.add(block.startTime);
    });
    return Array.from(timeSlots).sort();
  };

  // Get time block for specific day and time
  const getBlockForDayAndTime = (day: string, time: string) => {
    return timetable?.timeBlocks.find(
      block => block.dayOfWeek === day && block.startTime === time
    );
  };

  // Render weekly grid view - Shows ALL 7 days of the week
  const renderWeeklyView = () => {
    const timeSlots = getAllTimeSlots();

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 w-32">
                Time
              </th>
              {daysOfWeek.map(day => (
                <th key={day} className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">
                  {formatDayName(day)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.length > 0 ? (
              timeSlots.map(time => (
                <tr key={time} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 font-medium text-gray-600 bg-gray-50">
                    {time}
                  </td>
                  {daysOfWeek.map(day => {
                    const block = getBlockForDayAndTime(day, time);
                    return (
                      <td key={`${day}-${time}`} className="border border-gray-300 px-3 py-2">
                        {block ? (
                          <div className="space-y-1">
                            <div className="font-semibold text-sm text-gray-900">{block.subject}</div>
                            <div className="text-xs text-gray-600">
                              {block.startTime} - {block.endTime}
                            </div>
                            {block.classroom && (
                              <div className="text-xs text-gray-500">📍 {block.classroom}</div>
                            )}
                            {block.grade && (
                              <div className="text-xs text-gray-500">📚 Grade {block.grade} {block.section}</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-300 text-xs text-center py-4">—</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                  No time blocks available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Render daily view (single day detailed)
  const renderDailyView = () => {
    const activeDays = daysOfWeek.filter(day => getTimeBlocksByDay(day).length > 0);
    const selectedDay = activeDays[0] || daysOfWeek[0];
    const blocks = getTimeBlocksByDay(selectedDay);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-bold text-gray-900">{formatDayName(selectedDay)}</h3>
        </div>
        <div className="space-y-3">
          {blocks.map(block => (
            <div key={block.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-primary text-white text-sm font-medium rounded">
                      {block.startTime} - {block.endTime}
                    </span>
                    <h4 className="font-semibold text-lg text-gray-900">{block.subject}</h4>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {block.classroom && <span>📍 {block.classroom}</span>}
                    {block.grade && <span>📚 Grade {block.grade}</span>}
                    {block.section && <span>📋 Section {block.section}</span>}
                  </div>
                  {block.notes && (
                    <p className="mt-2 text-sm text-gray-600 italic">{block.notes}</p>
                  )}
                </div>
                <span className="text-xs text-gray-500">{Math.round(block.confidence)}% confident</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render monthly view (calendar-like grid with all days of the week)
  const renderMonthlyView = () => {
    return (
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {daysOfWeek.map(day => (
          <div key={day} className="bg-primary text-white px-3 py-2 rounded-t-lg text-center font-bold text-sm">
            {formatDayName(day)}
          </div>
        ))}
        
        {/* Day cells */}
        {daysOfWeek.map(day => {
          const blocks = getTimeBlocksByDay(day);
          const hasClasses = blocks.length > 0;
          
          return (
            <div 
              key={day} 
              className={`border rounded-lg overflow-hidden min-h-[200px] flex flex-col ${
                hasClasses ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50'
              }`}
            >
              {/* Day header with class count */}
              <div className={`px-3 py-2 text-center text-sm font-medium ${
                hasClasses ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
              }`}>
                {blocks.length} {blocks.length === 1 ? 'class' : 'classes'}
              </div>
              
              {/* Classes list */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {hasClasses ? (
                  blocks.map(block => (
                    <div 
                      key={block.id} 
                      className="border-l-4 border-primary pl-2 py-1.5 hover:bg-gray-50 rounded-r transition-colors"
                    >
                      <div className="font-semibold text-xs text-gray-900 truncate" title={block.subject}>
                        {block.subject}
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {block.startTime}
                      </div>
                      {block.classroom && (
                        <div className="text-xs text-gray-500 mt-0.5 truncate" title={block.classroom}>
                          📍 {block.classroom}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                    No classes
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/timetables')}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Timetable Details</h1>
              {timetable && (
                <p className="mt-1 text-sm text-gray-600">
                  {timetable.teacherName} • {timetable.fileName}
                </p>
              )}
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
        ) : timetable ? (
          <div className="space-y-6">
            {/* Info Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-gray-600">Teacher</span>
                </div>
                <p className="font-semibold text-gray-900">{timetable.teacherName}</p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-gray-600">Time Blocks</span>
                </div>
                <p className="font-semibold text-gray-900">{timetable.timeBlocks.length}</p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-gray-600">Semester</span>
                </div>
                <p className="font-semibold text-gray-900">{timetable.semester || 'N/A'}</p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-gray-600">Confidence</span>
                </div>
                <p className="font-semibold text-green-600">{timetable.confidence || 0}%</p>
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {viewMode === 'daily' && 'Daily Schedule'}
                  {viewMode === 'weekly' && 'Weekly Schedule'}
                  {viewMode === 'monthly' && 'Monthly Calendar'}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('daily')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      viewMode === 'daily'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <CalendarDays className="w-4 h-4 inline mr-2" />
                    Daily
                  </button>
                  <button
                    onClick={() => setViewMode('weekly')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      viewMode === 'weekly'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Weekly
                  </button>
                  <button
                    onClick={() => setViewMode('monthly')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      viewMode === 'monthly'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <CalendarRange className="w-4 h-4 inline mr-2" />
                    Monthly
                  </button>
                </div>
              </div>
            </div>

            {/* Timetable Grid */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6">
                {viewMode === 'daily' && renderDailyView()}
                {viewMode === 'weekly' && renderWeeklyView()}
                {viewMode === 'monthly' && renderMonthlyView()}
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
