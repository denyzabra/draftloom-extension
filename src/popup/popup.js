// Popup Script for DraftLoom Extension

console.log('DraftLoom popup loaded');

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup DOM loaded');

  // Get references to UI elements
  const statusElement = document.getElementById('status');

  // Check connection to background script
  chrome.runtime.sendMessage({ type: 'ping' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error connecting to background:', chrome.runtime.lastError);
      if (statusElement) {
        statusElement.textContent = 'Error: Could not connect to background script';
      }
    } else {
      console.log('Background response:', response);
      if (statusElement) {
        statusElement.textContent = 'Status: Connected';
      }
    }
  });

  // Add event listeners for popup buttons
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      console.log('Settings button clicked');
      // Future: Open settings page
    });
  }
});
