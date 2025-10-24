# Quick Start Guide - Post-Security-Update

Welcome to DraftLoom v1.1.0! This guide helps you get started after the security improvements.

---

## 🚀 Getting Started

### 1. Build the Extension

```bash
# Install dependencies (if not already done)
npm install

# Build for production
npm run build

# Or build for development
npm run build:dev
```

### 2. Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist/` folder

### 3. Grant Consent

On first use, you'll be asked to consent to:
- ✅ Local data storage (required)
- ✅ AI processing (required)
- ⚠️ Gemini API usage (optional, only if you configure it)

---

## 🔧 Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run FERPA tests specifically
npm test -- tests/utils/ferpa-checker.test.js
```

**Expected Result:** 55/55 tests passing ✅

---

## 🔒 Security Features

### FERPA Compliance Checker

The extension now automatically checks for sensitive information:

**Blocked Content:**
- Social Security Numbers (123-45-6789)
- Student IDs
- Medical/disability information
- Financial information

**Warning Content:**
- Email addresses
- Phone numbers
- Physical addresses

**Compliance Rules:**
- Score must be ≥ 90/100
- Zero critical violations allowed

### Example

```javascript
// ❌ BLOCKED (Critical violation)
"My SSN is 123-45-6789"

// ⚠️ WARNING (Score 85, but no critical)
"Email me at john@email.com"

// ✅ ALLOWED
"Write an essay about climate change"
```

---

## 🛠️ Development

### Available Scripts

```bash
npm test              # Run tests
npm run build         # Production build
npm run build:dev     # Development build
npm run watch         # Auto-rebuild on changes
npm run clean         # Remove dist folder
npm run audit         # Check for vulnerabilities
npm run security-check # Full security audit + tests
npm run lint          # Run ESLint
```

### Debug Mode

Enable debug logging:

```javascript
// In browser console
chrome.storage.local.set({ debugMode: true });
```

Disable debug logging:

```javascript
chrome.storage.local.set({ debugMode: false });
```

---

## 🔑 API Key Setup (Optional)

If Chrome Built-in AI is unavailable, you can use Google Gemini API:

### 1. Get an API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key (format: `AIza...`)

### 2. Configure in Extension

1. Open DraftLoom sidebar
2. Go to Settings tab
3. Paste API key
4. Click "Save"

### 3. Security Recommendations

- ✅ Use API restrictions in Google Cloud Console
- ✅ Set usage quotas
- ✅ Enable billing alerts
- ✅ Rotate keys regularly
- ❌ Never commit keys to Git

---

## 📊 Data Management

### Automatic Cleanup

- **Retention Period:** 30 days
- **Cleanup Frequency:** Daily
- **What's Deleted:** Drafts older than 30 days

### Manual Cleanup

1. Open Settings tab
2. Click "Clear All Data"
3. Confirm deletion

### Export Data (Coming Soon)

Currently, you can copy drafts manually. Auto-export feature planned for v1.2.0.

---

## 🔍 Troubleshooting

### Issue: "Rate limit exceeded"

**Cause:** More than 15 requests per minute
**Solution:** Wait 60 seconds and try again

### Issue: "FERPA violation detected"

**Cause:** Content contains sensitive information
**Solution:**
1. Review the violations shown
2. Remove sensitive data
3. Or use the sanitization feature

### Issue: "Input too long"

**Cause:** Input exceeds 30,000 characters
**Solution:** Split content into smaller sections

### Issue: "API key invalid"

**Cause:** Gemini API key format incorrect
**Solution:**
- Verify key starts with `AIza`
- Verify key is 39 characters
- Get a new key if corrupted

### Issue: Tests failing

**Cause:** Dependencies or environment issue
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm test
```

---

## 📖 Documentation

### Core Documentation

- **SECURITY.md** - Security features and best practices
- **PRIVACY.md** - Privacy policy and data handling
- **CHANGELOG.md** - Version history and changes
- **FIXES_SUMMARY.md** - Detailed list of all fixes
- **REVIEW_COMPLETE.md** - Complete review report

### For Developers

- **README.md** - Project overview
- **SETUP_CHROME_AI.md** - Chrome AI setup guide
- **CONTRIBUTING.md** - Contribution guidelines (if exists)

---

## ⚠️ Important Changes in v1.1.0

### Stricter FERPA Checks

**Before:** Score ≥ 80 allowed
**After:** Score ≥ 90 required + zero critical violations

**Impact:** Some previously-passing content may now be blocked

### Rate Limiting

**New:** 15 requests per minute limit
**Impact:** Very rapid requests may be throttled

### Consent Required

**New:** First-time users must grant consent
**Impact:** One-time setup step

### Data Retention

**New:** 30-day automatic cleanup
**Impact:** Old drafts will be deleted automatically

---

## 🎯 Best Practices

### For Users

1. **Review Before Submitting**
   - Check for personal information
   - Review FERPA warnings
   - Use sanitization when needed

2. **Understand AI Modes**
   - Chrome AI: Most private (local only)
   - Gemini API: Less private (sent to Google)
   - Demo Mode: For testing only

3. **Manage Data**
   - Delete old drafts regularly
   - Clear cache periodically
   - Review stored data

### For Developers

1. **Security First**
   - Run `npm run security-check` before commits
   - Never commit API keys
   - Use logger utility (not console.log)
   - Write tests for new features

2. **Code Quality**
   - Follow existing patterns
   - Add JSDoc comments
   - Handle errors properly
   - Test edge cases

3. **Testing**
   - Write tests for security features
   - Test FERPA compliance
   - Test error scenarios
   - Verify builds before push

---

## 📞 Support

### For Issues

- **Bug Reports:** [GitHub Issues](https://github.com/denyzabra/draftloom-extension/issues)
- **Security:** See SECURITY.md for reporting
- **Privacy:** See PRIVACY.md for concerns

### For Questions

- **Documentation:** Check SECURITY.md, PRIVACY.md, README.md
- **Community:** GitHub Discussions (if enabled)
- **Contact:** GitHub Issues

---

## 🔄 Updating

### From v1.0.0 to v1.1.0

1. **Backup** (optional but recommended)
   ```bash
   # Export your drafts manually
   # No auto-export yet (coming in v1.2.0)
   ```

2. **Update**
   ```bash
   git pull origin master
   npm install
   npm run build
   ```

3. **Reload Extension**
   - Go to `chrome://extensions/`
   - Click reload button on DraftLoom
   - Grant consent when prompted

4. **Verify**
   ```bash
   npm test
   ```

---

## 🎉 What's New

### Security Improvements

✅ API keys now in headers (not URLs)
✅ Input sanitization (prevents prompt injection)
✅ Rate limiting (15 req/min)
✅ Enhanced FERPA (score ≥ 90, zero critical)
✅ Better SSN detection (fewer false positives)

### New Features

✅ Data retention policy (30 days)
✅ Consent management
✅ Secure logging utility
✅ Cleanup on uninstall

### Testing

✅ 55 new FERPA security tests
✅ 100% FERPA checker coverage

### Documentation

✅ SECURITY.md
✅ PRIVACY.md
✅ CHANGELOG.md
✅ 2000+ lines total

---

## 📈 Next Release (v1.2.0 Planned)

- [ ] Data export functionality
- [ ] End-to-end encryption
- [ ] Multi-language FERPA support
- [ ] Advanced pattern matching
- [ ] Telemetry (opt-in)

---

## ✅ Checklist

Before you start developing:
- [ ] Run `npm install`
- [ ] Run `npm test` (should pass 55/55)
- [ ] Run `npm run build` (should succeed)
- [ ] Load extension in Chrome
- [ ] Grant consent
- [ ] Test basic features
- [ ] Read SECURITY.md
- [ ] Read PRIVACY.md

---

**You're all set! Happy coding! 🚀**

For detailed information, see:
- Full review: REVIEW_COMPLETE.md
- Security details: SECURITY.md
- Privacy info: PRIVACY.md
- All fixes: FIXES_SUMMARY.md
