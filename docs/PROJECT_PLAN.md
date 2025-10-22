# Teacher Timetable Extraction System - Project Plan

> **⚠️ LOCKED DOCUMENT - DO NOT MODIFY**  
> This project plan is finalized. For progress tracking, update only `TODO.md`

## 📅 Timeline: 48 Hours

- Assessment Received: October 22, 2025
- Start Time: October 22, 2025, 03:00 PM


---

## 🎯 Project Goals

1. Design comprehensive system architecture
2. Build functional backend prototype
3. Demonstrate LLM integration strategy
4. Create clear documentation
5. Show effective use of AI development tools

---

## 📊 Phase Breakdown

### Phase 0: Planning & Design
**Status**: ✅ CURRENT PHASE

#### Tasks
- [x] Read and analyze requirements PDF
- [x] Review example timetable images
- [x] Create comprehensive requirements document
- [x] Create README with setup instructions
- [ ] Design system architecture
- [ ] Create architecture diagrams
- [ ] Design database schema
- [ ] Plan API endpoints
- [ ] Define LLM integration strategy
- [ ] Create project structure

**Deliverables**:
- REQUIREMENTS.md
- README.md
- PROJECT_PLAN.md (this document)
- Architecture diagrams (Mermaid)
- Database schema design
- API specification

---

### Phase 1: Backend Foundation 

#### 1.1 Project Setup
- [ ] Initialize Node.js/TypeScript project
- [ ] Setup Express.js server
- [ ] Configure ESLint, Prettier, Husky
- [ ] Setup environment variables
- [ ] Create folder structure
- [ ] Initialize Git repository
- [ ] Setup Docker configuration

#### 1.2 Database Setup
- [ ] Install PostgreSQL
- [ ] Setup Prisma/TypeORM
- [ ] Create database schema
- [ ] Write migrations
- [ ] Seed sample data
- [ ] Test database connection

#### 1.3 Redis & Queue Setup
- [ ] Install Redis
- [ ] Setup BullMQ
- [ ] Configure job queues
- [ ] Create queue workers
- [ ] Test queue functionality

**Deliverables**:
- Working Express server
- Database with schema
- Queue system configured
- Basic error handling

**Git Commits**:
- `chore: initialize Node.js project with TypeScript`
- `chore: setup Express server and middleware`
- `feat: configure database with Prisma`
- `feat: setup Redis and BullMQ job queue`

---

### Phase 2: File Upload & Storage 

#### 2.1 File Upload Endpoint
- [ ] Install Multer
- [ ] Create upload middleware
- [ ] Implement file validation
- [ ] Setup temporary storage
- [ ] Add file size limits
- [ ] Create upload endpoint
- [ ] Add error handling

#### 2.2 File Type Handling
- [ ] PDF processing setup (pdf-parse)
- [ ] DOCX processing setup (mammoth)
- [ ] Image validation
- [ ] File type detection
- [ ] Sanitization and security

**Deliverables**:
- POST /api/v1/timetables/upload endpoint
- File validation and security
- Temporary file storage

**Git Commits**:
- `feat: implement file upload endpoint with Multer`
- `feat: add file validation and type detection`
- `chore: configure temporary file storage`

---

### Phase 3: Document Processing 

#### 3.1 OCR Implementation
- [ ] Setup Tesseract.js
- [ ] Create OCR service
- [ ] Image preprocessing
- [ ] Text extraction from images
- [ ] Handle scanned PDFs
- [ ] Error handling for poor quality

#### 3.2 Document Parsing
- [ ] PDF text extraction
- [ ] DOCX text extraction
- [ ] Table structure detection
- [ ] Layout analysis
- [ ] Text cleaning and normalization

#### 3.3 Data Structuring
- [ ] Identify time patterns
- [ ] Extract day information
- [ ] Parse time formats
- [ ] Identify event names
- [ ] Extract duration info

**Deliverables**:
- OCR service functional
- Document parsing services
- Structured text extraction

**Git Commits**:
- `feat: implement OCR service with Tesseract`
- `feat: add PDF and DOCX text extraction`
- `feat: create text parsing and structuring logic`

---

### Phase 4: LLM Integration 

#### 4.1 LangChain Setup
- [ ] Install LangChain
- [ ] Configure OpenAI/Claude API
- [ ] Setup LangSmith monitoring
- [ ] Create LLM service wrapper
- [ ] Implement retry logic
- [ ] Add rate limiting

#### 4.2 Prompt Engineering
- [ ] Design system prompts
- [ ] Create extraction prompts
- [ ] Design JSON output schema
- [ ] Add few-shot examples
- [ ] Test prompt variations
- [ ] Optimize for accuracy

#### 4.3 Extraction Pipeline
- [ ] Create LLM extraction service
- [ ] Implement structured output parsing
- [ ] Add confidence scoring
- [ ] Validate extracted data
- [ ] Handle ambiguous cases
- [ ] Create fallback strategies

#### 4.4 LlamaIndex Integration
- [ ] Setup LlamaIndex
- [ ] Create document loaders
- [ ] Implement indexing
- [ ] Query optimization
- [ ] Response synthesis

**Deliverables**:
- LLM service integrated
- Extraction pipeline working
- Confidence scoring implemented
- Error handling robust

**Git Commits**:
- `feat: integrate LangChain and OpenAI API`
- `feat: implement prompt templates for extraction`
- `feat: create LLM extraction service`
- `feat: add confidence scoring and validation`
- `chore: setup LangSmith monitoring`

---

### Phase 5: API Development 

#### 5.1 Core Endpoints
- [ ] GET /timetables/:id
- [ ] GET /timetables/:id/status
- [ ] GET /timetables (list)
- [ ] PATCH /timetables/:id/blocks/:blockId
- [ ] DELETE /timetables/:id
- [ ] Error responses standardization

#### 5.2 Async Processing
- [ ] Job creation on upload
- [ ] Background processing
- [ ] Status updates
- [ ] Progress tracking
- [ ] Webhook notifications

#### 5.3 API Documentation
- [ ] Install Swagger/OpenAPI
- [ ] Document all endpoints
- [ ] Add request/response examples
- [ ] Create Postman collection
- [ ] Write API usage guide

**Deliverables**:
- Complete REST API
- Async processing working
- Swagger documentation

**Git Commits**:
- `feat: implement timetable retrieval endpoints`
- `feat: add status checking endpoint`
- `feat: implement update and delete endpoints`
- `docs: add Swagger API documentation`

---

### Phase 6: Testing & Validation 

#### 6.1 Unit Tests
- [ ] Test file upload service
- [ ] Test OCR service
- [ ] Test document parsing
- [ ] Test LLM extraction
- [ ] Test database operations
- [ ] Achieve 70%+ coverage

#### 6.2 Integration Tests
- [ ] Test complete upload flow
- [ ] Test processing pipeline
- [ ] Test API endpoints
- [ ] Test error scenarios
- [ ] Test edge cases

#### 6.3 Manual Testing
- [ ] Test with provided examples
- [ ] Test with various formats
- [ ] Test error handling
- [ ] Test performance
- [ ] Document test results

**Deliverables**:
- Test suite with good coverage
- Test results documented
- Bug fixes completed

**Git Commits**:
- `test: add unit tests for core services`
- `test: add integration tests for API`
- `fix: resolve bugs found in testing`

---

### Phase 7: Frontend Strategy 

#### 7.1 Architecture Document
- [ ] Recommend tech stack
- [ ] Design component structure
- [ ] Plan state management
- [ ] Design UI/UX flow
- [ ] Create wireframes

#### 7.2 Component Planning
- [ ] Timetable display component
- [ ] Upload component
- [ ] Status/progress component
- [ ] Edit mode component
- [ ] Export functionality

#### 7.3 Implementation Notes
- [ ] Responsive design strategy
- [ ] Accessibility considerations
- [ ] Performance optimization
- [ ] Error handling UI

**Deliverables**:
- Frontend strategy document
- Component specifications
- UI/UX recommendations

**Git Commits**:
- `docs: add frontend architecture strategy`
- `docs: create component specifications`

---

### Phase 8: Documentation & Polish 

#### 8.1 Code Documentation
- [ ] Add inline code comments
- [ ] Update README
- [ ] Write setup guide
- [ ] Document known issues
- [ ] Create troubleshooting guide

#### 8.2 Architecture Documentation
- [ ] Finalize architecture diagrams
- [ ] Document LLM strategy
- [ ] Explain design decisions
- [ ] Document error handling
- [ ] Create deployment guide

#### 8.3 Code Quality
- [ ] Run linter and fix issues
- [ ] Format code consistently
- [ ] Remove console.logs
- [ ] Clean up commented code
- [ ] Optimize imports

**Deliverables**:
- Complete documentation
- Clean, well-commented code
- Professional Git history

**Git Commits**:
- `docs: update comprehensive documentation`
- `refactor: clean up code and improve structure`
- `chore: final polish and optimization`

---

### Phase 9: Final Submission 

#### 9.1 Handover Documentation
- [ ] Script key points
- [ ] Demonstrate functionality
- [ ] Explain architecture
- [ ] Show AI tool usage
- [ ] Discuss decisions made


#### 9.2 Final Review
- [ ] Test complete workflow
- [ ] Review all documentation
- [ ] Check Git commit history
- [ ] Verify all deliverables
- [ ] Create submission checklist

#### 9.3 Submission Package
- [ ] Push final code to repository
- [ ] Export architecture PDF
- [ ] Share Loom video link if any
- [ ] Submit all materials
- [ ] Confirm submission received

**Deliverables**:
- Final repository
- Architecture PDF
- Complete submission
- Handover video if any

**Git Commits**:
- `docs: add handover video link`
- `chore: final submission preparation`

---

## 📋 Comprehensive Task Checklist

### Planning & Documentation
- [x] Requirements analysis
- [x] Requirements document (REQUIREMENTS.md)
- [x] README.md creation
- [x] Project plan (PROJECT_PLAN.md)
- [x] System architecture diagram
- [x] Sequence diagrams
- [x] Database schema diagram
- [x] API flow diagram
- [x] Error handling flowchart
- [x] Frontend component diagram

### Backend Core
- [ ] Node.js/TypeScript project setup
- [ ] Express.js server configuration
- [ ] Environment variables setup
- [ ] Logging system (Winston)
- [ ] Error handling middleware
- [ ] CORS configuration
- [ ] Rate limiting
- [ ] Request validation

### Database & Storage
- [ ] PostgreSQL setup
- [ ] Database schema design
- [ ] Prisma/TypeORM configuration
- [ ] Migrations creation
- [ ] Seed data scripts
- [ ] Redis setup
- [ ] File storage setup
- [ ] Backup strategy

### File Processing
- [ ] File upload endpoint
- [ ] File validation
- [ ] PDF processing
- [ ] DOCX processing
- [ ] Image processing
- [ ] OCR implementation
- [ ] Text extraction
- [ ] Table detection

### LLM Integration
- [ ] LangChain setup
- [ ] OpenAI/Claude API integration
- [ ] Prompt engineering
- [ ] Extraction pipeline
- [ ] Confidence scoring
- [ ] LlamaIndex integration
- [ ] LangSmith monitoring
- [ ] Error handling & retries

### API Development
- [ ] POST /timetables/upload
- [ ] GET /timetables/:id/status
- [ ] GET /timetables/:id
- [ ] GET /timetables (list)
- [ ] PATCH /timetables/:id/blocks/:blockId
- [ ] DELETE /timetables/:id
- [ ] Swagger documentation
- [ ] API testing

### Queue & Async Processing
- [ ] BullMQ setup
- [ ] Job queue creation
- [ ] Worker implementation
- [ ] Status tracking
- [ ] Progress updates
- [ ] Job retries
- [ ] Dead letter queue

### Testing
- [ ] Jest configuration
- [ ] Unit tests (services)
- [ ] Integration tests (API)
- [ ] E2E test scenarios
- [ ] Test coverage reporting
- [ ] Manual testing
- [ ] Performance testing

### Frontend Strategy
- [ ] Technology recommendations
- [ ] Component architecture
- [ ] State management strategy
- [ ] UI/UX design notes
- [ ] Responsive design plan
- [ ] Accessibility considerations

### DevOps
- [ ] Docker configuration
- [ ] Docker Compose setup
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Code quality checks
- [ ] Automated testing
- [ ] Deployment guide

### Documentation
- [ ] Code comments
- [ ] API documentation
- [ ] Setup instructions
- [ ] Deployment guide
- [ ] Troubleshooting guide
- [ ] Architecture explanation
- [ ] LLM strategy document
- [ ] Known issues & limitations
- [ ] Future enhancements

### Submission
- [ ] Git repository cleanup
- [ ] Commit history review
- [ ] Architecture PDF export
- [ ] Handover video recording
- [ ] Final testing
- [ ] Submission package
- [ ] Submit to Learning Yogi

---

## 🎨 Architecture Diagrams to Create

### 1. High-Level System Architecture
- Components: Frontend, Backend API, Queue, Database, LLM Services
- Data flow between components
- External dependencies

### 2. End-to-End Processing Flow
- File upload → Validation → Storage
- Queue job creation → Processing
- OCR/Parsing → LLM Extraction
- Data storage → Response

### 3. Sequence Diagram: File Upload & Processing
- User uploads file
- Backend validation
- Async job creation
- Status polling
- Data retrieval

### 4. Database Schema Diagram
- Teachers table
- Timetables table
- TimeBlocks table
- ProcessingLogs table
- Relationships and constraints

### 5. LLM Integration Flow
- Document preprocessing
- Prompt construction
- LLM API call
- Response parsing
- Validation & scoring

### 6. Error Handling Strategy
- Validation errors
- Processing failures
- LLM errors
- Fallback mechanisms

### 7. Frontend Component Hierarchy
- Upload component
- Status/Progress component
- Timetable grid component
- Edit modal component

---

## 🚀 Technology Stack Summary

### Backend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Runtime | Node.js 18+ | Server runtime |
| Language | TypeScript | Type safety |
| Framework | Express.js | Web framework |
| Database | PostgreSQL 15+ | Data persistence |
| Cache/Queue | Redis + BullMQ | Async processing |
| ORM | Prisma | Database access |
| File Upload | Multer | File handling |
| PDF | pdf-parse, pdfjs-dist | PDF processing |
| DOCX | mammoth | Word processing |
| OCR | Tesseract.js | Image-to-text |
| LLM Orchestration | LangChain | LLM workflow |
| Document Processing | LlamaIndex | Document indexing |
| LLM API | OpenAI GPT-4 / Claude | AI extraction |
| Monitoring | LangSmith | LLM tracing |
| Testing | Jest | Unit/integration tests |
| API Docs | Swagger/OpenAPI | Documentation |

### Frontend (Strategy)
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | React 18+ | UI library |
| Meta Framework | Next.js 14+ | SSR/SSG |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS | Utility-first CSS |
| Components | shadcn/ui | UI components |
| State | React Query + Zustand | Data & state |
| Forms | React Hook Form + Zod | Form handling |
| Calendar | FullCalendar | Timetable display |

### DevOps
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Containers | Docker | Containerization |
| Orchestration | Docker Compose | Local development |
| CI/CD | GitHub Actions | Automation |
| Code Quality | ESLint, Prettier | Code standards |
| Git Hooks | Husky | Pre-commit checks |

---

## 🎯 Success Metrics

### Technical
- [ ] All API endpoints functional
- [ ] 70%+ test coverage
- [ ] Process files in <30 seconds
- [ ] 90%+ extraction accuracy (digital docs)
- [ ] 85%+ extraction accuracy (scanned docs)
- [ ] Handle 4+ different timetable formats

### Documentation
- [ ] Clear setup instructions
- [ ] Complete API documentation
- [ ] Architecture diagrams present
- [ ] LLM strategy explained
- [ ] Error handling documented

### Code Quality
- [ ] Clean commit history
- [ ] Consistent code style
- [ ] Well-commented code
- [ ] No console.logs in production
- [ ] Proper error handling

### Submission
- [ ] Git repository submitted
- [ ] Architecture PDF included
- [ ] Handover video completed
- [ ] All deliverables present
- [ ] On-time submission

---

## 🎓 AI Tools Usage Plan

### GitHub Copilot
- Code completion for boilerplate
- Test case generation
- Documentation writing
- Refactoring suggestions

### ChatGPT/Claude
- Architecture planning
- Problem-solving
- Prompt engineering
- Code review
- Documentation review

### Cursor/Windsurf
- Multi-file editing
- Codebase navigation
- Refactoring assistance
- Bug fixing

### LangChain/LlamaIndex
- LLM orchestration
- Document processing
- Prompt management
- Response parsing

### LangSmith
- LLM tracing
- Debugging LLM calls
- Performance monitoring
- Prompt optimization

---

## ⚠️ Risk Management

### High Priority Risks

1. **OCR Accuracy for Handwritten Docs**
   - Mitigation: Use cloud OCR (Google Vision) for better accuracy
   - Fallback: Manual correction interface

2. **LLM API Rate Limits**
   - Mitigation: Implement caching, batch processing
   - Fallback: Queue system with retry logic

3. **Time Constraint (48 hours)**
   - Mitigation: Focus on core features, skip nice-to-haves
   - Prioritize working prototype over perfect code

### Medium Priority Risks

4. **Varied Timetable Formats**
   - Mitigation: Design flexible LLM prompts
   - Use LlamaIndex for robust document handling

5. **Database Schema Changes**
   - Mitigation: Use JSONB for flexible metadata
   - Version migrations properly

---

## 📝 Daily Schedule

### Day 1 (October 22, 2025)
- **Hours 0-6**: Planning, architecture, diagrams
- **Hours 6-12**: Backend foundation setup
- **Hours 12-18**: File upload and storage
- **Hours 18-24**: Document processing (OCR)

### Day 2 (October 23, 2025)
- **Hours 24-30**: LLM integration
- **Hours 30-36**: API development
- **Hours 36-42**: Testing & frontend strategy
- **Hours 42-48**: Documentation, video, submission

---

## 🎬 Next Steps

1. **Immediate**: Create architecture diagrams (Mermaid)
2. **Then**: Design database schema
3. **Then**: Initialize backend project
4. **Then**: Implement file upload endpoint
5. **Continue**: Follow phase plan above

---

## 📞 Progress Tracking

### Commit Frequency Target
- Minimum 20 meaningful commits
- After each feature/component
- After each documentation update
- After each bug fix

### Documentation Updates
- Update this plan as progress is made
- Mark tasks as completed ✅
- Note any deviations or blockers
- Track actual time vs estimated

---

**Last Updated**: October 22, 2025
**Status**: Phase 0 - Planning & Design
**Next Milestone**: Architecture Diagrams Completion
