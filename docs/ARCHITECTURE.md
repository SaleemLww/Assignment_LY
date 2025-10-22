# System Architecture Diagrams

> **⚠️ LOCKED DOCUMENT - DO NOT MODIFY**  
> This architecture document is finalized. For progress tracking, update only `TODO.md`

This document contains comprehensive architecture and flow diagrams for the Teacher Timetable Extraction System.

## 1. High-Level System Architecture

```mermaid
architecture-beta
    group frontend(cloud)[Frontend Layer]
    group backend(cloud)[Backend Layer]
    group processing(cloud)[Processing Layer]
    group storage(cloud)[Data Layer]
    group external(cloud)[External Services]

    service web(server)[Next Js Web App] in frontend
    service api(server)[Express API] in backend
    service queue(server)[BullMQ Queue] in backend
    service worker(server)[Worker Service] in processing
    service ocr(server)[OCR Service] in processing
    service llm(server)[LLM Service] in processing
    service db(database)[PostgreSQL] in storage
    service redis(database)[Redis Cache] in storage
    service files(disk)[File Storage] in storage
    service openai(internet)[OpenAI API] in external
    service langsmith(internet)[LangSmith] in external

    web:R --> L:api
    api:R --> L:queue
    queue:R --> L:worker
    worker:B --> T:ocr
    worker:B --> T:llm
    ocr:R --> L:llm
    llm:R --> L:openai
    llm:R --> L:langsmith
    worker:B --> T:db
    worker:T --> B:redis
    api:B --> T:db
    api:T --> B:redis
    worker:T --> B:files
```

## 2. End-to-End Processing Sequence

```mermaid
sequenceDiagram
    actor Teacher
    participant Frontend
    participant API
    participant Queue
    participant FileStorage
    participant Worker
    participant OCR
    participant LLM
    participant Database
    
    Teacher->>Frontend: Upload timetable file
    Frontend->>API: POST /api/v1/timetables/upload
    API->>API: Validate file format & size
    API->>FileStorage: Store file temporarily
    API->>Database: Create timetable record (status: pending)
    API->>Queue: Add processing job
    API-->>Frontend: Return 202 Accepted + timetableId
    Frontend-->>Teacher: Show processing status
    
    Queue->>Worker: Dispatch job
    Worker->>Database: Update status to "processing"
    Worker->>FileStorage: Retrieve file
    
    alt Is Image File
        Worker->>OCR: Extract text from image
        OCR-->>Worker: Return extracted text
    else Is PDF
        Worker->>Worker: Extract text from PDF
    else Is DOCX
        Worker->>Worker: Extract text from DOCX
    end
    
    Worker->>Worker: Preprocess extracted text
    Worker->>LLM: Send text + extraction prompt
    LLM->>LLM: Parse timetable structure
    LLM-->>Worker: Return structured data + confidence
    
    Worker->>Worker: Validate extracted data
    Worker->>Database: Store timeblocks
    Worker->>Database: Update status to "completed"
    
    loop Status Polling
        Frontend->>API: GET /api/v1/timetables/:id/status
        API->>Database: Check status
        API-->>Frontend: Return status + progress
    end
    
    Frontend->>API: GET /api/v1/timetables/:id
    API->>Database: Retrieve timetable with timeblocks
    API-->>Frontend: Return complete data
    Frontend-->>Teacher: Display timetable
```

## 3. File Upload & Processing Flow

```mermaid
flowchart TD
    Start([Teacher Uploads File]) --> Validate{Valid File?}
    
    Validate -->|No| Error1[Return Error: Invalid Format]
    Error1 --> End1([End])
    
    Validate -->|Yes| CheckSize{Size < 10MB?}
    CheckSize -->|No| Error2[Return Error: File Too Large]
    Error2 --> End1
    
    CheckSize -->|Yes| Store[Store File Temporarily]
    Store --> CreateRecord[Create Database Record]
    CreateRecord --> AddToQueue[Add Job to Queue]
    AddToQueue --> Return202[Return 202 Accepted]
    Return202 --> End2([End: Async Processing])
    
    AddToQueue --> WorkerPick[Worker Picks Job]
    WorkerPick --> UpdateStatus1[Update Status: Processing]
    UpdateStatus1 --> DetectType{File Type?}
    
    DetectType -->|Image| ProcessImage[OCR Extraction]
    DetectType -->|PDF| ProcessPDF[PDF Text Extraction]
    DetectType -->|DOCX| ProcessDOCX[DOCX Text Extraction]
    
    ProcessImage --> CleanText[Clean & Normalize Text]
    ProcessPDF --> CleanText
    ProcessDOCX --> CleanText
    
    CleanText --> PreparePrompt[Prepare LLM Prompt]
    PreparePrompt --> CallLLM[Call LLM API]
    
    CallLLM --> ParseResponse{Valid Response?}
    ParseResponse -->|No| Retry{Retry Count < 3?}
    Retry -->|Yes| CallLLM
    Retry -->|No| Error3[Mark as Failed]
    Error3 --> End3([End: Failed])
    
    ParseResponse -->|Yes| ValidateData{Data Valid?}
    ValidateData -->|No| Error3
    ValidateData -->|Yes| CalculateConfidence[Calculate Confidence Score]
    
    CalculateConfidence --> StoreData[Store Timeblocks in DB]
    StoreData --> UpdateStatus2[Update Status: Completed]
    UpdateStatus2 --> CleanupFiles[Cleanup Temp Files]
    CleanupFiles --> End4([End: Success])
    
    style Start fill:#90EE90
    style End1 fill:#FFB6C1
    style End2 fill:#87CEEB
    style End3 fill:#FFB6C1
    style End4 fill:#90EE90
    style Error1 fill:#FF6B6B
    style Error2 fill:#FF6B6B
    style Error3 fill:#FF6B6B
```

## 4. LLM Integration Strategy

```mermaid
flowchart LR
    subgraph Input
        RawText[Extracted Text]
        Context[Context Metadata]
    end
    
    subgraph Preprocessing
        Clean[Text Cleaning]
        Normalize[Normalization]
        Segment[Segmentation]
    end
    
    subgraph Prompt Engineering
        SystemPrompt[System Prompt]
        FewShot[Few-Shot Examples]
        Schema[JSON Schema]
        Instructions[Extraction Instructions]
    end
    
    subgraph LLM Processing
        Construct[Construct Prompt]
        CallAPI[LLM API Call]
        Parse[Parse Response]
    end
    
    subgraph Validation
        CheckSchema{Schema Valid?}
        CheckData{Data Complete?}
        CheckConfidence{Confidence > 70%?}
    end
    
    subgraph Output
        StructuredData[Structured Timeblocks]
        ConfidenceScores[Confidence Scores]
        Metadata[Processing Metadata]
    end
    
    RawText --> Clean
    Context --> Normalize
    Clean --> Normalize
    Normalize --> Segment
    
    Segment --> Construct
    SystemPrompt --> Construct
    FewShot --> Construct
    Schema --> Construct
    Instructions --> Construct
    
    Construct --> CallAPI
    CallAPI --> Parse
    
    Parse --> CheckSchema
    CheckSchema -->|No| Retry[Retry with Modified Prompt]
    CheckSchema -->|Yes| CheckData
    CheckData -->|No| Retry
    CheckData -->|Yes| CheckConfidence
    CheckConfidence -->|No| FlagReview[Flag for Review]
    CheckConfidence -->|Yes| StructuredData
    
    Retry --> CallAPI
    FlagReview --> StructuredData
    
    StructuredData --> ConfidenceScores
    ConfidenceScores --> Metadata
    
    style Input fill:#E6F3FF
    style Output fill:#D4EDDA
    style Validation fill:#FFF3CD
    style LLM Processing fill:#F8D7DA
```

## 5. Database Schema (ER Diagram)

```mermaid
erDiagram
    TEACHERS ||--o{ TIMETABLES : "creates"
    TIMETABLES ||--|{ TIMEBLOCKS : "contains"
    TIMETABLES ||--o{ PROCESSING_LOGS : "has"
    
    TEACHERS {
        uuid id PK
        string email UK
        string name
        timestamp created_at
        timestamp updated_at
    }
    
    TIMETABLES {
        uuid id PK
        uuid teacher_id FK
        string title
        string academic_year
        string uploaded_file_path
        enum processing_status
        decimal confidence_score
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }
    
    TIMEBLOCKS {
        uuid id PK
        uuid timetable_id FK
        enum day_of_week
        time start_time
        time end_time
        integer duration_minutes
        string event_name
        string event_type
        text notes
        string color_code
        integer position_order
        decimal confidence_score
        timestamp created_at
        timestamp updated_at
    }
    
    PROCESSING_LOGS {
        uuid id PK
        uuid timetable_id FK
        string stage
        string status
        text error_message
        jsonb metadata
        timestamp created_at
    }
```

## 6. API Endpoint Flow

```mermaid
flowchart TD
    subgraph "Upload Endpoint"
        Upload[POST /timetables/upload]
        Upload --> ValidateReq{Valid Request?}
        ValidateReq -->|No| Return400[Return 400]
        ValidateReq -->|Yes| ProcessUpload[Process Upload]
        ProcessUpload --> Return202[Return 202 Accepted]
    end
    
    subgraph "Status Endpoint"
        Status[GET /timetables/:id/status]
        Status --> CheckExists{Exists?}
        CheckExists -->|No| Return404[Return 404]
        CheckExists -->|Yes| GetStatus[Get Status from DB]
        GetStatus --> Return200Status[Return 200 + Status]
    end
    
    subgraph "Retrieve Endpoint"
        Get[GET /timetables/:id]
        Get --> CheckExists2{Exists?}
        CheckExists2 -->|No| Return404_2[Return 404]
        CheckExists2 -->|Yes| CheckComplete{Processing Complete?}
        CheckComplete -->|No| Return202_2[Return 202 Processing]
        CheckComplete -->|Yes| GetData[Get Full Data]
        GetData --> Return200Data[Return 200 + Data]
    end
    
    subgraph "Update Endpoint"
        Update[PATCH /timetables/:id/blocks/:blockId]
        Update --> ValidateUpdate{Valid?}
        ValidateUpdate -->|No| Return422[Return 422]
        ValidateUpdate -->|Yes| UpdateBlock[Update Timeblock]
        UpdateBlock --> Return200Update[Return 200 + Updated]
    end
    
    subgraph "Delete Endpoint"
        Delete[DELETE /timetables/:id]
        Delete --> CheckExists3{Exists?}
        CheckExists3 -->|No| Return404_3[Return 404]
        CheckExists3 -->|Yes| DeleteData[Delete Timetable]
        DeleteData --> Return200Delete[Return 200]
    end
    
    style Upload fill:#E3F2FD
    style Status fill:#E8F5E9
    style Get fill:#FFF3E0
    style Update fill:#F3E5F5
    style Delete fill:#FFEBEE
```

## 7. Error Handling Strategy

```mermaid
flowchart TD
    Error[Error Occurs] --> Classify{Error Type?}
    
    Classify -->|Validation| ValidationError[Validation Error]
    Classify -->|File| FileError[File Error]
    Classify -->|OCR| OCRError[OCR Error]
    Classify -->|LLM| LLMError[LLM Error]
    Classify -->|Database| DBError[Database Error]
    Classify -->|Unknown| UnknownError[Unknown Error]
    
    ValidationError --> Log1[Log Error]
    FileError --> Log2[Log Error]
    OCRError --> RetryOCR{Retry Count < 3?}
    LLMError --> RetryLLM{Retry Count < 3?}
    DBError --> RetryDB{Retry Count < 3?}
    UnknownError --> Log6[Log Error]
    
    RetryOCR -->|Yes| RetryOCRAction[Retry OCR]
    RetryOCR -->|No| Fallback1[Use Cloud OCR]
    RetryLLM -->|Yes| RetryLLMAction[Retry with Modified Prompt]
    RetryLLM -->|No| Fallback2[Manual Review Queue]
    RetryDB -->|Yes| RetryDBAction[Retry DB Operation]
    RetryDB -->|No| Log5[Log Critical Error]
    
    Fallback1 --> Success1{Success?}
    Success1 -->|Yes| Continue1[Continue Processing]
    Success1 -->|No| Manual1[Manual Review]
    
    Fallback2 --> Manual2[Manual Review]
    
    Log1 --> Return1[Return 400 Bad Request]
    Log2 --> Return2[Return 422 Invalid File]
    Manual1 --> UpdateStatus1[Update Status: Needs Review]
    Manual2 --> UpdateStatus2[Update Status: Needs Review]
    Log5 --> Return3[Return 500 Internal Error]
    Log6 --> Return4[Return 500 Internal Error]
    
    style Error fill:#FF6B6B
    style ValidationError fill:#FFD93D
    style FileError fill:#FFD93D
    style OCRError fill:#FFA500
    style LLMError fill:#FFA500
    style DBError fill:#FF6347
    style UnknownError fill:#DC143C
    style Manual1 fill:#87CEEB
    style Manual2 fill:#87CEEB
```

## 8. Component Architecture

```mermaid
flowchart TB
    subgraph Frontend["Frontend (Next.js)"]
        Pages[Pages/Routes]
        Components[React Components]
        Hooks[Custom Hooks]
        Services[API Service Layer]
        Store[State Management]
        
        Pages --> Components
        Components --> Hooks
        Hooks --> Services
        Services --> Store
    end
    
    subgraph Backend["Backend (Express)"]
        Routes[API Routes]
        Controllers[Controllers]
        Middleware[Middleware]
        Services2[Business Services]
        Models[Data Models]
        
        Routes --> Middleware
        Middleware --> Controllers
        Controllers --> Services2
        Services2 --> Models
    end
    
    subgraph Processing["Processing Services"]
        FileService[File Service]
        OCRService[OCR Service]
        DocumentParser[Document Parser]
        LLMService[LLM Service]
        ValidationService[Validation Service]
        
        FileService --> DocumentParser
        DocumentParser --> OCRService
        OCRService --> LLMService
        LLMService --> ValidationService
    end
    
    subgraph Data["Data Layer"]
        PostgreSQL[(PostgreSQL)]
        Redis[(Redis)]
        FileStorage[(File Storage)]
    end
    
    Frontend -->|HTTP/REST| Backend
    Backend -->|Queue Jobs| Processing
    Processing -->|Read/Write| Data
    Backend -->|Read/Write| Data
    
    style Frontend fill:#E3F2FD
    style Backend fill:#E8F5E9
    style Processing fill:#FFF3E0
    style Data fill:#F3E5F5
```

## 9. Frontend Component Hierarchy

```mermaid
flowchart TD
    App[App Root] --> Layout[Layout Component]
    
    Layout --> Header[Header]
    Layout --> Main[Main Content]
    Layout --> Footer[Footer]
    
    Main --> UploadPage[Upload Page]
    Main --> ViewPage[View/Edit Page]
    Main --> ListPage[List Page]
    
    UploadPage --> UploadZone[File Upload Zone]
    UploadPage --> UploadForm[Upload Form]
    UploadZone --> DragDrop[Drag & Drop]
    UploadForm --> FormFields[Form Fields]
    
    ViewPage --> StatusBar[Status Bar]
    ViewPage --> TimetableGrid[Timetable Grid]
    ViewPage --> EditModal[Edit Modal]
    ViewPage --> ExportMenu[Export Menu]
    
    TimetableGrid --> TimeBlock[Time Block Component]
    TimetableGrid --> DayColumn[Day Column]
    TimetableGrid --> TimeAxis[Time Axis]
    
    TimeBlock --> EventCard[Event Card]
    EventCard --> EventName[Event Name]
    EventCard --> TimeRange[Time Range]
    EventCard --> Notes[Notes]
    
    ListPage --> TimetableCard[Timetable Card]
    ListPage --> Pagination[Pagination]
    ListPage --> Filters[Filters]
    
    style App fill:#E3F2FD
    style Layout fill:#E8F5E9
    style UploadPage fill:#FFF3E0
    style ViewPage fill:#F3E5F5
    style ListPage fill:#FCE4EC
```

## 10. Deployment Architecture

```mermaid
flowchart TB
    subgraph "Client Layer"
        Browser[Web Browser]
        Mobile[Mobile Browser]
    end
    
    subgraph "CDN/Edge"
        CDN[Content Delivery Network]
        Static[Static Assets]
    end
    
    subgraph "Load Balancer"
        LB[Load Balancer]
    end
    
    subgraph "Application Servers"
        API1[API Server 1]
        API2[API Server 2]
        API3[API Server N]
    end
    
    subgraph "Worker Servers"
        Worker1[Worker 1]
        Worker2[Worker 2]
        Worker3[Worker N]
    end
    
    subgraph "Data Services"
        DB[(PostgreSQL Primary)]
        DBReplica[(PostgreSQL Replica)]
        RedisCluster[(Redis Cluster)]
        S3[(S3 Storage)]
    end
    
    subgraph "External Services"
        OpenAI[OpenAI API]
        LangSmith[LangSmith]
        Monitoring[Monitoring Service]
    end
    
    Browser --> CDN
    Mobile --> CDN
    CDN --> Static
    CDN --> LB
    
    LB --> API1
    LB --> API2
    LB --> API3
    
    API1 --> DB
    API2 --> DB
    API3 --> DB
    
    API1 --> RedisCluster
    API2 --> RedisCluster
    API3 --> RedisCluster
    
    DB --> DBReplica
    
    RedisCluster --> Worker1
    RedisCluster --> Worker2
    RedisCluster --> Worker3
    
    Worker1 --> S3
    Worker2 --> S3
    Worker3 --> S3
    
    Worker1 --> OpenAI
    Worker2 --> OpenAI
    Worker3 --> OpenAI
    
    Worker1 --> LangSmith
    Worker2 --> LangSmith
    Worker3 --> LangSmith
    
    API1 --> Monitoring
    Worker1 --> Monitoring
    
    style Browser fill:#E3F2FD
    style CDN fill:#E8F5E9
    style LB fill:#FFF3E0
    style DB fill:#F3E5F5
    style OpenAI fill:#FFE0B2
```

## 11. Security Architecture

```mermaid
flowchart TB
    Request[Incoming Request] --> WAF{Web Application Firewall}
    WAF -->|Blocked| Block[Return 403]
    WAF -->|Allowed| RateLimit{Rate Limiter}
    
    RateLimit -->|Exceeded| Throttle[Return 429]
    RateLimit -->|OK| Auth{Authentication}
    
    Auth -->|Invalid| Unauthorized[Return 401]
    Auth -->|Valid| CORS{CORS Check}
    
    CORS -->|Failed| CORSError[Return 403]
    CORS -->|Passed| Input{Input Validation}
    
    Input -->|Invalid| BadRequest[Return 400]
    Input -->|Valid| FileCheck{File Validation}
    
    FileCheck -->|Virus| VirusError[Return 422]
    FileCheck -->|Invalid Type| TypeError[Return 422]
    FileCheck -->|Too Large| SizeError[Return 413]
    FileCheck -->|Valid| Sanitize[Sanitize Input]
    
    Sanitize --> Process[Process Request]
    Process --> Encrypt{Sensitive Data?}
    
    Encrypt -->|Yes| EncryptData[Encrypt]
    Encrypt -->|No| Store[Store]
    EncryptData --> Store
    
    Store --> Audit[Audit Log]
    Audit --> Response[Send Response]
    
    style Request fill:#E3F2FD
    style WAF fill:#FFE0B2
    style Auth fill:#F8BBD0
    style FileCheck fill:#FFF9C4
    style Encrypt fill:#C5E1A5
    style Response fill:#B2DFDB
```

---

## Diagram Legends

### Architecture Diagram Icons
- **Cloud**: Logical grouping/layer
- **Server**: Application services
- **Database**: Data storage
- **Disk**: File storage
- **Internet**: External APIs

### Flowchart Shapes
- **Rounded Rectangle**: Process/Action
- **Diamond**: Decision point
- **Parallelogram**: Input/Output
- **Circle**: Start/End point

### Sequence Diagram
- **Actor**: External user
- **Participant**: System component
- **Solid Arrow**: Synchronous call
- **Dashed Arrow**: Response/Async
- **Note**: Additional information

### Color Coding
- **Green (#90EE90, #D4EDDA, #E8F5E9)**: Success/Completion
- **Blue (#87CEEB, #E3F2FD)**: Information/Process
- **Yellow (#FFF3CD, #FFD93D)**: Warning/Validation
- **Red (#FFB6C1, #FF6B6B)**: Error/Failure
- **Orange (#FFA500, #FFE0B2)**: External/LLM
- **Purple (#F3E5F5)**: Storage/Data

---

## Notes

1. All diagrams use Mermaid syntax for version control and easy updates
2. Diagrams are designed to be rendered in markdown viewers and documentation tools
3. Each diagram focuses on a specific aspect of the system architecture
4. Color coding is consistent across all diagrams for easy understanding
5. Diagrams can be exported to PDF, PNG, or SVG for presentations
