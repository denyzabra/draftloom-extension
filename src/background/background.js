// Background Service Worker for DraftLoom Extension

console.log('DraftLoom background service worker loaded');

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('DraftLoom extension installed');

    // Set initial consent flag
    chrome.storage.local.set({
      userConsent: false,
      consentDate: null,
      firstInstallDate: Date.now()
    });
  } else if (details.reason === 'update') {
    console.log('DraftLoom extension updated');
  }
});

// Clean up data when extension is being uninstalled
chrome.management.getSelf(() => {
  // This runs on startup to check if we need to handle cleanup
  chrome.storage.local.get(['scheduledForUninstall'], (result) => {
    if (result.scheduledForUninstall) {
      // Clear all stored data
      chrome.storage.local.clear(() => {
        console.log('DraftLoom: All data cleared on uninstall');
      });
    }
  });
});

// Open sidebar when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  try {
    console.log('Extension icon clicked, opening sidebar...');
    await chrome.sidePanel.open({ windowId: tab.windowId });
  } catch (error) {
    console.error('Error opening sidebar:', error);
  }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log('Message received:', request);

  // Handle different message types
  switch (request.type) {
    case 'ping':
      sendResponse({ status: 'ok', message: 'pong' });
      break;
    case 'analyze-page':
      // Forward to content script if needed
      sendResponse({ status: 'ok', message: 'Analyzing page...' });
      break;
    default:
      sendResponse({ status: 'error', message: 'Unknown message type' });
  }

  return true; // Keep the message channel open for async responses
});
