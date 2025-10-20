# Chrome AI APIs Setup Guide

DraftLoom requires Chrome's experimental AI APIs to function. Follow this guide to enable them.

## Requirements

- **Chrome 127+** (Chrome Canary or Dev recommended)
- **Windows, macOS, or Linux**
- **At least 4GB free disk space** (for AI models)

## Step-by-Step Setup

### 1. Install Chrome Canary or Dev

Download and install one of these Chrome versions:

- [Chrome Canary](https://www.google.com/chrome/canary/) (Recommended)
- [Chrome Dev](https://www.google.com/chrome/dev/)

> **Note**: You can run Chrome Canary alongside your regular Chrome installation.

### 2. Enable AI Feature Flags

1. Open Chrome and navigate to: `chrome://flags/`

2. Search for and enable the following flags:

   | Flag Name | Setting |
   |-----------|---------|
   | `#optimization-guide-on-device-model` | **Enabled BypassPerfRequirement** |
   | `#prompt-api-for-gemini-nano` | **Enabled** |
   | `#summarization-api-for-gemini-nano` | **Enabled** |
   | `#rewriter-api` | **Enabled** |
   | `#writer-api` | **Enabled** |
   | `#translation-api` | **Enabled** |

3. Click **"Relaunch"** to restart Chrome

### 3. Wait for Model Download

After restarting Chrome:

1. The AI models will download automatically in the background
2. This may take **5-15 minutes** depending on your connection
3. You can check download progress in Chrome's DevTools console

To verify the models are ready:
- Open DevTools (F12)
- Go to Console tab
- Type: `await window.ai.languageModel.capabilities()`
- If it returns an object, the API is ready!

### 4. Load the Extension

1. Navigate to: `chrome://extensions/`
2. Enable **"Developer mode"** (top right toggle)
3. Click **"Load unpacked"**
4. Select the `dist` folder from the DraftLoom project
5. The extension should load without errors

### 5. Test the Extension

1. Click the DraftLoom icon in the Chrome toolbar
2. Click **"Open Writing Assistant"**
3. You should see a success message: "✅ All AI features ready (6/6 APIs available)"
4. Try the different features:
   - **Brainstorm**: Analyze assignment prompts
   - **Draft**: Generate essay drafts
   - **Rewrite**: Adjust tone and length
   - **Proofread**: Check grammar and spelling

## Troubleshooting

### APIs Not Available

If you see "0/6 APIs available":
- ✅ Verify all flags are enabled at `chrome://flags/`
- ✅ Restart Chrome completely
- ✅ Wait 5-10 minutes for model download
- ✅ Check Chrome version is 127+

### Some APIs Missing

If you see "3/6 APIs available":
- Some flags might not be enabled
- Go back to `chrome://flags/` and verify all 6 flags
- Restart Chrome

### Model Download Stuck

If models aren't downloading:
1. Check your internet connection
2. Try restarting Chrome
3. Clear Chrome cache: `chrome://settings/clearBrowserData`
4. Re-enable the flags

### Extension Errors

If the extension shows errors:
1. Reload the extension at `chrome://extensions/`
2. Check the Console (F12) for specific errors
3. Verify the `dist` folder contains all built files

## API Availability by Feature

| Feature | Required API | Flag |
|---------|-------------|------|
| Brainstorm/Analyze | Prompt API | `#prompt-api-for-gemini-nano` |
| Draft Generation | Writer API | `#writer-api` |
| Rewrite/Polish | Rewriter API | `#rewriter-api` |
| Proofread | Proofreader API | *(Built-in, no flag needed)* |
| Summarize | Summarizer API | `#summarization-api-for-gemini-nano` |
| Translate | Translator API | `#translation-api` |

## Important Notes

⚠️ **Experimental Features**: These APIs are experimental and may change or be removed in future Chrome versions.

⚠️ **Local Processing**: All AI processing happens locally on your device. No data is sent to external servers.

⚠️ **Performance**: AI model inference requires computational resources. Performance may vary based on your hardware.

⚠️ **Privacy**: The extension is FERPA-compliant and does not store or transmit student data.

## Additional Resources

- [Chrome AI APIs Documentation](https://developer.chrome.com/docs/ai/built-in)
- [Gemini Nano Overview](https://ai.google.dev/gemini-api/docs/nano)
- [DraftLoom GitHub Issues](https://github.com/denyzabra/draftloom-extension/issues)

## Support

If you encounter issues:
1. Check this setup guide
2. Review error messages in the extension
3. Check browser console (F12) for detailed errors
4. Open an issue on GitHub with error details

---

**Last Updated**: October 2025
**Chrome Version Required**: 127+
**Extension Version**: 1.0.0
