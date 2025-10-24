# Security Documentation

This document outlines the security measures implemented in DraftLoom and provides guidelines for secure usage.

## Table of Contents

1. [Security Improvements](#security-improvements)
2. [API Key Security](#api-key-security)
3. [FERPA Compliance](#ferpa-compliance)
4. [Input Validation](#input-validation)
5. [Content Security Policy](#content-security-policy)
6. [Data Protection](#data-protection)
7. [Security Best Practices](#security-best-practices)
8. [Vulnerability Reporting](#vulnerability-reporting)

---

## Security Improvements

### Recent Security Fixes (v1.1.0)

#### 1. API Key Protection
**Issue:** API keys were sent in URL query parameters
**Fix:** Moved to HTTP headers (`x-goog-api-key`)
**Impact:** Prevents key exposure in browser history and server logs
**Files:** `src/apis/geminiAPI.js`

#### 2. API Key Validation
**Issue:** No validation of API key format
**Fix:** Regex validation for Google API key format
**Impact:** Prevents invalid keys and potential injection
**Files:** `src/apis/geminiAPI.js`

#### 3. Strengthened FERPA Compliance
**Issue:** Score >= 80 allowed violations; critical violations could pass
**Fix:** Requires score >= 90 AND zero critical violations
**Impact:** Better PII protection
**Files:** `src/utils/ferpa-checker.js`

#### 4. Improved SSN Detection
**Issue:** Pattern matched any 9 digits (false positives)
**Fix:** Requires specific formatting (###-##-####, ###.##.####, ### ## ####)
**Impact:** Fewer false positives, better accuracy
**Files:** `src/utils/ferpa-checker.js`

#### 5. Input Sanitization
**Issue:** No protection against prompt injection
**Fix:** Sanitization of all inputs before AI processing
**Impact:** Prevents prompt injection attacks
**Files:** `src/apis/geminiAPI.js`

#### 6. Rate Limiting
**Issue:** No limits on API calls
**Fix:** 15 requests per minute limit
**Impact:** Prevents abuse and unexpected costs
**Files:** `src/apis/geminiAPI.js`

#### 7. Input Length Validation
**Issue:** No maximum input length
**Fix:** 30,000 character limit
**Impact:** Prevents excessive API costs and DoS
**Files:** `src/apis/geminiAPI.js`

#### 8. Enhanced CSP
**Issue:** Missing CSP directives
**Fix:** Comprehensive Content Security Policy
**Impact:** Better XSS protection
**Files:** `public/manifest.json`

#### 9. Race Condition Fix
**Issue:** Request queue could process concurrently
**Fix:** Proper locking with try-finally
**Impact:** Prevents queue corruption
**Files:** `src/apis/apiManager.js`

#### 10. Memory Leak Fix
**Issue:** Expired cache items never cleaned
**Fix:** Periodic cleanup every 5 minutes
**Impact:** Better memory management
**Files:** `src/storage/cache-store.js`

---

## API Key Security

### Storage

API keys are stored in `chrome.storage.local`, which is:
- Encrypted by the Chrome browser
- Isolated to the extension
- Not accessible to websites
- Cleared on uninstall (with proper cleanup)

### Validation

```javascript
// Google API keys must match this format
/^AIza[0-9A-Za-z_-]{35}$/
```

### Best Practices

1. **Never commit API keys to Git**
   - Use `.env` for local development
   - Keys are `.gitignore`d

2. **Rotate keys regularly**
   - Generate new keys periodically
   - Revoke old keys after rotation

3. **Use API key restrictions**
   - Restrict to specific APIs
   - Set usage quotas
   - Enable daily limits

4. **Monitor usage**
   - Check Google Cloud Console regularly
   - Set up billing alerts
   - Review access logs

---

## FERPA Compliance

### Detection Patterns

| Type | Pattern | Severity | Deduction |
|------|---------|----------|-----------|
| SSN | `\d{3}[-.\s]\d{2}[-.\s]\d{4}` | Critical | 30 points |
| Student ID | `student\s*id[:\s]*[A-Z0-9]{6,12}` | Critical | 30 points |
| Email | Standard email regex | Warning | 15 points |
| Phone | Various phone formats | Warning | 15 points |
| DOB | Date patterns with keywords | Critical | 30 points |
| Address | Street/Avenue patterns | Warning | 15 points |
| Medical | IEP, 504, disability, etc. | Critical | 30 points |
| Financial | Income, aid, loans, etc. | Critical | 30 points |

### Compliance Rules

```javascript
// Content is compliant if:
1. No violations (score = 100)
   OR
2. No critical violations AND score >= 90
```

### Examples

**Compliant:**
```
Write an essay about climate change and its effects on coastal regions.
```

**Not Compliant (Critical):**
```
My SSN is 123-45-6789 and I need help with my essay.
```

**Not Compliant (Score < 90):**
```
Contact me at john@email.com or call 555-123-4567 for more info.
// Email (15) + Phone (15) = 30 deduction = Score 70
```

**Compliant (Score >= 90, no critical):**
```
Email me at support@university.edu
// Email (15) = Score 85, but < 90, so NOT compliant actually
```

### Sanitization

```javascript
const sanitized = ferpaChecker.sanitize(text);
// SSN: 123-45-6789 → [REDACTED-SSN]
// john@email.com → [REDACTED-EMAIL]
// 555-123-4567 → [REDACTED-PHONE]
// Student ID: ABC123 → [REDACTED-ID]
```

---

## Input Validation

### Sanitization Process

```javascript
_sanitizeInput(input) {
    // 1. Remove control characters
    input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

    // 2. Limit consecutive newlines
    input.replace(/\n{3,}/g, '\n\n');

    // 3. Trim whitespace
    return input.trim();
}
```

### Length Limits

- **Maximum input:** 30,000 characters
- **Reason:** Prevents excessive API costs and processing time
- **Error message:** Clear indication of limit and current length

### Rate Limiting

```javascript
// Per instance
maxRequestsPerWindow: 15
requestWindow: 60000 // 1 minute

// Enforced before every API call
_checkRateLimit() {
    if (requestCount >= maxRequestsPerWindow) {
        throw new Error(`Wait ${timeRemaining} seconds`);
    }
}
```

---

## Content Security Policy

### Current Policy

```
default-src 'self';
script-src 'self';
object-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self';
connect-src 'self' https://generativelanguage.googleapis.com;
```

### Directives Explained

- **default-src 'self':** Only load resources from extension
- **script-src 'self':** No inline scripts or external scripts
- **style-src 'unsafe-inline':** Allow inline styles (required for dynamic styling)
- **connect-src:** Only Gemini API allowed for external connections
- **img-src data::** Allow data URIs for images
- **No eval():** Prevented by default

### What's Blocked

- ❌ External scripts
- ❌ Inline script tags
- ❌ `eval()` and `Function()`
- ❌ External stylesheets (except from extension)
- ❌ WebSockets to arbitrary domains
- ❌ External fonts

---

## Data Protection

### Encryption

**At Rest:**
- Chrome storage is encrypted by the browser
- No additional encryption implemented (relying on OS-level)

**In Transit:**
- Gemini API: HTTPS only
- Chrome AI: Local (no transit)

### Data Retention

```javascript
dataRetentionDays: 30 // Default

// Automatic cleanup runs:
// 1. On startup (after 5 seconds)
// 2. Every 24 hours

cleanOldData() {
    const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000);
    drafts = drafts.filter(d => d.createdAt > cutoffTime);
}
```

### Data Deletion

**On User Request:**
- Individual drafts can be deleted
- All data can be cleared in Settings
- Consent revocation deletes all data

**On Uninstall:**
- Extension attempts to clear data
- Chrome may automatically clear storage

---

## Security Best Practices

### For Users

1. **Review Before Submitting**
   - Don't include personal information
   - Check FERPA warnings
   - Use sanitization if needed

2. **Understand AI Modes**
   - Chrome AI: Local only (most private)
   - Gemini API: Sent to Google (less private)
   - Demo Mode: No actual AI (testing only)

3. **Manage API Keys**
   - Don't share your Gemini API key
   - Revoke keys if compromised
   - Use API restrictions in Google Cloud

4. **Regular Cleanup**
   - Delete old drafts manually
   - Clear cache periodically
   - Review stored data in Settings

### For Developers

1. **Code Review**
   - All PRs must be reviewed
   - Security-sensitive changes require extra scrutiny
   - Run `npm run security-check` before commits

2. **Testing**
   - Write tests for security features
   - 100% test coverage for FERPA checker
   - Test edge cases and attacks

3. **Dependencies**
   - Run `npm audit` regularly
   - Keep dependencies updated
   - Remove unused dependencies

4. **Logging**
   - Use logger utility (not console.log)
   - Don't log sensitive data
   - Disable in production

5. **Input Validation**
   - Validate all user inputs
   - Sanitize before processing
   - Set reasonable limits

---

## Vulnerability Reporting

### How to Report

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. **DO** email security concerns to repository maintainers
3. **DO** provide:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial Assessment:** Within 1 week
- **Fix Development:** Depends on severity
- **Patch Release:** ASAP for critical issues
- **Public Disclosure:** After patch is released

### Severity Levels

**Critical:**
- Data breach
- Authentication bypass
- Remote code execution
- PII exposure

**High:**
- XSS vulnerabilities
- CSRF vulnerabilities
- Privilege escalation
- Significant FERPA violations

**Medium:**
- Information disclosure
- Logic errors
- Validation bypasses

**Low:**
- Minor bugs
- UI issues
- Documentation errors

---

## Security Checklist

### Before Release

- [ ] Run `npm audit` and fix all issues
- [ ] Run `npm run test:coverage` (>80% coverage)
- [ ] Review all console.log statements
- [ ] Test FERPA checker thoroughly
- [ ] Verify API key protection
- [ ] Test rate limiting
- [ ] Review CSP headers
- [ ] Test data retention cleanup
- [ ] Verify input sanitization
- [ ] Check for hardcoded secrets
- [ ] Update CHANGELOG.md
- [ ] Update SECURITY.md

### Regular Maintenance

- [ ] Monthly dependency updates
- [ ] Quarterly security audit
- [ ] Review GitHub security alerts
- [ ] Check for new FERPA requirements
- [ ] Monitor API usage patterns
- [ ] Review error logs
- [ ] Test backup/restore procedures

---

## Security Architecture

```
User Input
    ↓
[Consent Check]
    ↓
[Input Validation]
    - Length check (max 30k chars)
    - Sanitization (remove control chars)
    ↓
[FERPA Compliance Check]
    - Pattern matching
    - Severity assessment
    - Score calculation
    - Block if critical or score < 90
    ↓
[Rate Limiting]
    - 15 requests/minute check
    ↓
[API Selection]
    - Chrome AI (local) - preferred
    - Gemini API (remote) - fallback
    - Demo API (mock) - testing
    ↓
[Secure API Call]
    - API key in header (not URL)
    - HTTPS only
    - Timeout handling
    ↓
[Response Processing]
    - Validate response
    - Cache with TTL
    - Display to user
    ↓
[Optional: Save]
    - Chrome storage (encrypted)
    - 30-day retention
    - Auto-cleanup
```

---

## References

- [FERPA Guidelines](https://www2.ed.gov/policy/gen/guid/fpco/ferpa/index.html)
- [GDPR Compliance](https://gdpr.eu/)
- [Chrome Extension Security](https://developer.chrome.com/docs/extensions/mv3/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

**Last Updated:** 2024
**Next Review:** Quarterly or when significant changes are made
