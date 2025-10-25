# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DraftLoom is a FERPA-compliant Chrome extension providing AI-powered writing assistance for students and educators. All processing happens locally using Chrome's built-in AI APIs (Chrome 128+), ensuring sensitive student information never leaves the device.

## Build & Development Commands

### Building
```bash
npm run build          # Production build (minified, no source maps)
npm run build:dev      # Development build (with source maps)
npm run watch          # Development build with auto-rebuild on changes
npm run clean          # Remove dist folder
```

### Testing
```bash
npm test               # Run all tests once
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage report
```

To run a single test file:
```bash
npx jest tests/apis/apiManager.test.js
npx jest tests/utils/ferpa-checker.test.js
```

### Loading the Extension
1. Build: `npm run build` (creates `dist/` directory)
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked" → Select `dist/` folder

## Architecture

### Extension Structure (Multi-Entry Webpack Build)

The extension uses **3 separate webpack entry points** that build independent bundles:

1. **Background Service Worker** (`src/background/background.js` → `dist/background.js`)
   - Handles extension lifecycle (install, update)
   - Manages side panel opening via `chrome.action.onClicked`
   - Routes messages between content scripts and popup/sidebar
   - No direct access to Chrome AI APIs (runs in service worker context)

2. **Content Script** (`src/content/content-script.js` → `dist/content-script.js`)
   - Injected into all web pages (`<all_urls>`)
   - Can access and modify page DOM
   - Communicates with background script via `chrome.runtime.sendMessage`
   - No direct access to Chrome AI APIs

3. **Popup & Sidebar** (`src/popup/popup.js` + `src/sidebar/sidebar.js` → `dist/popup.js` + `dist/sidebar.js`)
   - Main UI components with direct access to Chrome AI APIs (window.ai)
   - Both use the same API layer (`src/apis/`)
   - HTML files (`public/popup.html`, `public/sidebar.html`) copied to dist via CopyPlugin

### Core API Layer (`src/apis/`)

**APIManager** (`apiManager.js`) is the central coordinator:
- Singleton instance that manages all Chrome AI API wrappers
- **Request queue system**: Serializes API calls with 100ms delays to prevent overwhelming the AI models
- Initialization: `await apiManager.initialize()` checks capabilities
- Queue usage: `apiManager.queueRequest(apiName, methodName, ...args)`

**Individual API Wrappers**:
- `capabilities.js` - Checks which Chrome AI APIs are available (`window.ai.languageModel`, `window.ai.summarizer`, etc.)
- `promptAPI.js` - Prompt analysis using `window.ai.languageModel.create()`
- `writerAPI.js` - Draft generation with tone control
- `rewriterAPI.js` - Text rewriting with tone/length adjustments
- `proofreaderAPI.js` - Grammar and spelling checks
- `summarizerAPI.js` - Text summarization
- `translatorAPI.js` - Multi-language translation
- `demoAPI.js` - Demo mode fallback with simulated responses when Chrome AI is unavailable

**Important**: Chrome AI APIs are only available in popup/sidebar contexts, NOT in background service worker or content scripts. When Chrome AI is unavailable, the extension automatically falls back to Demo Mode for testing the UI.

### FERPA Compliance System (`src/utils/ferpa-checker.js`)

Singleton service that scans text for PII (Personally Identifiable Information):
- **Critical violations** (blocks operation): SSN, student IDs, DOB, medical info, financial data
- **Warnings**: Email addresses, phone numbers, physical addresses
- Returns: `{ compliant: boolean, violations: [], score: 0-100, hasCriticalViolations: boolean }`
- `sanitize()` method redacts sensitive data with `[REDACTED-*]` placeholders
- Must be called BEFORE sending any student data to AI APIs

### Storage Layer (`src/storage/`)

**cache-store.js**:
- In-memory LRU cache (max 50 items, 1hr TTL)
- Caches API responses keyed by `apiName:JSON(params)`
- Auto-cleanup every 5 minutes via interval
- Used to avoid redundant AI API calls

**session-store.js**:
- Manages draft persistence using `chrome.storage.local`
- Stores user sessions, drafts, and history
- Survives browser restarts

### Utilities (`src/utils/`)

- `errorBoundary.js` - Error handling wrapper for API calls
- `performance.js` - Performance monitoring utilities
- `consent-manager.js` - Manages user consent for AI usage
- `logger.js` - Structured logging utility

## Chrome AI API Requirements

Users MUST enable these flags in `chrome://flags`:
- `#optimization-guide-on-device-model`
- `#prompt-api-for-gemini-nano`
- `#rewriter-api`
- `#summarization-api`
- `#translation-api`

After enabling, Chrome must be restarted. The on-device model (~2GB) downloads automatically on first use.

## Testing Setup

- **Environment**: jsdom (simulates browser DOM)
- **Setup file**: `tests/setup.js` (configures chrome.* globals)
- **Mocks**: CSS imports mocked in `tests/__mocks__/styleMock.js`
- **Coverage**: Configured to collect from `src/**/*.js`, excluding test files
- Tests use `@testing-library/dom` and `@testing-library/jest-dom`

## Important Implementation Notes

1. **API Initialization Order**: Always `await apiManager.initialize()` before using any AI APIs
2. **FERPA Checks**: Call `ferpaChecker.verifyCompliance(text)` before processing any user input
3. **Request Queueing**: Use `apiManager.queueRequest()` instead of calling APIs directly to prevent race conditions
4. **Context Awareness**: Chrome AI APIs (window.ai) only work in popup/sidebar, not background worker
5. **Error Handling**: All API calls should be wrapped in try-catch with errorBoundary
6. **Cache Keys**: Use `cacheStore.getCacheKey(apiName, params)` for consistent cache key generation
7. **Cleanup**: Call `apiManager.cleanup()` when destroying sessions to free resources

## Manifest V3 Details

- Uses service worker for background script (not persistent background page)
- Side panel API (`chrome.sidePanel`) requires Chrome 114+
- Content Security Policy allows only `generativelanguage.googleapis.com` for optional Gemini API fallback
- Permissions: storage, activeTab, scripting, sidePanel (no host_permissions by default)
