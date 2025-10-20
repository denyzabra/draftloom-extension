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
  const openSidebarBtn = document.getElementById('open-sidebar');
  if (openSidebarBtn) {
    openSidebarBtn.addEventListener('click', async () => {
      console.log('Open Sidebar button clicked');
      try {
        // Get the current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          // Open the sidebar in a new tab or window
          chrome.windows.create({
            url: chrome.runtime.getURL('sidebar.html'),
            type: 'popup',
            width: 420,
            height: 700
          });
        }
      } catch (error) {
        console.error('Error opening sidebar:', error);
      }
    });
  }

  const analyzePageBtn = document.getElementById('analyze-page');
  if (analyzePageBtn) {
    analyzePageBtn.addEventListener('click', async () => {
      console.log('Analyze Page button clicked');
      const statusText = document.getElementById('status-text');
      if (statusText) {
        statusText.textContent = 'Analyzing page...';
      }

      try {
        // Get the current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          // Send message to content script to analyze the page
          chrome.tabs.sendMessage(tab.id, { type: 'analyze-page' }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Error:', chrome.runtime.lastError);
              if (statusText) {
                statusText.textContent = 'Error: Could not analyze page';
              }
            } else {
              console.log('Analysis response:', response);
              if (statusText) {
                statusText.textContent = 'Page analyzed successfully!';
              }
            }
          });
        }
      } catch (error) {
        console.error('Error analyzing page:', error);
        if (statusText) {
          statusText.textContent = 'Error analyzing page';
        }
      }
    });
  }

  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      console.log('Settings button clicked');
      // Future: Open settings page
      alert('Settings page coming soon!');
    });
  }
});
