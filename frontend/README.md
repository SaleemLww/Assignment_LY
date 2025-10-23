# Teacher Timetable Extraction - Frontend

Modern React + TypeScript frontend for the AI-Powered Teacher Timetable Extraction System.

## 🚀 Tech Stack

- **React 18.3** - UI library
- **TypeScript 5.5** - Type safety
- **Vite 5.3** - Fast build tool & dev server
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **React Router 6.26** - Client-side routing
- **Axios 1.7** - HTTP client for API calls
- **React Dropzone 14.2** - Drag & drop file upload
- **React Hot Toast 2.4** - Beautiful notifications
- **Lucide React** - Modern icon library
- **date-fns** - Date formatting

## 📦 Features

### 1. File Upload with Drag & Drop
- ✅ Drag & drop or click to upload
- ✅ Support for PNG, JPEG, PDF, DOCX
- ✅ File validation (type & size)
- ✅ Real-time upload feedback
- ✅ Teacher name input

### 2. Real-time Processing Status
- ✅ Live progress tracking (0-100%)
- ✅ 3-stage processing visualization:
  - OCR Extraction (OpenAI Vision)
  - Agent Enhancement (Validation & Correction)
  - LLM Structuring (Structured Output)
- ✅ Real-time status polling (2-second intervals)
- ✅ Success/Error notifications
- ✅ Auto-redirect to timetable view

### 3. Timetable Viewing
- ✅ List all timetables with filtering
- ✅ Detailed timetable view with weekly schedule
- ✅ Color-coded status badges
- ✅ Confidence scores for each time block
- ✅ Organized by day of week
- ✅ Full metadata display (teacher, semester, etc.)

### 4. Responsive Design
- ✅ Mobile-first approach
- ✅ Beautiful gradient backgrounds
- ✅ Smooth animations & transitions
- ✅ Clean, modern UI with Tailwind CSS

## 🎨 UI/UX Highlights

- **Color Scheme**: Blue primary, green success, red error
- **Typography**: Sans-serif system fonts for readability
- **Icons**: Lucide React icons for modern, consistent design
- **Animations**: Smooth transitions, spinning loaders, progress bars
- **Responsive**: Works on mobile, tablet, and desktop

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ (recommend 18.x or 20.x)
- npm 9+ or yarn 1.22+
- Backend server running on http://localhost:5000

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

### Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

## 📂 Project Structure

```
frontend/
├── public/                # Static assets
├── src/
│   ├── components/        # Reusable React components
│   │   ├── FileUpload.tsx       # Drag & drop file upload
│   │   └── ProcessingStatus.tsx # Real-time status tracking
│   ├── pages/             # Page components (routes)
│   │   ├── HomePage.tsx           # Main landing page
│   │   ├── TimetablesListPage.tsx # List all timetables
│   │   └── TimetableDetailPage.tsx # View single timetable
│   ├── services/          # API integration
│   │   └── api.ts         # Axios API client & types
│   ├── App.tsx            # Root component with routing
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles (Tailwind)
├── index.html             # HTML template
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── package.json           # Dependencies & scripts
```

## 🔌 API Integration

The frontend communicates with the backend API at `http://localhost:5000/api`:

### Endpoints Used:
- `POST /api/upload` - Upload timetable file
- `GET /api/upload/status/:jobId` - Poll processing status
- `GET /api/v1/timetables` - List all timetables
- `GET /api/v1/timetables/:id` - Get timetable details
- `DELETE /api/v1/timetables/:id` - Delete timetable
- `PATCH /api/v1/timetables/:timetableId/blocks/:blockId` - Update time block

### API Client (`src/services/api.ts`)
- Axios instance with base URL configuration
- TypeScript interfaces for all API responses
- Environment variable support (`VITE_API_URL`)
- Error handling with user-friendly messages

## 🔐 Environment Variables

Create a `.env` file in the frontend root:

```env
VITE_API_URL=http://localhost:5000/api
```

## 🧪 Testing Workflow

1. **Upload File**: Go to homepage, enter teacher name, drag & drop file
2. **Watch Processing**: See real-time progress (OCR → Agent → LLM)
3. **View Results**: Auto-redirected to detailed timetable view
4. **Browse Timetables**: Navigate to "View All Timetables" to see history

## 🎯 Key Components

### `FileUpload.tsx`
- React Dropzone integration
- File validation (type, size)
- Teacher name input
- Upload button with loading state
- Error handling with toast notifications

### `ProcessingStatus.tsx`
- Real-time status polling (useEffect + setInterval)
- Progress bar with percentage
- 3-stage processing visualization
- Success/Error states
- Auto-redirect on completion

### `TimetableDetailPage.tsx`
- Fetch timetable data by ID
- Organize time blocks by day of week
- Display metadata (teacher, confidence, semester)
- Color-coded status badges
- Responsive grid layout

## 🚀 Performance Optimizations

- **Code Splitting**: Lazy loading with React.lazy (can be added)
- **Vite**: Lightning-fast HMR (Hot Module Replacement)
- **Tailwind CSS**: Utility classes minimize CSS bundle size
- **Axios**: Reusable API client with interceptors
- **React Router**: Client-side routing for instant navigation

## 🎨 Styling System

### Tailwind CSS Configuration
- Custom primary color: `#3b82f6` (blue)
- Success: `#10b981` (green)
- Error: `#ef4444` (red)
- Warning: `#f59e0b` (amber)

### Responsive Breakpoints
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🔧 Development

### Start Development Server
```bash
npm run dev
```

### Lint Code
```bash
npm run lint
```

### Build for Production
```bash
npm run build
```

## 📄 License

MIT License - See LICENSE file for details

## 🙌 Credits

Built with ❤️ using:
- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide Icons
- React Dropzone

---

**Live Demo**: http://localhost:3000  
**API Docs**: http://localhost:5000/api-docs  
**Backend**: See `../backend/README.md`
