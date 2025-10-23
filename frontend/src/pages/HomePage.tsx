import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import ProcessingStatus from '../components/ProcessingStatus';
import { Upload, Clock, CheckCircle, FileText } from 'lucide-react';

export default function HomePage() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [timetableId, setTimetableId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleUploadSuccess = (jobId: string, timetableId: string) => {
    setJobId(jobId);
    setTimetableId(timetableId);
  };

  const handleProcessingComplete = () => {
    if (timetableId) {
      // Redirect to timetable detail page
      setTimeout(() => {
        navigate(`/timetables/${timetableId}`);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                AI Timetable Extraction
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Upload teacher timetables and extract structured data with AI
              </p>
            </div>
            <button
              onClick={() => navigate('/timetables')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              View All Timetables
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Upload</h3>
            <p className="text-sm text-gray-600">
              Drag & drop or click to upload PNG, JPEG, PDF, or DOCX files
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-success" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Processing</h3>
            <p className="text-sm text-gray-600">
              Watch as AI extracts and structures your timetable data in real-time
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">High Accuracy</h3>
            <p className="text-sm text-gray-600">
              OpenAI Vision + Intelligent Agent achieves 95%+ extraction accuracy
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Timetable</h2>
          
          {!jobId ? (
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          ) : (
            <ProcessingStatus 
              jobId={jobId} 
              timetableId={timetableId}
              onComplete={handleProcessingComplete}
            />
          )}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How it works</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <span><strong>Upload:</strong> Select your timetable file (PNG, JPEG, PDF, or DOCX)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <span><strong>AI Processing:</strong> OpenAI Vision extracts text, Intelligent Agent validates and enhances data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              <span><strong>Structured Output:</strong> LLM converts to structured timetable with time blocks, subjects, and more</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">4.</span>
              <span><strong>View & Edit:</strong> Review extracted data, edit if needed, and export to various formats</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
