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

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);

  // Handle different message types
  switch (request.type) {
    case 'ping':
      sendResponse({ status: 'ok', message: 'pong' });
      break;
    default:
      sendResponse({ status: 'error', message: 'Unknown message type' });
  }

  return true; // Keep the message channel open for async responses
});
