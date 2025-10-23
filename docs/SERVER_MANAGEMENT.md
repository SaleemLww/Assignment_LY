# 🚀 Server Management Scripts

Easy-to-use scripts for managing the Timetable Extraction application servers.

## 📜 Available Scripts

### 1. Start Servers (Recommended)
```bash
./start-servers.sh
```

**What it does:**
- ✅ Kills any existing Node.js processes
- ✅ Opens **Backend** in a new Terminal window (Port 5001)
- ✅ Opens **Frontend** in a new Terminal window (Port 3000)
- ✅ Shows all logs separately for easy debugging

**Benefits:**
- Clean separation of logs
- Easy to monitor backend processing
- Can stop servers independently with Ctrl+C

---

### 2. Stop All Servers
```bash
./stop-servers.sh
```

**What it does:**
- ✅ Stops all running Node.js servers
- ✅ Cleans up all processes

---

## 🌐 Access Points

After starting servers:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | React UI for file upload |
| **Backend API** | http://localhost:5001 | Express API server |
| **Health Check** | http://localhost:5001/health | Server status |

---

## 🔧 Manual Server Management

If you prefer to run servers manually:

### Backend (Terminal 1)
```bash
cd backend
npm run dev
```

### Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```

---

## 🐛 Troubleshooting

### Port Already in Use
If you see "Port already in use" errors:
```bash
./stop-servers.sh
./start-servers.sh
```

### Logs Not Visible
The script opens separate Terminal windows. Check your Terminal app - you should see:
- 🔥 BACKEND SERVER - Port 5001
- ⚡ FRONTEND SERVER - Port 3000

### Permission Denied
If you get permission errors:
```bash
chmod +x start-servers.sh
chmod +x stop-servers.sh
```

---

## 📊 What to Expect

### Backend Terminal Will Show:
- 🚀 Server startup message
- 🔥 Worker started and listening
- 📥 API requests (CORS, endpoints)
- 🔄 Job processing (OCR, extraction)
- ✅ Completion messages
- ❌ Error messages (if any)

### Frontend Terminal Will Show:
- ⚡ Vite dev server ready
- 🔄 HMR (Hot Module Reload) updates
- ➜ Local URL

---

## 🎯 PDF Extraction Issue - FIXED!

**Problem:** PDF files were failing with `(0 , pdf_parse_1.default) is not a function`

**Solution:** Fixed the import statement in `backend/src/services/pdf.service.ts`
- Changed: `import pdf from 'pdf-parse'`
- To: `import * as pdfParse from 'pdf-parse'`

**Status:** ✅ PDF extraction now works! You can upload:
- PNG/JPEG images (OpenAI Vision)
- PDF files (pdf-parse + AI Vision for scanned PDFs)
- DOCX files (text extraction)

---

## 💡 Tips

1. **Always check Backend logs** when debugging upload issues
2. **Use separate terminals** to easily scroll through logs
3. **Monitor job progress** in backend logs (10%, 60%, 90%, 100%)
4. **Frontend HMR** automatically reloads when code changes

---

## 🎉 Happy Coding!

The system is now fully functional with:
- ✅ Image uploads (PNG, JPEG)
- ✅ PDF uploads (text + scanned)
- ✅ Real-time processing
- ✅ Beautiful timetable grid
- ✅ Separate log terminals for easy debugging
