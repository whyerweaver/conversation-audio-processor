# Testing Guide - Conversation Audio Processor

**Date:** January 8, 2026

---

## 🔧 Installation

### Step 1: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Navigate to and select: `C:\Users\wired_weaver\Documents\PDFs\conversation-audio-processor`
5. Extension should appear in the list with no errors

### Step 2: Verify Installation

- Extension name: "Conversation Audio Processor"
- Version: 1.0
- No errors shown on extension card
- Extension icon appears in Chrome toolbar (puzzle piece icon)

---

## 🧪 Test Scenario 1: Gemini Extraction

### Setup
1. Open new tab
2. Navigate to https://gemini.google.com
3. Start or open existing conversation with several exchanges

### Test Steps
1. Click extension icon in Chrome toolbar
2. Popup should open showing:
   - Platform detected as "Gemini"
   - "Extract Conversation" button enabled
   - Clean UI with purple gradient

3. Click "Extract Conversation" button
   - Button text changes to "Extracting..."
   - Wait ~3 seconds
   - Success message appears
   - "Export as:" section appears with 3 buttons

4. Check browser console (F12)
   - Should see: `[Content Script] Conversation Extractor Running`
   - Should see: `[Gemini Extractor] Starting extraction...`
   - Should see: `[Gemini Extractor] Found X message elements`
   - Should see: `[Content Script] Extraction successful`

### Expected Results
✅ Platform detected correctly
✅ Extraction completes without errors
✅ Exchange count matches conversation length
✅ Export buttons appear

---

## 📄 Test Scenario 2: Markdown Export

### Test Steps
1. After successful extraction, click **Markdown** export button
2. File should download automatically

### Verify Downloaded File
1. Open the `.md` file in any text editor
2. Check contents:
   - Title: "Gemini Conversation"
   - Participants section with Gemini listed
   - Each exchange formatted with headers
   - User and Assistant messages alternating
   - Timestamps included
   - Clean, readable formatting

### Expected Format
```markdown
# Gemini Conversation

## Participants
- User (human)
- Gemini (llm) - Voice: alloy, Speed: 1.0

---

## Conversation

### User

[User's first message text]

---

### Gemini

[Gemini's response text]

---
```

✅ File downloads successfully
✅ Formatting is clean and readable
✅ All exchanges present
✅ Metadata included

---

## 🌐 Test Scenario 3: HTML Export with Audio

### Test Steps
1. After successful extraction, click **HTML** export button
2. File should download as `.html`
3. Open the HTML file in Chrome (double-click or drag to browser)

### Verify HTML Features

#### Visual Check
✅ Title displays correctly
✅ Metadata shows platform, exchange count, date
✅ Exchanges display in alternating colored boxes
✅ User messages have blue background
✅ Assistant messages have gray background
✅ Play buttons visible on each exchange
✅ Control panel visible at bottom
✅ Responsive design (try resizing window)

#### Audio Playback Check
1. Click **Play** button on any assistant message
   - Button changes to "Pause" with pause icon
   - Exchange highlights with purple border
   - Browser speaks the text using Web Speech API
   - Exchange scrolls into view

2. Test **Play All** button
   - Plays all assistant messages sequentially
   - Skips user messages
   - Highlights current exchange
   - Pauses between exchanges

3. Test **Stop** button
   - Stops current playback
   - Removes highlight
   - Resets play button

4. Test **Previous/Next** buttons
   - Navigate between exchanges
   - Automatically start playback

### Expected Results
✅ HTML file opens in browser
✅ Visual styling looks professional
✅ Individual play buttons work
✅ Voice plays through browser speakers
✅ Play All works sequentially
✅ Controls (Stop, Prev, Next) function correctly
✅ Visual highlighting works

---

## 📊 Test Scenario 4: JSON Export

### Test Steps
1. After successful extraction, click **JSON** export button
2. File downloads as `.json`
3. Open in text editor or JSON viewer

### Verify JSON Structure
Check for these keys:
```json
{
  "id": "uuid-format",
  "title": "Gemini Conversation",
  "platform": "gemini",
  "created": "ISO timestamp",
  "updated": "ISO timestamp",
  "participants": [
    { "id": "user-me", "type": "human", ... },
    { "id": "llm-gemini", "type": "llm", ... }
  ],
  "exchanges": [
    {
      "id": "exchange-1",
      "participantId": "user-me",
      "role": "user",
      "text": "...",
      "timestamp": "ISO timestamp",
      ...
    }
  ]
}
```

✅ Valid JSON format
✅ All required fields present
✅ Data matches extracted conversation
✅ Timestamps in ISO format

---

## ❌ Test Scenario 5: Unsupported Platform

### Test Steps
1. Visit any website other than Gemini (e.g., google.com)
2. Click extension icon

### Expected Behavior
✅ Platform shows "Not Supported"
✅ Extract button is disabled (grayed out)
✅ Error message: "This page is not a supported LLM platform"

---

## 🐛 Common Issues & Troubleshooting

### Issue: Extension doesn't load
**Fix:**
- Check for syntax errors in manifest.json
- Verify all file paths are correct
- Reload extension: chrome://extensions → click reload icon

### Issue: "Extract Conversation" stays disabled
**Possible causes:**
- Not on a supported platform
- Check popup.js console for errors

### Issue: Extraction returns 0 exchanges
**Possible causes:**
- Page hasn't fully loaded (wait longer)
- React hasn't hydrated yet (increase setTimeout in content.js)
- Gemini UI changed (check selector in gemini.js)

**Debug:**
1. Open DevTools (F12)
2. Go to Console
3. Type: `document.querySelectorAll('message-content').length`
4. If returns 0, React hasn't loaded
5. If returns > 0, extractor has wrong selector

### Issue: Audio doesn't play in HTML export
**Possible causes:**
- Browser doesn't support Web Speech API
- No voices available on system

**Debug:**
1. Open HTML file
2. Open DevTools Console
3. Type: `speechSynthesis.getVoices()`
4. Should return array of available voices

**Workaround:**
- Try different browser (Chrome, Edge work best)
- Check system TTS settings

### Issue: Downloads blocked
**Fix:**
- Check browser download settings
- Allow downloads from local files
- Check for popup blockers

---

## ✅ Full Test Checklist

- [ ] Extension loads without errors
- [ ] Gemini platform detected correctly
- [ ] Extraction completes successfully
- [ ] Markdown export downloads and formats correctly
- [ ] HTML export downloads
- [ ] HTML displays correctly in browser
- [ ] Audio playback works
- [ ] Play All works sequentially
- [ ] Playback controls (Stop, Prev, Next) function
- [ ] JSON export contains valid data
- [ ] Unsupported platforms show error
- [ ] No console errors during any operation

---

## 📝 Testing Notes

Record any issues here:

**Date:** ___________
**Browser:** Chrome Version: ___________
**OS:** Windows ___________

**Test Results:**
- Extraction: ☐ Pass ☐ Fail - Notes: _______________
- Markdown Export: ☐ Pass ☐ Fail - Notes: _______________
- HTML Export: ☐ Pass ☐ Fail - Notes: _______________
- Audio Playback: ☐ Pass ☐ Fail - Notes: _______________
- JSON Export: ☐ Pass ☐ Fail - Notes: _______________

**Issues Found:**
1. _______________________________________________
2. _______________________________________________

---

**Next Steps After Testing:**
1. Fix any bugs discovered
2. Add extractors for ChatGPT, Claude, etc.
3. Consider OpenAI TTS integration for better voices
4. Add conversation storage
5. Improve error handling
