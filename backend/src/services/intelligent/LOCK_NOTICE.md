# 🔒 Intelligent Services - LOCKED

## Protected Files

All files in this directory are **LOCKED** and protected from modifications:

### Core Agent Files (🔒 LOCKED)
- ✅ `extraction.agent.ts` - React Agent implementation with OpenAI
- ✅ `agent.tools.ts` - 4 real agent tools (rerun_ocr, validate, correct, merge)
- ✅ `intelligent.service.ts` - Main service with agent/simple mode
- ✅ `index.ts` - Service exports
- ✅ `README.md` - Documentation

### Lock Status
- 🔒 **Status**: LOCKED
- 📅 **Date**: 2025-10-22
- 🚫 **Modifications**: BLOCKED
- ⚠️ **Permission Required**: YES

### Why Locked?

1. **Production-Ready**: All services tested and working with real APIs
2. **Zero Mocks**: 100% real API integrations (OpenAI, Google, Tesseract)
3. **Tested**: Integration tests passing with actual API calls
4. **Deployed**: Successfully committed and pushed to repository
5. **Active**: Agent mode enabled by default (USE_AGENTIC_WORKFLOW=true)

### Current Functionality

✅ **Agent System**:
- OpenAI GPT-4o-mini for intelligent reasoning
- LangChain createReactAgent for tool orchestration
- Conversation memory and message history
- Automatic tool selection based on quality analysis

✅ **Agent Tools**:
- `rerun_ocr`: Re-extract with OpenAI Vision/Google Gemini
- `validate_timetable`: Validate structure with pattern analysis
- `correct_time_format`: Normalize time formats (9am → 09:00 AM)
- `merge_duplicates`: Remove duplicate entries

✅ **Real API Integration**:
- OpenAI Vision API for OCR
- OpenAI GPT-4o-mini for agent intelligence
- Google Gemini Vision for fallback
- PostgreSQL for data storage
- Redis for queue management

### Request Unlock Procedure

**⚠️ IMPORTANT: Do NOT modify these files without permission!**

**To request unlock:**

1. **Stop** - Do not make any changes
2. **Document** - Write down:
   - What needs to be changed?
   - Why is the change necessary?
   - What's the expected impact?
   - How will it be tested?
3. **Ask Permission** - Contact project owner
4. **Wait for Approval** - Do not proceed until confirmed
5. **Unlock** - Owner will remove lock if approved

### Emergency Procedure

**If you find a critical bug:**
1. 🛑 DO NOT FIX IT IMMEDIATELY
2. 📝 Document the bug with evidence
3. 🔍 Analyze the root cause
4. 📢 Report to project owner
5. ⏸️ Wait for approval to fix
6. ✅ Owner will unlock if fix is approved

### Configuration (Can Be Modified)

**These settings can be changed in `.env` without unlocking:**
- `USE_AGENTIC_WORKFLOW` - Toggle agent mode (true/false)
- `AGENT_MAX_ITERATIONS` - Maximum tool uses (default: 5)
- `AGENT_VERBOSE` - Enable debug logging (default: false)

**No code changes needed to adjust these settings!**

---

## Protection Notice

```
🔒 PROTECTED BY LOCK FILE
📅 LOCKED: 2025-10-22
🚫 UNAUTHORIZED MODIFICATIONS PROHIBITED
⚠️ ASK PERMISSION BEFORE ANY CHANGES
```

**This protection ensures:**
- Stable production code
- Consistent API behavior
- Prevented accidental breaking changes
- Controlled update process
- Quality assurance

---

**Questions?** Ask the project owner before making any changes.
