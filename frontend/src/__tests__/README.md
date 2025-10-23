# Frontend Tests - Real API Integration

This directory contains integration tests for the frontend application that make **REAL API calls** to the backend server.

## Setup

### Install Testing Dependencies
```bash
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest @vitest/ui jsdom
```

### Prerequisites
1. Backend server running on `http://localhost:5001`
2. Redis and PostgreSQL running
3. Real API keys configured in backend `.env`
4. Sample timetable files in `TA_Assignment_Pack/examples/`

## Running Tests

```bash
# Run all tests
npm run test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

## Test Files

- `api.real.test.ts` - Tests real API calls to backend
- `FileUpload.real.test.tsx` - Tests file upload component with real files
- `TimetablesList.real.test.tsx` - Tests timetable listing with real data

## Notes

- Tests use real backend API (no mocks)
- Requires backend server to be running
- Creates and cleans up test data automatically
- Each test run takes ~2-3 minutes due to real AI processing

---

**Status:** Test infrastructure ready  
**Backend Required:** Yes (port 5001)  
**API Mocking:** None - all real calls
