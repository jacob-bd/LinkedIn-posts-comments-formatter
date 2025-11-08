// Background Service Worker for LinkedIn Post Formatter
// Handles extension lifecycle and communication

// Initialize storage on install
chrome.runtime.onInstalled.addListener((details) => {
  console.log('LinkedIn Post Formatter installed:', details.reason);

  // Initialize storage
  chrome.storage.local.get(['usage', 'settings'], (result) => {
    if (!result.usage) {
      chrome.storage.local.set({
        usage: {
          count: 0,
          actions: {},
          lastUsed: null
        }
      });
    }

    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          enabled: true,
          keyboardShortcuts: true,
          autoAttach: true
        }
      });
    }
  });

  // Show welcome notification on first install
  if (details.reason === 'install') {
    console.log('First install - welcome message');
    // Note: Notification currently disabled until icon assets are added
    // chrome.notifications.create({
    //   type: 'basic',
    //   iconUrl: 'icon48.png',
    //   title: 'LinkedIn Post Formatter Installed',
    //   message: 'Use Ctrl+B for bold, Ctrl+I for italic in LinkedIn posts!',
    //   priority: 1
    // });
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);

  if (request.action === 'open-post-formatter') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'open-post-formatter' });
      }
    });
    sendResponse({ success: true });
  }

  if (request.action === 'getUsageStats') {
    chrome.storage.local.get(['usage'], (result) => {
      sendResponse({ usage: result.usage || {} });
    });
    return true; // Async response
  }

  if (request.action === 'updateSettings') {
    // Validate settings schema before storing
    const validSettings = {
      enabled: typeof request.settings?.enabled === 'boolean' ? request.settings.enabled : true,
      keyboardShortcuts: typeof request.settings?.keyboardShortcuts === 'boolean' ? request.settings.keyboardShortcuts : true,
      autoAttach: typeof request.settings?.autoAttach === 'boolean' ? request.settings.autoAttach : true
    };
    chrome.storage.local.set({ settings: validSettings }, () => {
      sendResponse({ success: true });
    });
    return true; // Async response
  }

  return true;
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Send message to content script to show/hide formatter
  chrome.tabs.sendMessage(tab.id, { action: 'toggle-formatter' });
});

console.log('LinkedIn Post Formatter background service worker ready');
