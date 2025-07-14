// SalesmanBot Background Script
console.log("SalesmanBot background script loaded");

chrome.runtime.onInstalled.addListener(() => {
  console.log("SalesmanBot extension installed successfully");
  
  // Initialize default preferences
  chrome.storage.local.set({
    userPreferences: {
      budget: {},
      categories: {},
      brands: {},
      specs: {},
      purposes: {}
    }
  });

  // Inject content script into all open tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.id && tab.url && tab.url.startsWith("http")) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"]
        }, () => {
          if (chrome.runtime.lastError) {
            console.warn(`Failed to inject content script into tab ${tab.id}:`, chrome.runtime.lastError.message);
          } else {
            console.log(`Content script injected into tab ${tab.id}`);
          }
        });

        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["utils/productExtractor.js"]
        }, () => {
          if (chrome.runtime.lastError) {
            console.warn(`Failed to inject productExtractor.js into tab ${tab.id}:`, chrome.runtime.lastError.message);
          } else {
            console.log(`productExtractor.js injected into tab ${tab.id}`);
          }
        });

        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["utils/queryParser.js"]
        }, () => {
          if (chrome.runtime.lastError) {
            console.warn(`Failed to inject queryParser.js into tab ${tab.id}:`, chrome.runtime.lastError.message);
          } else {
            console.log(`queryParser.js injected into tab ${tab.id}`);
          }
        });

        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["utils/aiService.js"]
        }, () => {
          if (chrome.runtime.lastError) {
            console.warn(`Failed to inject aiService.js into tab ${tab.id}:`, chrome.runtime.lastError.message);
          } else {
            console.log(`aiService.js injected into tab ${tab.id}`);
          }
        });

        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["utils/contextTracker.js"]
        }, () => {
          if (chrome.runtime.lastError) {
            console.warn(`Failed to inject contextTracker.js into tab ${tab.id}:`, chrome.runtime.lastError.message);
          } else {
            console.log(`contextTracker.js injected into tab ${tab.id}`);
          }
        });
      }
    });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);
  
  // Ensure we always send a response to prevent "Receiving end does not exist" errors
  const handleResponse = (response) => {
    try {
      sendResponse(response);
    } catch (error) {
      console.log("Response already sent or connection closed:", error.message);
    }
  };
  
  if (message.type === 'PAGE_ANALYSIS_COMPLETE') {
    console.log("Page analysis completed");
    handleResponse({ status: 'acknowledged' });
  }
  
  if (message.type === 'EXTENSION_ERROR') {
    console.error("Extension error:", message.error);
    handleResponse({ status: 'error_logged' });
  }
  
  if (message.type === 'PREFERENCES_UPDATED') {
    console.log("User preferences updated");
    handleResponse({ status: 'preferences_updated' });
  }
  
  if (message.type === 'CONTEXT_UPDATED') {
    console.log("Context updated");
    handleResponse({ status: 'context_updated' });
  }
  
  if (message.type === 'CONTEXT_BROADCAST') {
    // Forward context broadcasts to all extension components
    console.log("Broadcasting context update");

    const broadcastQueue = [];
    let isBroadcasting = false;

    const processQueue = () => {
      if (isBroadcasting || broadcastQueue.length === 0) return;

      isBroadcasting = true;
      const broadcastData = broadcastQueue.shift();

      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            type: 'CONTEXT_UPDATED',
            context: broadcastData.context,
            preferences: broadcastData.preferences,
            insights: broadcastData.insights
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.warn(`Failed to send message to tab ${tab.id}:`, chrome.runtime.lastError.message);
            } else {
              console.log(`Message sent to tab ${tab.id}:`, response);
            }
          });
        });

        setTimeout(() => {
          isBroadcasting = false;
          processQueue();
        }, 5000); // Wait 5 seconds before processing the next item
      });
    };

    broadcastQueue.push(message.data);
    console.log(`Broadcast added to queue. Queue length: ${broadcastQueue.length}`);
    handleResponse({ status: 'broadcast_queued', queueLength: broadcastQueue.length });
    processQueue();
  }
  
  if (message.type === 'OPEN_PREFERENCES') {
    // Open preferences sidebar when requested
    console.log("Opening preferences sidebar");
    if (sender.tab) {
      try {
        chrome.sidePanel.open({ tabId: sender.tab.id });
        handleResponse({ status: 'sidebar_opened' });
      } catch (error) {
        console.error("Failed to open sidebar:", error);
        handleResponse({ status: 'sidebar_error', error: error.message });
      }
    } else {
      handleResponse({ status: 'no_tab_info' });
    }
  }
  
  return true;
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.geminiApiKey) {
    console.log("Gemini API key updated");
  }
  if (changes.userPreferences) {
    console.log("User preferences changed");
  }
  if (changes.currentContext) {
    console.log("Current context changed");
  }
});

// Handle action clicks to open popup (default behavior)
// Sidebar will only open when specifically requested via preferences button

console.log("Background script setup complete");
