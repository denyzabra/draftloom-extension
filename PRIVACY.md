# DraftLoom Privacy Policy

**Last Updated:** 2024

## Overview

DraftLoom is designed with privacy as a core principle. This document explains how we handle your data.

## Data Collection

### What We Collect

1. **Local Drafts and Sessions**
   - Essay drafts you create
   - Session information (timestamps, usage patterns)
   - User preferences and settings

2. **NO Collection of:**
   - Personal identifying information (unless YOU include it in your text)
   - Browsing history
   - Activity on other websites
   - Analytics or tracking data

### Where Your Data Goes

#### Chrome Built-in AI (Default Mode)
- **Processing Location:** Your device only
- **Data Transmission:** NONE - everything stays on your computer
- **Storage:** Local Chrome storage only
- **Privacy Level:** Maximum

#### Google Gemini API (Optional Fallback)
- **Processing Location:** Google's servers
- **Data Transmission:** Your text is sent to Google for processing
- **Storage:** According to Google's API terms
- **Privacy Level:** Depends on Google's privacy policy
- **User Consent:** Required before use

⚠️ **IMPORTANT:** If you use Gemini API fallback, your content is sent to Google's servers. This may not be FERPA-compliant depending on your use case.

## FERPA Compliance

### What We Check For

Before processing any text, we scan for:
- Social Security Numbers
- Student ID numbers
- Email addresses
- Phone numbers
- Dates of birth
- Physical addresses
- Medical/disability information
- Financial information

### How We Protect You

1. **Automatic Scanning:** All inputs are checked before AI processing
2. **Blocking:** Content with critical PII violations is rejected
3. **Warnings:** You're notified if sensitive information is detected
4. **Sanitization:** Option to redact sensitive information

### Compliance Score

- Content must score **90/100 or higher** to be processed
- **NO critical violations** are allowed (SSN, Student ID, Medical info)
- Warning-level violations (email, phone) are flagged but may be allowed

## Data Retention

### Automatic Cleanup
- Drafts older than **30 days** are automatically deleted
- Cache expires after **1 hour**
- Old sessions are cleaned periodically

### Manual Control
You can:
- Delete individual drafts anytime
- Clear all data in Settings
- Revoke consent and delete all data
- Export your data before deletion

## Data Storage

### What's Stored Locally

Stored in Chrome's local storage (encrypted by browser):
- Your draft essays
- Session information
- User preferences
- Gemini API key (if configured)

### Security Measures

1. **Chrome Storage Encryption:** Managed by Chrome browser
2. **No External Servers:** Data never leaves your device (unless using Gemini API)
3. **Automatic Expiration:** Old data is automatically removed
4. **FERPA Scanning:** PII is blocked before processing

## Third-Party Services

### Google Gemini API (Optional)

**Used Only If:**
- Chrome Built-in AI is unavailable
- You explicitly configure an API key
- You consent to data transmission

**What They Receive:**
- Your essay text
- AI generation prompts

**What They Don't Receive:**
- Your name
- Your email
- Your location
- Any other browsing data

**Their Privacy Policy:** https://policies.google.com/privacy

## Your Rights

### You Can:

1. **Access Your Data**
   - View all stored drafts in Settings
   - Export your data
   - See what information is stored

2. **Delete Your Data**
   - Delete individual drafts
   - Clear all data at once
   - Uninstall extension (removes all data)

3. **Control Processing**
   - Choose which AI mode to use
   - Opt out of Gemini API
   - Disable specific features

4. **Revoke Consent**
   - Withdraw consent anytime
   - Automatic data deletion upon revocation

## Consent

### First Use

When you first use DraftLoom, you'll be asked to consent to:
- **Local data processing** (required for basic functionality)
- **Local storage** (saving your drafts)
- **Optional: Gemini API** (if you want to use it as fallback)

### Withdrawing Consent

1. Open extension Settings
2. Click "Revoke Consent"
3. Choose whether to delete all data
4. Confirm your choice

## Children's Privacy

DraftLoom is intended for educational use. If you're under 13 (or under 16 in the EU), please ensure you have parental permission before using this extension.

## Data Breaches

### Security Measures
- All data stored locally in Chrome's encrypted storage
- No external database to breach
- No user accounts or passwords
- FERPA scanning prevents PII from being processed

### In Case of Issues
If you suspect any security issues, please report them to the GitHub repository issues page.

## Changes to This Policy

We may update this privacy policy from time to time. We will notify users of any material changes by:
- Updating the "Last Updated" date
- Showing a notification in the extension
- Requiring re-consent for significant changes

## Compliance

### Standards We Follow

- **FERPA** (Family Educational Rights and Privacy Act)
- **GDPR** (General Data Protection Regulation) - EU users
- **COPPA** (Children's Online Privacy Protection Act)
- **Chrome Extension Privacy Best Practices**

### Our Commitments

1. ✅ **Data Minimization:** We only collect what's necessary
2. ✅ **Purpose Limitation:** Data is only used for AI writing assistance
3. ✅ **Storage Limitation:** Automatic 30-day deletion
4. ✅ **Transparency:** This policy explains everything clearly
5. ✅ **User Control:** You can access, modify, and delete your data
6. ✅ **Security:** Encrypted storage and FERPA scanning

## Contact

For privacy concerns or questions:
- **GitHub Issues:** https://github.com/denyzabra/draftloom-extension/issues
- **Repository:** https://github.com/denyzabra/draftloom-extension

## Technical Details

### Data Flow Diagram

```
User Input
    ↓
FERPA Check (Local)
    ↓
[If Compliant]
    ↓
Chrome AI (Local) OR Gemini API (Remote)
    ↓
Result Display
    ↓
Optional: Save to Local Storage
    ↓
Auto-Delete after 30 days
```

### Storage Locations

| Data Type | Location | Encryption | Retention |
|-----------|----------|------------|-----------|
| Drafts | chrome.storage.local | Browser-level | 30 days |
| Sessions | chrome.storage.local | Browser-level | Until cleared |
| API Keys | chrome.storage.local | Browser-level | Until removed |
| Cache | In-memory | N/A | 1 hour |

### Permissions Explained

- **storage:** Store your drafts locally
- **activeTab:** Access current page (for "Analyze Page" feature only)
- **scripting:** Inject content scripts for page analysis
- **sidePanel:** Display the extension sidebar

We do NOT request:
- ❌ Access to all websites
- ❌ Network requests (except Gemini API if you configure it)
- ❌ Cookies
- ❌ Browsing history
- ❌ Personal information

## Open Source

DraftLoom is open source. You can:
- Review the code: https://github.com/denyzabra/draftloom-extension
- Verify our privacy claims
- Report issues
- Contribute improvements

## Disclaimer

While we implement strong FERPA compliance checking, we cannot guarantee 100% detection of all sensitive information. Users should:
- Review their content before submission
- Avoid including unnecessary personal information
- Use the sanitization feature when in doubt
- Understand the risks of using cloud AI services (Gemini API)

---

**By using DraftLoom, you acknowledge that you have read and understood this Privacy Policy.**
