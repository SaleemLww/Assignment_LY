# Backend Integration Tests - Real API Testing

## Overview
These integration tests use **REAL API calls** with no mocks or stubs. They test the complete system with actual:
- OpenAI Vision API
- Google Gemini Vision API  
- PostgreSQL database
- Redis queue
- File system operations

## Prerequisites

### 1. Services Running
```bash
# PostgreSQL (port 5432)
# Redis (port 6379)
# Backend server (port 5001) - optional for queue tests
```

### 2. Environment Variables
Ensure your `.env` file contains:
```bash
# Required
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://postgres@127.0.0.1:5432/timetable_db
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Optional but recommended
GOOGLE_API_KEY=...
ANTHROPIC_API_KEY=...
```

### 3. Test Data
Sample timetable files must exist in:
```
TA_Assignment_Pack/examples/
  - Teacher Timetable Example 1.1.png
  - Teacher Timetable Example 3.png
  - Teacher Timetable Example 4.jpeg
  - Teacher Timetable Example 2.pdf
```

## Test Suites

### 1. API Integration Tests (`api.real.test.ts`)
Tests all REST API endpoints with real file uploads and AI processing.

**What it tests:**
- ✅ Health check endpoints
- ✅ File upload (PNG, JPEG)
- ✅ Real AI processing (OpenAI Vision)
- ✅ Job status checking
- ✅ Timetable retrieval with pagination
- ✅ Time block updates
- ✅ Timetable deletion with cascade

**Duration:** ~2-3 minutes

### 2. AI Services Tests (`ai-services.real.test.ts`)
Tests AI/ML services with real API calls to OpenAI and Google.

**What it tests:**
- ✅ OCR Service (OpenAI Vision, Google Vision, Tesseract fallback)
- ✅ PDF Service (text extraction + AI vision)
- ✅ LLM Service (structured output with LangChain)
- ✅ Extraction Service (end-to-end pipeline)
- ✅ Performance metrics for real APIs

**Duration:** ~3-4 minutes

### 3. Queue Worker Tests (`queue.real.test.ts`)
Tests BullMQ job queue with real background processing.

**What it tests:**
- ✅ Job submission to Redis queue
- ✅ Real AI processing in background
- ✅ Processing log tracking
- ✅ Queue health and metrics
- ✅ Concurrent job handling

**Duration:** ~2-3 minutes

## Running Tests

### Run All Tests
```bash
cd backend
npm test
```

### Run Specific Test Suite
```bash
# API tests only
npm test -- api.real.test

# AI services only
npm test -- ai-services.real.test

# Queue tests only
npm test -- queue.real.test
```

### Run with Verbose Output
```bash
npm run test:verbose
```

### Run with Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

## Expected Results

### Success Indicators
- ✅ All tests pass
- ✅ Real AI extractions return time blocks
- ✅ Confidence scores > 0.85
- ✅ Database records created and cleaned up
- ✅ Processing completes within timeouts

### Sample Output
```
 PASS  tests/integration/api.real.test.ts (120.5s)
  API Integration Tests - Real API Calls
    Health Check Endpoints
      ✓ GET /health - should return server health status (45ms)
    File Upload - Real Image Processing
      ✓ POST /api/upload - should upload PNG image (32s)
      ✓ POST /api/upload - should upload JPEG image (28s)
    Job Status Checking - Real Processing Results
      ✓ GET /api/upload/status/:jobId - should return real processing status (123ms)
    ...

📊 Test Summary:
  - Found 15 timetables
  - Retrieved 24 time blocks
  - OCR Method: openai-vision | Confidence: 0.95
  - Text length: 1,245 characters
```

## Important Notes

### ⚠️ Real API Costs
- Tests make actual API calls to OpenAI/Google
- Estimated cost per full test run: $0.10 - $0.25 USD
- Use test API keys if available

### ⏱️ Timeout Configuration
Tests have extended timeouts for real AI processing:
- Global timeout: 5 minutes (`jest.setTimeout(300000)`)
- Individual tests may take 30-60 seconds

### 🧹 Data Cleanup
Tests automatically clean up:
- Database records (teachers, timetables, time blocks)
- Processing logs
- Test data prefixed with `TEST_`

### 🔄 Idempotency
Tests can be run multiple times safely:
- Cleanup runs before and after tests
- Unique email addresses generated with timestamps
- No interference between test runs

## Troubleshooting

### Tests Timeout
```
- Increase jest timeout in test file
- Check if Redis/PostgreSQL are running
- Verify network connection to OpenAI API
```

### API Key Errors
```
Error: OpenAI API key not configured

Solution: Add OPENAI_API_KEY to .env file
```

### Database Connection Error
```
Error: Can't reach database server

Solution:
1. Start PostgreSQL: brew services start postgresql
2. Check DATABASE_URL in .env
3. Run migrations: npx prisma migrate dev
```

### Redis Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:6379

Solution:
1. Start Redis: brew services start redis
2. Or: redis-server
3. Check REDIS_HOST and REDIS_PORT in .env
```

### Sample File Not Found
```
⚠️ Test image not found: .../examples/Teacher Timetable Example 1.1.png

Solution:
1. Ensure TA_Assignment_Pack/examples/ directory exists
2. Copy sample timetable images to that directory
```

## Test Coverage

Expected coverage after running all tests:
- Statements: ~70%
- Branches: ~60%
- Functions: ~60%
- Lines: ~70%

Higher coverage requires additional unit tests for edge cases.

## CI/CD Integration

To run tests in CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Run Integration Tests
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
    REDIS_HOST: localhost
    REDIS_PORT: 6379
  run: |
    npm test
```

**Note:** For CI/CD, consider:
- Using test API keys with rate limits
- Running tests sequentially to avoid rate limits
- Caching test results to save costs

## Performance Benchmarks

Average execution times (with real APIs):
- OCR extraction (PNG): 8-15 seconds
- LLM structuring: 3-8 seconds
- PDF processing: 10-20 seconds
- End-to-end pipeline: 30-45 seconds

These times depend on:
- Image/PDF complexity
- Network latency to API servers
- Current API load
- Database/Redis performance

## Support

For issues or questions:
- Check test output for detailed error messages
- Review console logs for AI processing details
- Verify all prerequisites are met
- Check API key quotas and rate limits

---

**Last Updated:** October 23, 2025  
**Test Framework:** Jest 30.2.0 + ts-jest 29.4.5  
**Total Test Suites:** 3  
**Total Tests:** 30+  
**Execution Time:** ~8-10 minutes for full suite
