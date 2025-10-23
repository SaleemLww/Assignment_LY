# Teacher Timetable Extraction System

> **⚠️ LOCKED DOCUMENT - DO NOT MODIFY**  
> This README is finalized. For progress tracking, update only `docs/TODO.md`

[![GitHub Repository](https://img.shields.io/badge/GitHub-Assignment__LY-blue?logo=github)](https://github.com/SaleemLww/Assignment_LY)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue?logo=postgresql)](https://www.postgresql.org/)

## 🎯 Project Overview

An intelligent platform that enables teachers to upload their weekly class timetables in various formats (images, PDFs, Word documents) and automatically extracts, parses, and displays the timetable data in a beautiful, standardized UI.

### Key Features
- 📄 Image upload support (PNG, JPEG) with AI-powered extraction
- 🤖 AI-powered data extraction using OpenAI Vision API + LangChain
- 📊 Intelligent OCR with cascading fallbacks (OpenAI → Google Gemini → Tesseract)
- 🎨 Beautiful, responsive timetable display with multiple view modes
- ⚡ Real-time processing with progress tracking via BullMQ
- 🔄 Edit and refine extracted data
- 📱 Mobile-friendly interface
- 🚧 **Coming Soon**: PDF & DOCX support with LangGraph intelligent agent workflow

### � Repository
```bash
git clone git@github.com:SaleemLww/Assignment_LY.git
cd Assignment_LY/TA_Assignment_Pack
```

## 📚 Documentation

Comprehensive documentation is available in the [`../docs/`](../docs/) folder at the repository root:

- **[REQUIREMENTS.md](./docs/REQUIREMENTS.md)** - Complete requirements analysis with functional/non-functional requirements
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - **NEW!** Current system architecture with detailed flowcharts, diagrams, and implementation details
- **[PLANED_ARCHITECTURE.md](./docs/PLANED_ARCHITECTURE.md)** - Initial planned architecture with Mermaid diagrams
- **[PROJECT_PLAN.md](./docs/PROJECT_PLAN.md)** - 48-hour development roadmap with phase breakdown
- **[TODO.md](./docs/TODO.md)** - Granular task breakdown (350+ tasks) with progress tracking
- **[FRONTEND_STRATEGY.md](./docs/FRONTEND_STRATEGY.md)** - Complete frontend implementation guide with 15+ component specifications
- **[PROGRESS_REPORT.md](./docs/PROGRESS_REPORT.md)** - Current progress and achievements
- **[QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md)** - Quick navigation guide

### 🖼️ Example Timetables
Test timetable files are available in [`./TA_Assignment_Pack/examples/`](./TA_Assignment_Pack/examples/) for development and testing.

---

## 🏗️ Technology Stack and 🏗️ System Architecture

### Technology Stack

#### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15+
- **Caching/Queue**: Redis + BullMQ
- **ORM**: Prisma or TypeORM
- **File Processing**: 
  - Multer (file upload)
  - pdf-parse, pdfjs-dist (PDF processing)
  - mammoth (DOCX processing)
  - Tesseract.js or Google Cloud Vision API (OCR)
- **AI/LLM**:
  - LangChain (orchestration)
  - LlamaIndex (document processing)
  - OpenAI GPT-4 or Anthropic Claude
  - LangSmith (monitoring)

#### Frontend
- **Framework**: React 18+ with TypeScript
- **Meta Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Query + Zustand
- **Forms**: React Hook Form + Zod
- **UI Components**: 
  - react-big-calendar or FullCalendar
  - Radix UI primitives

#### DevOps & Tools
- **Containerization**: Docker + Docker Compose
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest + React Testing Library
- **CI/CD**: GitHub Actions
- **Code Quality**: ESLint, Prettier, Husky
- **Monitoring**: Winston (logging)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ and npm/yarn
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional, recommended)
- Git

### API Keys Required
- OpenAI API Key or Anthropic Claude API Key
- (Optional) Google Cloud Vision API Key for enhanced OCR

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone git@github.com:SaleemLww/Assignment_LY.git
cd Assignment_LY/TA_Assignment_Pack
```

### 2. Environment Setup

**Important:** A `.env` file is already provided in the project root with all required API keys and database connection information. Ensure this file is present and properly configured before running the application.

> **Note:** A `.env.example` file is included in the repository as a reference template showing all available configuration options. The actual `.env` file with your API keys is excluded from version control for security.

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT` - Redis configuration
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` - AI/LLM API key
- `LANGCHAIN_API_KEY` - LangSmith monitoring (optional)
- See `.env.example` for complete configuration options

### 3. Quick Start with Server Scripts (macOS - Recommended)

The fastest way to get started on macOS:

```bash
# Start both backend and frontend servers
./start-servers.sh

# Stop all servers when done
./stop-servers.sh
```

This will automatically start both servers in separate Terminal windows for easy monitoring.

### 4. Using Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 5. Manual Setup

#### Backend
```bash
cd backend
npm install

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

#### Frontend
```bash
cd frontend
npm install

# Start development server
npm run dev
```

### 6. Server Management Scripts (Recommended for macOS)

The project includes convenient shell scripts for managing both backend and frontend servers simultaneously:

#### Start All Servers
```bash
./start-servers.sh
```

**What it does:**
- 🔪 Kills all existing Node.js processes (clean slate)
- 🚀 Starts backend server on port **5001** in a new Terminal window
- 🎨 Starts frontend server on port **3000** in a new Terminal window
- ✅ Provides visual feedback with colored output
- 📊 Shows server status and URLs

**Benefits:**
- One command to start everything
- Automatic cleanup of stale processes
- Separate terminal windows for easy monitoring
- Color-coded status messages
- No port conflicts

#### Stop All Servers
```bash
./stop-servers.sh
```

**What it does:**
- 🔪 Gracefully terminates all Node.js processes
- ✅ Confirms when servers are stopped
- 🧹 Cleans up background processes

**Use Cases:**
- Quick restart after code changes
- Clean shutdown before system maintenance
- Troubleshooting port conflicts
- Switching between projects

> **Note:** These scripts are designed for macOS and use AppleScript to open new Terminal windows. For Windows or Linux, use the manual setup commands above or adapt the scripts for your platform.

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Endpoints

#### 1. Upload Timetable
```http
POST /timetables/upload
Content-Type: multipart/form-data

Parameters:
- file: File (required) - The timetable file (PNG, JPEG, PDF, DOCX)
- teacherId: string (optional) - Teacher identifier
- title: string (optional) - Timetable title

Response (202 Accepted):
{
  "success": true,
  "data": {
    "timetableId": "uuid",
    "status": "processing",
    "message": "File uploaded and processing started"
  }
}
```

#### 2. Check Processing Status
```http
GET /timetables/:id/status

Response (200 OK):
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed|processing|failed",
    "progress": 75,
    "confidenceScore": 0.92,
    "message": "Processing complete"
  }
}
```

#### 3. Get Extracted Timetable
```http
GET /timetables/:id

Response (200 OK):
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Year 5 Timetable",
    "status": "completed",
    "confidenceScore": 0.92,
    "timeBlocks": [
      {
        "id": "uuid",
        "dayOfWeek": "Monday",
        "startTime": "09:00",
        "endTime": "10:00",
        "duration": 60,
        "eventName": "Mathematics",
        "eventType": "lesson",
        "notes": "",
        "colorCode": "#4CAF50",
        "confidenceScore": 0.95
      },
      // ... more time blocks
    ],
    "createdAt": "2025-10-22T10:00:00Z"
  }
}
```

#### 4. Update Time Block
```http
PATCH /timetables/:timetableId/blocks/:blockId
Content-Type: application/json

Body:
{
  "eventName": "Advanced Mathematics",
  "startTime": "09:15",
  "notes": "Room changed to Lab 2"
}

Response (200 OK):
{
  "success": true,
  "data": {
    // Updated time block
  }
}
```

#### 5. Delete Timetable
```http
DELETE /timetables/:id

Response (200 OK):
{
  "success": true,
  "message": "Timetable deleted successfully"
}
```

#### 6. List Timetables
```http
GET /timetables?teacherId=xxx&page=1&limit=10

Response (200 OK):
{
  "success": true,
  "data": {
    "timetables": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### Error Responses

```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_FORMAT",
    "message": "Only PNG, JPEG, PDF, and DOCX files are allowed",
    "details": {}
  }
}
```

### Status Codes
- `200` - Success
- `201` - Created
- `202` - Accepted (async processing)
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error

## 🎨 Frontend Access

Open your browser and navigate to:
```
http://localhost:3000
```

### Main Features
1. **Upload Page**: Drag & drop or click to upload timetable files
2. **Processing View**: Real-time progress tracking
3. **Timetable View**: Beautiful grid display with color coding
4. **Edit Mode**: Modify extracted data inline
5. **Export Options**: Download as PDF, Excel, or iCal

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- timetable.service.test.ts

# Run in watch mode
npm run test:watch
```

### Frontend Tests
```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 🏗️ Project Structure

```
Assignment_LY/
├── backend/                          # Backend API Server
│   ├── src/
│   │   ├── app.ts                   # Express app configuration
│   │   ├── server.ts                # Server entry point
│   │   ├── config/                  # Configuration files (env, redis)
│   │   ├── controllers/             # Request handlers (upload, timetable)
│   │   ├── services/                # Business logic
│   │   │   ├── ocr.service.ts       # OCR with OpenAI/Google Vision/Tesseract
│   │   │   ├── pdf.service.ts       # PDF extraction with AI
│   │   │   ├── docx.service.ts      # DOCX extraction with AI
│   │   │   ├── llm.service.ts       # LLM integration with LangChain
│   │   │   ├── extraction.service.ts # Unified extraction orchestrator
│   │   │   ├── embedding.service.ts  # Vector embeddings
│   │   │   ├── database.service.ts   # Prisma database operations
│   │   │   ├── simple-vector-store.ts # Vector storage
│   │   │   └── prompts/             # AI prompts
│   │   ├── routes/                  # API routes (upload, timetable)
│   │   ├── queues/                  # BullMQ job queue & worker
│   │   ├── middleware/              # Express middleware (upload)
│   │   ├── docs/                    # Swagger/OpenAPI config
│   │   ├── types/                   # TypeScript type definitions
│   │   └── utils/                   # Utility functions (logger)
│   ├── tests/                       # Real API integration tests
│   │   ├── integration/             # API, AI services, queue tests
│   │   ├── unit/                    # Unit tests (empty - future)
│   │   ├── fixtures/                # Test fixtures
│   │   ├── helpers/                 # Test helpers
│   │   └── README.md                # Test documentation
│   ├── prisma/                      # Prisma ORM
│   │   ├── schema.prisma            # Database schema
│   │   └── migrations/              # Database migrations
│   ├── uploads/                     # Temporary file storage
│   ├── logs/                        # Application logs
│   ├── Dockerfile                   # Production Docker image
│   ├── Dockerfile.dev               # Development Docker image
│   ├── .dockerignore                # Docker ignore rules
│   ├── package.json                 # Dependencies & scripts
│   ├── tsconfig.json                # TypeScript configuration
│   ├── jest.config.js               # Jest test configuration
│   └── nodemon.json                 # Nodemon configuration
│
├── frontend/                         # React Frontend App
│   ├── src/
│   │   ├── App.tsx                  # Main app component
│   │   ├── main.tsx                 # Entry point
│   │   ├── components/              # React components
│   │   │   ├── FileUpload.tsx       # File upload with drag-drop
│   │   │   └── ProcessingStatus.tsx # Real-time status display
│   │   ├── pages/                   # Page components
│   │   │   ├── HomePage.tsx         # Landing page with upload
│   │   │   ├── TimetablesListPage.tsx # List all timetables
│   │   │   └── TimetableDetailPage.tsx # View timetable details
│   │   ├── services/                # API client
│   │   │   └── api.ts               # Axios API service
│   │   ├── __tests__/               # Frontend tests
│   │   │   └── README.md            # Test setup guide
│   │   └── index.css                # Global styles
│   ├── public/                      # Static assets
│   ├── Dockerfile                   # Production Docker image (Nginx)
│   ├── Dockerfile.dev               # Development Docker image
│   ├── .dockerignore                # Docker ignore rules
│   ├── nginx.conf                   # Nginx configuration
│   ├── package.json                 # Dependencies & scripts
│   ├── vite.config.ts               # Vite configuration
│   ├── tailwind.config.js           # Tailwind CSS config
│   ├── postcss.config.js            # PostCSS configuration
│   ├── tsconfig.json                # TypeScript configuration
│   └── index.html                   # HTML template
│
├── docs/                             # Documentation
│   ├── ARCHITECTURE.md              # System architecture (1000+ lines)
│   ├── REQUIREMENTS.md              # Project requirements
│   ├── PROJECT_PLAN.md              # Development roadmap
│   ├── PLANED_ARCHITECTURE.md       # Initial architecture
│   ├── FRONTEND_STRATEGY.md         # Frontend implementation guide
│   ├── TODO.md                      # Task tracking (95% complete)
│   ├── PROGRESS_REPORT.md           # Current progress & achievements
│   ├── QUICK_REFERENCE.md           # Navigation guide
│   ├── SERVER_MANAGEMENT.md         # Server management guide
│   └── DOCKER_DEPLOYMENT.md         # Docker deployment guide
│
├── TA_Assignment_Pack/               # Assignment files
│   └── examples/                    # Sample timetable files
│       ├── Teacher Timetable Example 1.1.png
│       ├── Teacher Timetable Example 1.2.png
│       ├── Teacher Timetable Example 2.pdf
│       ├── Teacher Timetable Example 3.png
│       └── Teacher Timetable Example 4.jpeg
│
├── sampleJson/                       # Sample JSON data
│
├── .env                              # Environment variables (not in git)
├── .env.example                      # Environment template
├── .env.docker.example               # Docker environment template
├── .gitignore                        # Git ignore rules
├── .gitattributes                    # Git attributes
├── LICENSE                           # MIT License (Non-Commercial)
├── README.md                         # This file
├── docker-compose.yml                # Production Docker setup
├── docker-compose.dev.yml            # Development Docker setup
├── docker-start.sh                   # Docker quick start script
├── start-servers.sh                  # macOS server start script
└── stop-servers.sh                   # macOS server stop script
```

## 🔧 Development Workflow

### Git Workflow
```bash
# Create feature branch
git checkout -b LYA/add-export-functionality
git checkout -b LY Assignment/add-export-functionality

# Make changes and commit frequently
git add .
git commit -m "feat: add PDF export functionality"

# Push to remote
git push origin feature/add-export-functionality

# Create pull request
```

### Commit Convention
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `LYA:` - Learning Yogi Assignment specific changes
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection string in .env
DATABASE_URL=postgresql://user:password@localhost:5432/timetable_db
```

#### 2. Redis Connection Error
```bash
# Check Redis is running
docker ps | grep redis

# Test Redis connection
redis-cli ping
```

#### 3. File Upload Fails
- Check `MAX_FILE_SIZE` in .env
- Ensure `uploads/` directory exists and is writable
- Verify file format is supported

#### 4. OCR Not Working
- Verify Tesseract is installed: `tesseract --version`
- Check Google Cloud Vision API key if using cloud OCR
- Review OCR service logs

#### 5. LLM API Errors
- Verify API key is set correctly
- Check API rate limits
- Review LangSmith logs for detailed traces

## 📊 Monitoring & Logging

### View Logs
```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend

# All services
docker-compose logs -f
```

### Log Levels
- `error` - Critical errors
- `warn` - Warning messages
- `info` - General information
- `debug` - Detailed debug information

## 🚀 Deployment

### Production Build

#### Backend
```bash
cd backend
npm run build
npm start
```

#### Frontend
```bash
cd frontend
npm run build
npm start
```

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is created for Learning Yogi Technical Assessment.

## 🔗 Resources

- [Design Handover Video](https://www.loom.com/share/a7e81713dd0749b7838f4107a00e906e?sid=92b4f509-d609-441a-8c33-0799bc26281c)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [LangChain Documentation](https://js.langchain.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

## 📞 Support

For questions or issues, please create a GitHub issue or contact the development team.

## ✅ Assessment Completion Checklist

- [ ] Architectural Design Plan (PDF with diagrams)
- [ ] Backend Prototype (Node.js + Express)
- [ ] File Upload Endpoint Implementation
- [ ] Document Processing (OCR + LLM)
- [ ] JSON Response with Extracted Data
- [ ] Frontend Strategy Document
- [ ] Comprehensive README
- [ ] API Documentation
- [ ] Git Repository with Clear Commits
- [ ] Error Handling & Fallbacks
- [ ] Handover Video ([Loom](https://www.loom.com/share/a7e81713dd0749b7838f4107a00e906e?sid=92b4f509-d609-441a-8c33-0799bc26281c))

## 🎓 AI Tools Used

This project leverages AI-powered development tools for enhanced productivity:
- **Mermaid**: Diagram generation for architecture planning
- **ChatGPT/Claude**: Architecture planning and problem-solving
- **Cursor/Windsurf**: AI-assisted code editing
- **LangChain/LlamaIndex**: LLM orchestration frameworks
- **LangSmith**: LLM debugging and monitoring
- **GitHub Copilot**: AI-assisted code editing,suggestions, testing and documentation

---

**Built with ❤️ for Learning Yogi Technical Assessment by Saleem Ahmad **
