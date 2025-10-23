import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TimetableDetailPage from './pages/TimetableDetailPage';
import TimetablesListPage from './pages/TimetablesListPage';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/timetables" element={<TimetablesListPage />} />
        <Route path="/timetables/:id" element={<TimetableDetailPage />} />
      </Routes>
    </div>
  );
}

export default App;
