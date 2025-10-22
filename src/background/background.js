// Background Service Worker for DraftLoom Extension

console.log('DraftLoom background service worker loaded');

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('DraftLoom extension installed');
  } else if (details.reason === 'update') {
    console.log('DraftLoom extension updated');
  }
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
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
