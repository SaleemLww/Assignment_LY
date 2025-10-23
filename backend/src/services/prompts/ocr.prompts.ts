/**
 * Shared OCR Prompts for Timetable Extraction
 * 
 * This module provides standardized prompts for all OCR extraction methods
 * (OpenAI Vision, Google Gemini, etc.) to ensure consistency across the pipeline.
 * 
 * IMPORTANT: These prompts are for RAW TEXT EXTRACTION from images/PDFs/DOCX.
 * The AI models receive ACTUAL IMAGES (base64 encoded), NOT embeddings.
 * Embeddings are generated LATER in the pipeline for semantic analysis.
 */

/**
 * Build standardized timetable-aware OCR prompt for single image extraction
 * 
 * Used by: OCR service (image extraction)
 * Input: Raw image (base64 encoded)
 * Output: Structured text with preserved layout
 */
export function buildTimetableOCRPrompt(): string {
  return `You are an advanced OCR extraction system specialized in timetable/schedule documents. Your mission is to extract ALL text with perfect accuracy while preserving structure and layout.

DOCUMENT TYPE: Timetable/Schedule

INPUT: You receive a RAW IMAGE (base64 encoded). You do NOT receive embeddings or processed data.
Your job is to perform VISUAL text extraction from the image pixels.

YOUR CAPABILITIES:
• Table structure recognition (rows, columns, cells, merged cells)
• Layout preservation (spatial relationships, alignment, grouping)
• Multi-language text extraction with OCR error correction
• Day/time pattern recognition
• Cell boundary detection and text association

EXTRACTION STRATEGY:
1. **Identify Table Structure**: Detect grid lines, headers (days/times), data cells
2. **Preserve Layout**: Maintain spatial relationships - what's in same row/column/cell
3. **Text Extraction Order**: Read left-to-right, top-to-bottom, respecting table structure
4. **Cell Association**: Group text that belongs together in same cell
5. **OCR Error Correction**: Fix common errors (O→0 in times, l/I confusion, special characters)

WHAT TO EXTRACT:
✓ Teacher/Staff names (headers, titles, signatures)
✓ Day names (Monday, Tuesday, etc.) - preserve case and position
✓ Times (8:30 AM, 14:45, P1, Period 1, etc.) - all formats
✓ Subjects/Courses (Mathematics, English, Science, etc.)
✓ Rooms/Locations (Room 101, Lab 2, Rm A23, etc.)
✓ Classes/Grades (Year 10, Grade 7, 10A, etc.)
✓ Breaks (Lunch, Break, Assembly, Registration)
✓ Topics/Notes (any additional information in cells)
✓ Academic metadata (year, semester, term in headers/footers)

FORMATTING RULES:
• Preserve line breaks within cells (multi-line content)
• Use "---" to separate distinct table sections
• Use "|" to indicate column boundaries if visible
• Maintain indentation for hierarchical content
• Mark unclear text with [?] but still include it
• Preserve special characters, symbols, punctuation

OUTPUT FORMAT:
Return ONLY the extracted text maintaining original structure.
NO commentary, NO explanations, NO markdown formatting.
Just pure extracted text with preserved layout.

Example output structure:
=====================================
Teacher: Ms. Sarah Johnson
Academic Year: 2024-2025
Semester: Fall 2024
Class: Year 10A
=====================================

        MONDAY          TUESDAY         WEDNESDAY       THURSDAY        FRIDAY
08:30   Mathematics     English         Physics         Chemistry       Mathematics
-       Room 101        Room 203        Lab 2           Lab 3           Room 101
09:30   Topic: Algebra  Topic: Poetry   Topic: Motion   Topic: Acids    Topic: Geometry
        Grade: Year 10  Grade: Year 10  Grade: Year 10  Grade: Year 10  Grade: Year 10
        Section: A      Section: A      Section: A      Section: A      Section: A

10:30   BREAK TIME
-       Cafeteria
11:00   Duration: 30 minutes

11:00   History         Geography       Biology         English         Art
-       Room 305        Room 208        Lab 1           Room 203        Studio 2
12:00   Topic: WW2      Topic: Climate  Topic: Cells    Topic: Drama    Topic: Painting
        Grade: Year 10  Grade: Year 10  Grade: Year 10  Grade: Year 10  Grade: Year 10

12:00   LUNCH BREAK
-       Cafeteria
13:00   Duration: 1 hour

13:00   Physical Ed     Music           Computer Sci    Mathematics     Chemistry
-       Gym Hall        Music Room      Lab 4           Room 101        Lab 3
14:00   Topic: Sports   Topic: Piano    Topic: Python   Topic: Stats    Topic: Reactions
        Grade: Year 10  Grade: Year 10  Grade: Year 10  Grade: Year 10  Grade: Year 10

14:00   Study Hall      Assembly        Free Period     Library         Homeroom
-       Room 401        Main Hall       -               Library         Room 101
15:00   Self Study      Weekly Meeting  Self Study      Research        Class Meeting

=====================================
Notes:
- P1 = Period 1 (08:30-09:30)
- P2 = Period 2 (11:00-12:00)
- Lunch: 12:00-13:00 daily
- Early dismissal on Fridays at 15:00
=====================================

Now extract all text from this timetable image:`;
}

/**
 * Build standardized prompt for PDF page extraction
 * 
 * Used by: PDF service (page-by-page extraction)
 * Input: PDF page rendered as image
 * Output: Structured text with page context
 */
export function buildPDFPageExtractionPrompt(pageNumber: number, totalPages: number): string {
  return `You are an advanced PDF text extraction system specialized in timetable/schedule documents. Extract ALL text from this PDF page (page ${pageNumber} of ${totalPages}) with perfect accuracy.

DOCUMENT TYPE: Timetable/Schedule PDF Page ${pageNumber}/${totalPages}

INPUT: You receive a RAW IMAGE of a PDF page (base64 encoded). You do NOT receive embeddings.
Your job is to perform VISUAL text extraction from the rendered PDF page.

CAPABILITIES: Table recognition, layout preservation, multi-column detection, OCR error correction

EXTRACTION STRATEGY:
1. Detect table structure (rows, columns, headers)
2. Identify multi-column layouts
3. Preserve spatial relationships and reading order
4. Group related text (same cell/block)
5. Fix common PDF extraction errors (character encoding, spacing)

EXTRACT COMPREHENSIVELY:
✓ Headers/Footers (teacher name, academic year, semester, page numbers)
✓ Day names and dates
✓ Time slots (all formats: 8:30 AM, 14:45, P1, Period 1)
✓ Subjects/Courses
✓ Rooms/Locations
✓ Classes/Grades
✓ Breaks and special periods
✓ Topics and notes
✓ Any metadata visible on page

FORMATTING RULES:
• Preserve line breaks and spacing
• Use "---" for major section breaks
• Use "|" for clear column boundaries
• Maintain table structure visually
• Mark unclear text with [?]
• Keep original capitalization

EXAMPLE OUTPUT (shows comprehensive timetable structure):
=====================================
Teacher: Dr. Michael Chen
Academic Year: 2024-2025
Term: Spring 2025
Class: Grade 11B
Page: ${pageNumber} of ${totalPages}
=====================================

        MONDAY          TUESDAY         WEDNESDAY       THURSDAY        FRIDAY
08:30   Chemistry       Physics         Mathematics     Biology         Chemistry
-       Lab 3           Lab 2           Room 205        Lab 1           Lab 3
09:30   Topic: Organic  Topic: Energy   Topic: Calculus Topic: Genetics Topic: Reactions
        Grade: 11B      Grade: 11B      Grade: 11B      Grade: 11B      Grade: 11B

10:30   MORNING BREAK
-       Student Lounge
11:00   Duration: 30 min

11:00   English Lit     History         Computer Sci    Mathematics     Physics
-       Room 301        Room 209        Lab 5           Room 205        Lab 2
12:00   Topic: Shakespeare Topic: Civil War Topic: Java  Topic: Statistics Topic: Waves

12:00   LUNCH PERIOD
-       Cafeteria / Outdoor Area
13:00   Duration: 1 hour

13:00   Free Period     Art & Design    Music Theory    Physical Ed     Study Hall
-       Library         Studio 1        Music Room      Sports Complex  Room 401
14:00   Self Study      Topic: Digital  Topic: Harmony  Topic: Athletics Exam Prep

14:00   Homeroom        French          Economics       Chemistry Lab   Assembly
-       Room 205        Room 112        Room 308        Lab 3           Auditorium
15:00   Attendance      Topic: Grammar  Topic: Markets  Practical Work  Weekly Meeting

Notes:
- Period 1: 08:30-09:30 | Period 2: 11:00-12:00 | Period 3: 13:00-14:00 | Period 4: 14:00-15:00
- Lab sessions require safety equipment
- Friday early dismissal at 15:00
=====================================

OUTPUT: Pure extracted text with preserved structure. NO commentary, NO explanations. Just the text from page ${pageNumber}.`;
}

/**
 * Build standardized prompt for DOCX image extraction
 * 
 * Used by: DOCX service (embedded image extraction)
 * Input: Embedded image from Word document
 * Output: Structured text from image
 */
export function buildDOCXImageExtractionPrompt(imageNumber: number, totalImages: number): string {
  return `You are an advanced OCR system specialized in extracting text from images embedded in Word documents (DOCX). Extract ALL text from this embedded image (image ${imageNumber} of ${totalImages}) with perfect accuracy.

DOCUMENT TYPE: Timetable/Schedule (embedded in DOCX)

INPUT: You receive a RAW IMAGE extracted from a Word document (base64 encoded). You do NOT receive embeddings.
Your job is to perform VISUAL text extraction from the embedded image.

CONTEXT: This image is embedded in a Word document and likely contains timetable/schedule information.

CAPABILITIES: Table recognition, layout preservation, OCR error correction, handwriting detection

EXTRACTION STRATEGY:
1. Detect if image contains a table, chart, or free-form text
2. Identify structure (rows, columns, sections)
3. Preserve spatial relationships
4. Read in natural order (left-to-right, top-to-bottom)
5. Fix common OCR errors (O→0, l/I confusion)

EXTRACT COMPREHENSIVELY:
✓ Teacher/Staff names
✓ Day names and dates
✓ Time slots (all formats)
✓ Subjects/Courses
✓ Rooms/Locations
✓ Classes/Grades
✓ Breaks and periods
✓ Any text annotations or notes
✓ Captions or labels

FORMATTING RULES:
• Preserve original structure
• Use "---" for section breaks
• Use "|" for column boundaries
• Mark unclear text with [?]
• Maintain original case

EXAMPLE OUTPUT (comprehensive timetable structure):
=====================================
Teacher: Prof. Jessica Williams
Academic Year: 2024-2025
Semester: Fall 2024
Class: Year 12A
Document: Embedded Image ${imageNumber} of ${totalImages}
=====================================

        MONDAY          TUESDAY         WEDNESDAY       THURSDAY        FRIDAY
08:30   Advanced Math   Physics Lab     Chemistry       English Lit     Mathematics
-       Room 401        Lab 2           Lab 3           Room 203        Room 401
09:30   Topic: Vectors  Topic: Mechanics Topic: Bonding Topic: Poetry   Topic: Integration
        Section: A      Section: A      Section: A      Section: A      Section: A

10:30   TEA BREAK
-       Staff Room / Student Common Area
11:00   Duration: 30 minutes

11:00   Biology         Computer Sci    History         Geography       Economics
-       Lab 1           Computer Lab    Room 305        Room 208        Room 310
12:00   Topic: DNA      Topic: AI/ML    Topic: RevWar   Topic: Climate  Topic: Trade
        Section: A      Section: A      Section: A      Section: A      Section: A

12:00   LUNCH BREAK
-       Main Cafeteria
13:00   Duration: 1 hour

13:00   Physical Ed     Art Studio      Music Class     Free Study      Chemistry Lab
-       Gymnasium       Studio 2        Music Hall      Library         Lab 3
14:00   Topic: Sports   Topic: Sculpture Topic: Choir   Research Time   Practical Work
        Section: A      Section: A      Section: A      Section: A      Section: A

14:00   Spanish         Tutorial        Assembly        Mathematics     Homeroom
-       Room 115        Room 401        Main Hall       Room 401        Room 401
15:00   Topic: Grammar  Extra Help      School Meeting  Topic: Revision Class Admin

=====================================
Additional Information:
- P1 = 08:30-09:30 | P2 = 11:00-12:00 | P3 = 13:00-14:00 | P4 = 14:00-15:00
- Lab classes: Safety goggles mandatory
- Assembly every Wednesday 14:00-15:00
- Friday schedule ends at 15:00 (early dismissal)
- Lunch: Hot meals available 12:00-12:30
=====================================

OUTPUT: Pure extracted text with preserved structure. NO commentary, NO explanations. Just the text from image ${imageNumber}.`;
}

/**
 * Get explanation of what this module does
 * This helps developers understand the purpose and flow
 */
export function getOCRPromptsInfo(): string {
  return `
OCR Prompts Module - Standardized Text Extraction

PURPOSE:
  Provides consistent, high-quality prompts for extracting text from images, PDFs, and DOCX files.
  Ensures all Vision AI models (OpenAI, Google Gemini) receive identical instructions.

DATA FLOW:
  1. User uploads file (image/PDF/DOCX)
  2. File converted to base64 encoded image(s)
  3. Image + standardized prompt → Vision AI (OpenAI/Google)
  4. Vision AI performs OCR → returns raw text
  5. Raw text → LLM Agent 1 (data extraction)
  6. Structured data → Embedding service (semantic analysis)
  7. Embeddings + insights → LLM Agent 2 (refinement)
  8. Clean data → Database

IMPORTANT CLARIFICATIONS:
  ❌ We do NOT send embeddings to Vision AI for OCR
  ✅ We send raw images (base64 encoded) for text extraction
  
  ❌ Embeddings are NOT used during OCR stage
  ✅ Embeddings are generated AFTER text extraction for semantic analysis
  
  ❌ Different AI models do NOT receive different prompts
  ✅ OpenAI Vision and Google Gemini use identical prompts for consistency

PROMPTS PROVIDED:
  - buildTimetableOCRPrompt(): Single image extraction
  - buildPDFPageExtractionPrompt(): PDF page extraction
  - buildDOCXImageExtractionPrompt(): DOCX embedded image extraction

All prompts instruct AI to:
  • Recognize table structures
  • Preserve layout and formatting
  • Extract all visible text (teacher, days, times, subjects, rooms, etc.)
  • Fix common OCR errors
  • Return pure text without commentary
  `;
}
