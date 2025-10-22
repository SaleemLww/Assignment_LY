# Teacher Timetable Extraction System - Requirements Document

## Project Overview
An online platform for teachers to upload their weekly class timetables in various formats (images, PDFs, Word documents) and have the system automatically extract, parse, and display the timetable data in a standardized UI.

## Functional Requirements

### FR1: File Upload & Ingestion
- **FR1.1**: System shall accept multiple file formats:
  - Image files (PNG, JPEG, JPG, GIF)
  - PDF documents
  - Word documents (DOCX, DOC)
- **FR1.2**: Maximum file size limit: 10MB
- **FR1.3**: File validation before processing
- **FR1.4**: Support for both scanned and digitally created documents
- **FR1.5**: Handle various visual formats (color-coded, handwritten, typed)

### FR2: Timetable Data Extraction
- **FR2.1**: Extract all timeblock events (e.g., "Registration", "Maths", "Play", "Snack Time")
- **FR2.2**: Detect start and end times accurately
- **FR2.3**: Calculate or extract duration information
- **FR2.4**: Preserve original event names
- **FR2.5**: Capture additional notes or comments
- **FR2.6**: Identify day-wise organization (Monday-Friday)
- **FR2.7**: Handle various time formats (12h/24h, AM/PM)

### FR3: Document Processing
- **FR3.1**: OCR capability for scanned documents
- **FR3.2**: Text extraction from digital documents
- **FR3.3**: Table structure recognition
- **FR3.4**: Handle rotated or skewed images
- **FR3.5**: Multi-language support (primarily English)

### FR4: LLM Integration
- **FR4.1**: Use LLM for structured data extraction
- **FR4.2**: Normalize extracted data into standard format
- **FR4.3**: Handle ambiguous or incomplete data
- **FR4.4**: Validate extracted information
- **FR4.5**: Provide confidence scores for extracted data

### FR5: Backend API
- **FR5.1**: RESTful API endpoint for file upload
- **FR5.2**: Asynchronous processing support
- **FR5.3**: Status checking endpoint
- **FR5.4**: Retrieve processed timetable data
- **FR5.5**: Error reporting and validation feedback

### FR6: Data Storage
- **FR6.1**: Store uploaded files temporarily
- **FR6.2**: Persist extracted timetable data
- **FR6.3**: Store user information (teachers)
- **FR6.4**: Maintain processing history
- **FR6.5**: Support for multiple timetables per teacher

### FR7: Frontend Display
- **FR7.1**: Display timetable in grid/table format
- **FR7.2**: Color-coded visualization
- **FR7.3**: Responsive design (mobile, tablet, desktop)
- **FR7.4**: Edit capabilities for extracted data
- **FR7.5**: Export functionality (PDF, Excel, iCal)
- **FR7.6**: Print-friendly view

## Non-Functional Requirements

### NFR1: Performance
- **NFR1.1**: File processing time < 30 seconds for typical documents
- **NFR1.2**: API response time < 200ms (excluding processing)
- **NFR1.3**: Support concurrent uploads (min 10 simultaneous users)
- **NFR1.4**: Frontend load time < 3 seconds

### NFR2: Scalability
- **NFR2.1**: Horizontal scaling capability
- **NFR2.2**: Queue-based processing for handling load spikes
- **NFR2.3**: Microservices architecture for independent scaling

### NFR3: Reliability
- **NFR3.1**: 99.5% uptime SLA
- **NFR3.2**: Automated retry mechanism for failed processing
- **NFR3.3**: Data backup and recovery
- **NFR3.4**: Graceful degradation

### NFR4: Security
- **NFR4.1**: Secure file upload (virus scanning)
- **NFR4.2**: Authentication and authorization
- **NFR4.3**: Data encryption at rest and in transit
- **NFR4.4**: API rate limiting
- **NFR4.5**: GDPR compliance for data storage

### NFR5: Maintainability
- **NFR5.1**: Clean code architecture
- **NFR5.2**: Comprehensive documentation
- **NFR5.3**: Unit and integration tests (80% coverage)
- **NFR5.4**: Logging and monitoring
- **NFR5.5**: CI/CD pipeline

### NFR6: Accuracy
- **NFR6.1**: 95% accuracy for digital documents
- **NFR6.2**: 85% accuracy for scanned documents
- **NFR6.3**: Confidence scoring for all extractions
- **NFR6.4**: Human review workflow for low-confidence results

### NFR7: Usability
- **NFR7.1**: Intuitive user interface
- **NFR7.2**: Clear error messages
- **NFR7.3**: Progress indicators during processing
- **NFR7.4**: Help documentation and tooltips

## Technical Requirements

### TR1: Technology Stack

#### Backend
- **TR1.1**: Node.js (v18+) with Express.js
- **TR1.2**: TypeScript for type safety
- **TR1.3**: PostgreSQL for data persistence
- **TR1.4**: Redis for caching and queue management
- **TR1.5**: Bull/BullMQ for job queue

#### Frontend
- **TR1.6**: React 18+ with TypeScript
- **TR1.7**: Next.js for SSR/SSG
- **TR1.8**: Tailwind CSS for styling
- **TR1.9**: React Query for state management

#### AI/ML
- **TR1.10**: OpenAI GPT-4 or Claude API
- **TR1.11**: LangChain for LLM orchestration
- **TR1.12**: LlamaIndex for document processing
- **TR1.13**: LangSmith for LLM monitoring
- **TR1.14**: Tesseract.js or Cloud Vision API for OCR

### TR2: Integration Requirements
- **TR2.1**: RESTful API design
- **TR2.2**: Webhook support for async notifications
- **TR2.3**: OpenAPI/Swagger documentation
- **TR2.4**: CORS configuration

### TR3: Development Tools
- **TR3.1**: Git for version control
- **TR3.2**: ESLint and Prettier for code quality
- **TR3.3**: Jest for testing
- **TR3.4**: Docker for containerization
- **TR3.5**: GitHub Actions for CI/CD

## Data Requirements

### DR1: Database Schema

#### Teachers Table
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- name (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### Timetables Table
- id (UUID, PK)
- teacher_id (UUID, FK)
- title (VARCHAR)
- academic_year (VARCHAR)
- uploaded_file_path (VARCHAR)
- processing_status (ENUM: pending, processing, completed, failed)
- confidence_score (DECIMAL)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### TimeBlocks Table
- id (UUID, PK)
- timetable_id (UUID, FK)
- day_of_week (ENUM: Monday-Sunday)
- start_time (TIME)
- end_time (TIME)
- duration_minutes (INTEGER)
- event_name (VARCHAR)
- event_type (VARCHAR)
- notes (TEXT)
- color_code (VARCHAR)
- position_order (INTEGER)
- confidence_score (DECIMAL)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### ProcessingLogs Table
- id (UUID, PK)
- timetable_id (UUID, FK)
- stage (VARCHAR)
- status (VARCHAR)
- error_message (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMP)

## Constraints & Assumptions

### Assumptions
1. Teachers will upload timetables in English
2. Timetables follow a weekly pattern (Monday-Friday)
3. Time blocks are within school hours (7:00 AM - 6:00 PM)
4. Users have stable internet connection for uploads
5. PDF files are not password-protected

### Constraints
1. Must complete within 48-hour assessment timeframe
2. Use existing AI tools and APIs (no custom ML models)
3. Focus on backend implementation with frontend strategy
4. Work within free tier limits of cloud services

## Out of Scope (for Initial Version)
1. Multi-week or term-long timetable support
2. Collaborative editing features
3. Mobile native apps
4. Integration with school management systems
5. Automated conflict detection
6. Recurring event patterns
7. Multi-timezone support
8. Advanced analytics and reporting

## Success Criteria
1. Successfully parse at least 4 different timetable formats
2. Extract time blocks with 90%+ accuracy
3. Complete processing within 30 seconds
4. Provide clear API documentation
5. Demonstrate error handling for edge cases
6. Show clear architectural thinking
7. Demonstrate effective use of AI tools

## Risk Assessment

### High Risk
- **R1**: OCR accuracy for handwritten timetables
- **R2**: Variability in timetable formats
- **R3**: LLM API rate limits or costs

### Medium Risk
- **R4**: Processing time for large PDF files
- **R5**: Database schema flexibility for varied formats

### Low Risk
- **R6**: File upload implementation
- **R7**: Frontend display component

## Mitigation Strategies
- **R1/R2**: Use LLM for robust parsing with fallback strategies
- **R3**: Implement caching and batch processing
- **R4**: Async processing with progress indicators
- **R5**: Use JSONB for flexible metadata storage
