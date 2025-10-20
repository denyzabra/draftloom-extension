// Content Script for DraftLoom Extension

console.log('DraftLoom content script loaded');

// Initialize the content script
function init() {
  console.log('DraftLoom: Initializing content script');

  // Add event listeners for text input areas
  const textAreas = document.querySelectorAll('textarea, [contenteditable="true"]');

  textAreas.forEach((element) => {
    element.addEventListener('focus', handleTextAreaFocus);
  });
}

// Handle text area focus
function handleTextAreaFocus(event) {
  console.log('Text area focused:', event.target);
  // Future: Show AI writing assistance UI
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);

  switch (request.type) {
    case 'getSelection':
      sendResponse({ text: window.getSelection().toString() });
      break;
    default:
      sendResponse({ status: 'error', message: 'Unknown message type' });
  }

  return true;
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
