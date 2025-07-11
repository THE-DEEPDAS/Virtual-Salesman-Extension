// SalesmanBot Background Script
console.log("SalesmanBot background script loaded");

chrome.runtime.onInstalled.addListener(() => {
  console.log("SalesmanBot extension installed successfully");
  
  // Initialize default preferences
  chrome.storage.sync.set({
    userPreferences: {
      budget: { ranges: {}, confidence: 0 },
      categories: { interests: {}, frequency: {} },
      brands: { preferences: {}, loyalty: {} },
      specs: { requirements: {}, importance: {} }
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);
  
  if (message.type === 'PAGE_ANALYSIS_COMPLETE') {
    console.log("Page analysis completed");
  }
  
  if (message.type === 'EXTENSION_ERROR') {
    console.error("Extension error:", message.error);
  }
  
  if (message.type === 'PREFERENCES_UPDATED') {
    console.log("User preferences updated");
  }
  
  if (message.type === 'CONTEXT_UPDATED') {
    console.log("Context updated");
  }
  
  if (message.type === 'CONTEXT_BROADCAST') {
    // Forward context broadcasts to all extension components
    console.log("Broadcasting context update");
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'CONTEXT_UPDATED',
          context: message.data.context,
          preferences: message.data.preferences,
          insights: message.data.insights
        }).catch(() => {
          // Ignore errors for tabs that don't have the content script
        });
      });
    });
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

console.log("Background script setup complete");
