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

// Listen for messages from background script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);

  switch (request.type) {
    case 'getSelection':
      sendResponse({ text: window.getSelection().toString() });
      break;

    case 'analyze-page':
      const pageData = analyzePage();
      sendResponse({
        status: 'success',
        data: pageData
      });
      break;

    default:
      sendResponse({ status: 'error', message: 'Unknown message type' });
  }

  return true;
});

// Analyze page content
function analyzePage() {
  const textContent = document.body.innerText || '';
  const wordCount = textContent.trim().split(/\s+/).length;
  const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent.trim());
  const textAreas = document.querySelectorAll('textarea, [contenteditable="true"]').length;

  return {
    title: document.title,
    url: window.location.href,
    wordCount: wordCount,
    headings: headings.slice(0, 5), // First 5 headings
    hasTextAreas: textAreas > 0,
    textAreasCount: textAreas,
    timestamp: new Date().toISOString()
  };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
