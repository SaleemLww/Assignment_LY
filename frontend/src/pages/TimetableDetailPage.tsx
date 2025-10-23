import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTimetable, type Timetable } from '../services/api';
import { ChevronLeft, Loader2, Calendar, User, BookOpen, Clock } from 'lucide-react';

export default function TimetableDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

            {/* Timetable Grid */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Weekly Schedule</h2>

                <div className="space-y-6">
                  {daysOfWeek.map((day) => {
                    const blocks = getTimeBlocksByDay(day);
                    if (blocks.length === 0) return null;

                    return (
                      <div key={day}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">{formatDayName(day)}</h3>
                        <div className="grid gap-3">{blocks.map((block) => (
                            <div
                              key={block.id}
                              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="px-2 py-1 bg-primary text-white text-xs font-medium rounded">
                                      {block.startTime} - {block.endTime}
                                    </span>
                                    <h4 className="font-semibold text-gray-900">{block.subject}</h4>
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
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
