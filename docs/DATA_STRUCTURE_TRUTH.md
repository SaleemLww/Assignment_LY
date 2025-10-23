# Actual Data Structure - Database Verification Results

## 🎯 Executive Summary

**Critical Finding**: The LLM **DOES extract** semantic metadata like `academicYear` and `semester`, but this data is **DISCARDED** during database storage due to schema limitations.

## ✅ What We Verified (Database Query Results)

Using actual Prisma query on production database:

### Timetable Record (Actual Schema)
```json
{
  "id": "6b69e01e-cf3e-4f72-8538-0d625bff3780",
  "processingStatus": "COMPLETED",
  "uploadedAt": "2025-10-23T07:41:08.829Z",
  "originalFileName": "Teacher Timetable Example 1.1.png",
  "fileType": "image/png",
  "fileSize": 1308685,
  "filePath": "uploads/Teacher Timetable Example 1.1-1761205268820-333566259.png",
  "extractionMethod": null,
  "errorMessage": null
}
```

### Teacher Record
```json
{
  "id": "b261b76a-9bf7-4569-afd5-4f674267afcf",
  "name": "aa",
  "email": null
}
```

### Time Block Sample
```json
{
  "id": "aa43b688-1936-4120-b063-b26d82098198",
  "timetableId": "6b69e01e-cf3e-4f72-8538-0d625bff3780",
  "dayOfWeek": "MONDAY",
  "startTime": "08:35",
  "endTime": "08:50",
  "subject": "Registration and Early Morning work",
  "classroom": "",
  "grade": "",
  "section": "",
  "notes": "",
  "confidence": 71,
  "createdAt": "2025-10-23T07:42:06.656Z",
  "updatedAt": "2025-10-23T07:42:06.656Z"
}
```

**Statistics from Production DB**:
- Total Time Blocks: 48
- Total Timetables: 9
- All processing completed successfully

## 🔍 The Truth About Data Flow

### Stage 1: LLM Extraction (What Gets Extracted)

**File**: `backend/src/services/llm.service.ts` (lines 22-25)

```typescript
const TimetableSchema = z.object({
  teacherName: z.string().describe('Name of the teacher'),
  timeBlocks: z.array(TimeBlockSchema).describe('Array of timetable entries'),
  academicYear: z.string().describe('Academic year, e.g., "2024-2025"'),
  semester: z.string().describe('Semester or term'),
});
```

**✅ LLM DOES Extract**:
- ✅ teacherName
- ✅ timeBlocks[]
- ✅ **academicYear** ← EXTRACTED BUT NOT STORED
- ✅ **semester** ← EXTRACTED BUT NOT STORED

### Stage 2: Database Storage (What Gets Saved)

**File**: `backend/src/services/database.service.ts` (lines 132-148)

```typescript
const createdBlocks = await prisma.timeBlock.createMany({
  data: timeBlocks.map((block) => ({
    timetableId,
    dayOfWeek: block.dayOfWeek,
    startTime: block.startTime,
    endTime: block.endTime,
    subject: block.subject,
    classroom: block.classroom,
    grade: block.grade,
    section: block.section,
    notes: block.notes,
    confidence: block.confidence,
  })),
});
```

**❌ Data Lost During Storage**:
- ❌ `academicYear` - extracted but never saved
- ❌ `semester` - extracted but never saved

**Why?** The Prisma schema doesn't have these fields on the `Timetable` model.

### Stage 3: Actual Prisma Schema (Ground Truth)

**File**: `backend/prisma/schema.prisma`

```prisma
model Timetable {
  id                String              @id @default(uuid())
  teacherId         String
  originalFileName  String              // ✅ Flat field
  fileType          String              // ✅ Flat field
  fileSize          Int                 // ✅ Flat field
  filePath          String              // ✅ Flat field
  uploadedAt        DateTime            @default(now())
  processingStatus  ProcessingStatus    // ✅ Not "status"
  extractionMethod  String?             // ✅ Just string, not JSON
  errorMessage      String?
  
  teacher           Teacher             @relation(fields: [teacherId], references: [id])
  timeBlocks        TimeBlock[]
  processingLogs    ProcessingLog[]
  
  // ❌ NO semester field
  // ❌ NO academicYear field
  // ❌ NO fileInfo JSON object
  // ❌ NO extractionMetadata JSON object
}

model TimeBlock {
  id            String      @id @default(uuid())
  timetableId   String
  dayOfWeek     DayOfWeek   // Enum: MONDAY, TUESDAY, etc.
  startTime     String      // HH:mm format
  endTime       String      // HH:mm format
  subject       String
  classroom     String
  grade         String
  section       String
  notes         String
  confidence    Float       // 0-100 confidence score
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  timetable     Timetable   @relation(fields: [timetableId], references: [id])
}
```

## 📊 Comparison: Documented vs Actual

### What I Previously Claimed (INCORRECT) ❌

```json
{
  "semester": "Fall 2024",              // ❌ DOESN'T EXIST IN DB
  "academicYear": "2024-2025",          // ❌ DOESN'T EXIST IN DB
  "fileInfo": {                         // ❌ NOT NESTED IN DB
    "originalName": "...",
    "fileSize": 1514455
  },
  "extractionMetadata": {               // ❌ DOESN'T EXIST IN DB
    "method": "...",
    "confidence": 0.95
  }
}
```

### What Actually Exists (CORRECT) ✅

```json
{
  "originalFileName": "Teacher Timetable Example 1.1.png",  // ✅ FLAT FIELD
  "fileType": "image/png",                                  // ✅ FLAT FIELD
  "fileSize": 1308685,                                      // ✅ FLAT FIELD
  "filePath": "uploads/...",                                // ✅ FLAT FIELD
  "processingStatus": "COMPLETED",                          // ✅ NOT "status"
  "extractionMethod": null,                                 // ✅ STRING NOT OBJECT
  // NO semester
  // NO academicYear
  // NO nested fileInfo
  // NO extractionMetadata object
}
```

## 🚨 Key Issues Identified

### 1. Data Loss During Storage
**Problem**: LLM extracts `academicYear` and `semester` but they're discarded.

**Why**: Prisma schema doesn't have these fields.

**Impact**: Semantic metadata is lost forever after extraction.

**Solution**: Add fields to schema:
```prisma
model Timetable {
  // ... existing fields ...
  academicYear  String?
  semester      String?
}
```

### 2. Incorrect Field Names in Documentation
**Problem**: Documentation used `status` instead of `processingStatus`.

**Why**: Assumption, not verification.

**Impact**: Verification script failed compilation.

**Solution**: Always check schema first.

### 3. Flat vs Nested Structure Confusion
**Problem**: Documentation claimed nested `fileInfo` and `extractionMetadata` objects.

**Why**: Assumption based on typical API design patterns.

**Impact**: Misleading documentation.

**Solution**: Schema uses flat fields, documentation corrected.

## 🔧 What Can Be Improved

### Option 1: Add Missing Fields to Schema
```prisma
model Timetable {
  id                String              @id @default(uuid())
  teacherId         String
  originalFileName  String
  fileType          String
  fileSize          Int
  filePath          String
  uploadedAt        DateTime            @default(now())
  processingStatus  ProcessingStatus
  extractionMethod  String?
  errorMessage      String?
  
  // NEW FIELDS ↓
  academicYear      String?             // "2024-2025"
  semester          String?             // "Fall 2024", "Spring 2025"
  
  teacher           Teacher             @relation(fields: [teacherId], references: [id])
  timeBlocks        TimeBlock[]
  processingLogs    ProcessingLog[]
}
```

### Option 2: Store in ProcessingLog Metadata
Since `ProcessingLog` has a JSON `metadata` field, semantic data could be stored there:

```typescript
await db.createProcessingLog({
  timetableId,
  step: 'LLM_EXTRACTION',
  status: 'COMPLETED',
  message: 'Semantic metadata extracted',
  metadata: {
    academicYear: timetableData.academicYear,
    semester: timetableData.semester,
    confidence: 85,
  },
});
```

## 🎓 Lessons Learned

1. **Always verify against source of truth** - The Prisma schema is the authoritative source, not assumptions.

2. **LLM extraction ≠ Database storage** - Just because the LLM extracts data doesn't mean it gets saved.

3. **Check the entire data pipeline** - Extraction → Processing → Storage → Retrieval

4. **Flat is simpler than nested** - Schema uses flat fields for simplicity and performance.

5. **Enums enforce consistency** - `ProcessingStatus` and `DayOfWeek` enums prevent invalid values.

## 📝 Corrected Data Flow

### 1. File Upload
- User uploads file via frontend
- Multer saves to `uploads/` directory
- Database creates `Timetable` record with `PENDING` status

### 2. Text Extraction (OCR/PDF/DOCX)
- Based on file type, appropriate extractor runs
- Returns raw text + extraction metadata
- No database changes yet

### 3. LLM Processing
- **Simple Mode**: Direct LLM call with structured output
- **Agent Mode**: LangChain React Agent with tools
- **Extracts**: teacherName, timeBlocks[], academicYear, semester
- **Returns**: TimetableData object

### 4. Database Storage (Data Loss Point!)
- Updates `Timetable.processingStatus` to `COMPLETED`
- Creates `Teacher` record if not exists
- Creates `TimeBlock` records (48 entries in sample)
- **DISCARDS**: academicYear, semester ← Lost here!
- Stores confidence per time block

### 5. API Response
- Backend returns nested structure:
  ```json
  {
    "teacher": { "name": "aa" },
    "fileInfo": { ... },
    "timeBlocks": [ ... ]
  }
  ```

### 6. Frontend Display
- API transformation layer converts to flat structure
- Displays: teacher name, file info, weekly grid
- Shows time blocks with subjects, times, confidence

## ✅ Verification Complete

**Script**: `backend/verify-data.ts`
**Query**: Latest completed timetable with teacher + time blocks
**Result**: All data matches actual Prisma schema
**Confidence**: 100% - Verified against production database

## 🚀 Recommendations

1. **Add semantic fields to schema** if needed for features
2. **Update documentation** to match actual structure (DONE)
3. **Store LLM extraction metadata** in ProcessingLog if useful
4. **Consider using JSON fields** for extensibility without migrations
5. **Always verify** before documenting
