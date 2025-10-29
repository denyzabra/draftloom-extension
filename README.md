# DraftLoom - FERPA-Compliant AI Writing Assistant

**100% on-device AI writing help for students. Your data never leaves Chrome.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://github.com/denyzabra/draftloom-extension)
[![Built with Chrome AI](https://img.shields.io/badge/Chrome_AI-6_APIs-orange.svg)](https://developer.chrome.com/docs/ai/)

> Built for the **Google Chrome Built-in AI Challenge 2025*


## Overview

**DraftLoom** is a Chrome extension that helps students and educators write better essays while keeping their data **100% private**. Unlike cloud-based AI tools that send your work to external servers, DraftLoom processes everything locally using Chrome's built-in AI.

### **The Problem**

46 million US students are protected by FERPA (Family Educational Rights and Privacy Act), yet existing AI writing tools violate these privacy regulations by sending student data to cloud servers. Schools can't recommend tools that compromise student privacy.

### **The Solution**

DraftLoom uses Chrome's on-device AI APIs to provide comprehensive writing assistance without ever sending data to external servers. Complete privacy. Zero cloud dependency.

---

## Features

### **6 AI-Powered Writing Tools**

1. **Brainstorm & Analyze** - Break down assignment prompts into key requirements and structure
2. **Draft Generation** - Create full essay drafts from outlines with academic tone
3. **Smart Rewriting** - Transform writing style (academic, professional, casual)
4. **Proofreading** - Detect and correct grammar, spelling, and punctuation errors
5. **Summarization** - Condense long texts into concise summaries
6. **Translation** - Multilingual support for international students

### **FERPA Privacy Protection**

- **PII Detection** - Automatically scans for Social Security Numbers, student IDs, dates of birth, addresses, phone numbers
- **Visual Privacy Alerts** - Red critical alerts when sensitive information is detected
- **Privacy Score** - 0-100 scale showing how safe content is to process
- **Violation Breakdown** - Detailed list of exactly what sensitive info was found

### **Delightful User Experience**

- **Celebration Animations** - Confetti when drafts complete (makes learning fun!)
- **Pre-loaded Samples** - 4 example prompts per tab for instant testing
- **Skeleton Loaders** - Smooth loading animations while AI processes
- **Demo Mode** - Works even without Chrome AI enabled (accessibility)
- **Welcome Guide** - Step-by-step Chrome AI setup on first install

### **Privacy First**

 **100% on-device processing** - No cloud servers
**FERPA compliant** - Safe for educational institutions
**No data collection** - Zero tracking or analytics
**Offline capable** - Works without internet
 **No API keys required** - Uses Chrome's built-in AI

---

## Installation


### **For Developers**

```bash
# Clone repository
git clone https://github.com/denyzabra/draftloom-extension.git
cd draftloom-extension

# Install dependencies
npm install

# Build extension
npm run build

# Load in Chrome
# Open chrome://extensions/ → Enable Developer mode → Load unpacked → Select dist/
```

---

## Chrome AI Setup

DraftLoom uses Chrome's experimental built-in AI APIs. Enable them in 3 minutes:

### **Step 1: Enable Chrome Flags**

1. Open a new tab: `chrome://flags`
2. Search and enable these 5 flags:
   - `#optimization-guide-on-device-model` → **Enabled**
   - `#prompt-api-for-gemini-nano` → **Enabled BypassPerfRequirement**
   - `#rewriter-api` → **Enabled**
   - `#summarization-api` → **Enabled**
   - `#translation-api` → **Enabled**

### **Step 2: Restart Chrome**

Click "Relaunch" button at bottom of flags page

### **Step 3: Download AI Model**

The on-device model (~2GB) downloads automatically on first use. May take 5-10 minutes.

---

## 📖 How to Use

### **Basic Workflow**

1. Click DraftLoom extension icon in Chrome toolbar
2. Choose a tab: **Brainstorm** | **Draft** | **Rewrite** | **Proofread**
3. Try a sample button OR paste your own text
4. Click the action button (e.g., "Analyze Prompt", "Generate Draft")
5. See AI-powered results with smooth animations!

### **Example: Essay Brainstorming**

1. Go to **Brainstorm** tab
2. Click **"Climate Change"** sample button
3. Click **"Analyze Prompt"** (green button)
4. See structured analysis:
   - **Main Topic** - What the essay is about
   - **Key Requirements** - Specific things to include
   - **Essay Structure** - Suggested outline
   - **Writing Tips** - How to approach the assignment

### **Example: Draft Generation with Celebration!**

1. Go to **Draft** tab
2. Click **"Essay Outline"** sample button
3. Click **"Generate Draft"** (green button)
4. Watch skeleton loader animate
5. **🎉 CONFETTI CELEBRATION!** when 500-word draft appears

### **Example: FERPA Protection Demo**

1. Go to **Settings** tab
2. Scroll to **"Privacy Protection Demo"** section
3. Click **"Load Sample with PII"**
4. Click **"Check for PII"**
5. See **RED CRITICAL ALERT** showing:
   - Privacy Score: 0/100
   - 6 violations detected (SSN, Student ID, DOB, email, phone, address)
   - Severity levels (Critical vs Warning)

---

## 🏗️ Project Structure

```
draftloom-extension/
├── public/
│   ├── icons/              # Extension icons (16x16, 48x48, 128x128)
│   ├── styles/
│   │   ├── design-system.css   # Brand colors, animations, components
│   │   ├── shared.css          # Global styles
│   │   └── sidebar.css         # Sidebar-specific styles
│   ├── manifest.json       # Chrome extension manifest (Manifest V3)
│   ├── popup.html          # Extension popup UI
│   ├── sidebar.html        # Main sidebar interface
│   └── welcome.html        # First-time setup guide
├── src/
│   ├── apis/               # Chrome AI API wrappers
│   │   ├── apiManager.js       # Coordinates all APIs, request queue
│   │   ├── capabilities.js     # Checks which APIs are available
│   │   ├── promptAPI.js        # Prompt analysis (window.ai.languageModel)
│   │   ├── writerAPI.js        # Draft generation (window.ai.writer)
│   │   ├── rewriterAPI.js      # Text rewriting (window.ai.rewriter)
│   │   ├── proofreaderAPI.js   # Grammar checking
│   │   ├── summarizerAPI.js    # Text summarization (window.ai.summarizer)
│   │   ├── translatorAPI.js    # Translation (window.ai.translator)
│   │   ├── demoAPI.js          # Fallback simulated responses
│   │   └── contentScriptBridge.js  # Communicate with content script
│   ├── background/         # Service worker
│   │   └── background.js       # Extension lifecycle, message routing
│   ├── content/            # Content script
│   │   └── content-script.js   # Injected into web pages for AI access
│   ├── popup/              # Popup UI
│   │   └── popup.js            # Popup logic
│   ├── sidebar/            # Sidebar UI (main interface)
│   │   └── sidebar.js          # Tab navigation, AI operations, FERPA demo
│   ├── welcome/            # Onboarding
│   │   └── welcome.js          # Welcome screen interactions
│   ├── storage/            # Data persistence
│   │   ├── cache-store.js      # API response caching (LRU cache)
│   │   └── session-store.js    # Draft & session management
│   └── utils/              # Utilities
│       ├── errorBoundary.js    # Error handling wrapper
│       ├── ferpa-checker.js    # PII detection engine (FERPA compliance)
│       ├── performance.js      # Performance monitoring
│       ├── logger.js           # Logging utility
│       ├── consent-manager.js  # User consent tracking
│       └── production-logger.js # Production-safe logging
├── tests/                  # Jest tests
│   ├── setup.js               # Test environment setup
│   ├── apis/                  # API tests
│   └── utils/                 # Utility tests
├── webpack.config.js       # Webpack bundler config (3 entry points)
├── package.json            # Dependencies (Chrome AI, no external AI APIs!)
├── LICENSE                 # MIT License
└── README.md              # This file
```

---

## Development

### **Build Commands**

```bash
npm run build          # Production build (minified, no source maps)
npm run build:dev      # Development build (with source maps)
npm run watch          # Auto-rebuild on file changes
npm run clean          # Remove dist folder
```

### **Testing**

```bash
npm test               # Run all tests once
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage report
```

Run specific test file:
```bash
npx jest tests/apis/apiManager.test.js
npx jest tests/utils/ferpa-checker.test.js
```

---

## Technical Highlights

### **Chrome AI APIs Used** (6/6 Available)

1. **Prompt API** (`window.ai.languageModel`) - Essay analysis
2. **Writer API** (`window.ai.writer`) - Draft generation
3. **Rewriter API** (`window.ai.rewriter`) - Tone transformation
4. **Proofreader API** (via Prompt API fallback) - Grammar checking
5. **Summarizer API** (`window.ai.summarizer`) - Text summarization
6. **Translator API** (`window.ai.translator`) - Multilingual support

### **Architecture**

- **Manifest V3** - Modern Chrome extension standard
- **Multi-entry Webpack** - 3 bundles (background, content-script, popup/sidebar)
- **Request Queue System** - Prevents overwhelming AI APIs (100ms delays)
- **LRU Cache** - Caches API responses (50 items, 1hr TTL, auto-cleanup)
- **FERPA Singleton** - Real-time PII scanner with regex patterns
- **Error Boundaries** - Graceful failure handling
- **Global Error Handlers** - Catches unhandled rejections

### **Security**

 XSS Protection - All HTML output sanitized with `_escapeHtml()`
CSP Compliant - No inline scripts, only external JS files
No eval() - Safe code execution
FERPA Checker - Blocks processing when PII detected

---

## Use Cases

### **For Students**

- Analyze complex assignment prompts
- Generate essay outlines and first drafts
- Improve writing tone and style
- Check grammar before submission
- Summarize research papers
- Translate foreign language sources

### **For Educators**

- Review student writing without privacy concerns
- Demonstrate AI-assisted writing safely
- Create example essays for class
- Proofread assignment descriptions
- Translate materials for ESL students

### **For Schools**

- FERPA-compliant AI tool for institutional adoption
- No cloud servers = no data breach risk
- Works offline (no internet dependency)
- Free and open source (MIT License)

---



---

## Troubleshooting

### **Extension Won't Load**

- Verify Chrome version: **128+**
- Check AI flags are enabled: `chrome://flags`
- Build completed successfully: `npm run build`
- Load `dist/` folder, not project root

### **Chrome AI Not Working**

- Enable all 5 flags in `chrome://flags`
- Restart Chrome completely
- Wait for model download (~2GB, 5-10 min)
- Check console: "Chrome AI Active" should show in sidebar

### **Demo Mode Always Showing**

This is normal if Chrome AI isn't enabled! Demo Mode provides simulated responses so you can test the UI without setting up Chrome AI.

To use real AI:
1. Follow "Chrome AI Setup" instructions above
2. Reload extension after enabling flags
3. Status banner should change from "Demo Mode" to "Chrome AI Active"

---

## License

**MIT License** - See [LICENSE](LICENSE) file for details.

This project is free and open source for educational use.



## Links

- **GitHub Repository**: [github.com/denyzabra/draftloom-extension](https://github.com/denyzabra/draftloom-extension)
- **Chrome AI Docs**: [developer.chrome.com/docs/ai/](https://developer.chrome.com/docs/ai/)
- **Report Issues**: [GitHub Issues](https://github.com/denyzabra/draftloom-extension/issues)

---

## Support

Questions? Issues? Suggestions?

- Open an [Issue](https://github.com/denyzabra/draftloom-extension/issues)
- Contact: denyzabrahams02@gmail.com


**Made with ❤️ for students, by developers who care about privacy.**

**100% on-device. 100% private. 100% yours.** 🎓
