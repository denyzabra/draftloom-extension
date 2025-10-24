# Changelog

All notable changes to DraftLoom will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024 (Security & Bug Fix Release)

### 🔒 Security Fixes

#### Critical

- **API Key Exposure Fix** - Moved Gemini API key from URL query parameters to HTTP headers
  - **Risk:** API keys in URLs are logged in browser history and server logs
  - **Fix:** Use `x-goog-api-key` header instead of query parameter
  - **Files:** `src/apis/geminiAPI.js:67-78`

- **FERPA Compliance Strengthening** - Tightened compliance rules
  - **Risk:** Content with score 80-89 could pass with violations
  - **Fix:** Require score >= 90 AND zero critical violations
  - **Files:** `src/utils/ferpa-checker.js:95-103`

- **Input Sanitization** - Added protection against prompt injection
  - **Risk:** Malicious users could manipulate AI behavior
  - **Fix:** Sanitize all inputs before processing
  - **Files:** `src/apis/geminiAPI.js:386-397`

#### High

- **API Key Validation** - Added format validation for API keys
  - **Risk:** Invalid keys could be stored and processed
  - **Fix:** Validate against Google API key format (`AIza...`)
  - **Files:** `src/apis/geminiAPI.js:354-358`

- **SSN Detection Improvement** - Fixed false positive issues
  - **Risk:** Pattern `\d{9}` matched phone numbers, ZIP codes, etc.
  - **Fix:** Require specific SSN formatting (###-##-####)
  - **Files:** `src/utils/ferpa-checker.js:11`

#### Medium

- **Rate Limiting** - Added API call rate limiting
  - **Risk:** Unlimited API calls could exhaust quota
  - **Fix:** 15 requests per minute limit
  - **Files:** `src/apis/geminiAPI.js:14-18, 364-380`

- **Input Length Validation** - Added maximum input size
  - **Risk:** Very large inputs cause high costs
  - **Fix:** 30,000 character maximum
  - **Files:** `src/apis/geminiAPI.js:403-409`

- **Content Security Policy** - Enhanced CSP directives
  - **Risk:** Missing directives allowed arbitrary connections
  - **Fix:** Comprehensive CSP with specific allowlist
  - **Files:** `public/manifest.json:38-40`

- **Race Condition Fix** - Fixed request queue concurrency
  - **Risk:** Simultaneous requests could corrupt queue
  - **Fix:** Proper locking with try-finally block
  - **Files:** `src/apis/apiManager.js:82-119`

- **Memory Leak Fix** - Fixed cache expiration cleanup
  - **Risk:** Expired items accumulated indefinitely
  - **Fix:** Periodic cleanup every 5 minutes
  - **Files:** `src/storage/cache-store.js:48-75`

- **Error Handling** - Improved Gemini API error responses
  - **Risk:** Non-JSON errors crashed the app
  - **Fix:** Try-catch around error JSON parsing
  - **Files:** `src/apis/geminiAPI.js:95-105`

### 🐛 Bug Fixes

- **Deprecated Method** - Replaced `substr()` with `slice()`
  - **Issue:** `substr()` is deprecated in modern JavaScript
  - **Fix:** Use `slice(2, 11)` instead
  - **Files:** `src/storage/session-store.js:130`

- **Typo Fix** - Fixed typo in `.env.example`
  - **Issue:** "setings" should be "settings"
  - **Fix:** Corrected spelling
  - **Files:** `.env.example:5`

- **Unused Parameters** - Removed unused function parameters
  - **Issue:** Linter warnings for unused variables
  - **Fix:** Prefix with underscore or remove
  - **Files:** `src/background/background.js:22, 45`

### ✨ New Features

- **Data Retention Policy** - Automatic cleanup of old data
  - Drafts older than 30 days are automatically deleted
  - Runs on startup and every 24 hours
  - **Files:** `src/storage/session-store.js:146-199`

- **Consent Management** - User consent tracking system
  - Consent required before data processing
  - Separate consent for Gemini API usage
  - Revocation clears all data
  - **Files:** `src/utils/consent-manager.js`

- **Logging Utility** - Production-safe logging
  - Conditional logging based on environment
  - Debug mode can be enabled/disabled
  - Prevents sensitive data logging
  - **Files:** `src/utils/logger.js`

- **Cleanup on Uninstall** - Data deletion on extension removal
  - Sets flag for cleanup on next startup
  - Attempts to clear all stored data
  - **Files:** `src/background/background.js:21-32`

### 📚 Documentation

- **Security Documentation** - Comprehensive security guide
  - All security improvements documented
  - Vulnerability reporting process
  - Security best practices
  - **Files:** `SECURITY.md`

- **Privacy Policy** - Detailed privacy documentation
  - Data collection disclosure
  - FERPA compliance explanation
  - User rights and controls
  - **Files:** `PRIVACY.md`

- **Test Coverage** - Comprehensive FERPA checker tests
  - 100+ test cases covering all scenarios
  - Edge cases and real-world scenarios
  - Critical security component fully tested
  - **Files:** `tests/utils/ferpa-checker.test.js`

### 🔧 Developer Experience

- **Security Scripts** - Added security-focused npm scripts
  - `npm run audit` - Check for dependency vulnerabilities
  - `npm run audit:fix` - Auto-fix vulnerabilities
  - `npm run security-check` - Full security audit with tests
  - **Files:** `package.json:13-16`

- **Code Quality** - Improved code organization
  - Better error handling patterns
  - Proper async/await usage
  - Reduced console.log usage

### 🔄 Changes

- **FERPA Scoring** - Changed compliance threshold from 80 to 90
- **API Error Messages** - More descriptive error messages
- **Cache Behavior** - Active cleanup instead of passive expiration

### 📦 Dependencies

No changes to runtime dependencies (still zero runtime dependencies).

### ⚠️ Breaking Changes

**FERPA Compliance:**
- Content that previously scored 80-89 may now be rejected
- Critical violations now always block processing (previously could pass with high score)

**Behavior Changes:**
- Users must grant consent on first use
- Data older than 30 days is automatically deleted
- Rate limits may affect rapid successive requests

### 🔐 Security Notices

**For Users:**
1. Existing Gemini API keys are secure but recommend rotation
2. Review your stored drafts - old ones will be auto-deleted
3. Grant consent in Settings to continue using the extension

**For Developers:**
1. Run `npm audit` and `npm run test` before committing
2. Do not commit API keys or sensitive data
3. Use the new logger utility instead of console.log

### 📈 Testing

- Added 100+ FERPA checker test cases
- All critical security features have test coverage
- Test coverage target: >80%

### 🎯 Future Improvements

Planned for v1.2.0:
- [ ] End-to-end encryption for stored drafts
- [ ] User data export functionality
- [ ] Advanced FERPA pattern matching
- [ ] Telemetry (opt-in) for error tracking
- [ ] Multi-language FERPA support

---

## [1.0.0] - 2024 (Initial Release)

### ✨ Features

- Chrome Built-in AI integration
- 6 AI-powered writing tools:
  - Brainstorm & Analyze Prompts
  - Draft Generation
  - Smart Rewriting
  - Proofreading
  - Summarization
  - Translation
- FERPA compliance checking
- Google Gemini API fallback
- Demo mode for testing
- Local data storage
- Response caching
- Session management

### 🏗️ Architecture

- Manifest V3 Chrome extension
- Webpack build system
- Jest testing framework
- Modular API design
- Separate content/background/sidebar scripts

### 📝 Documentation

- README.md with setup instructions
- SETUP_CHROME_AI.md for Chrome AI configuration
- Code comments and JSDoc

---

## Legend

- 🔒 Security fixes
- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation
- 🔧 Developer experience
- 🔄 Changes
- 📦 Dependencies
- ⚠️ Breaking changes
- ���� Security notices
- 📈 Testing
- 🎯 Future improvements
- 🏗️ Architecture

---

**Note:** This changelog is maintained to help users and developers understand changes between versions. For security vulnerabilities, see SECURITY.md.
