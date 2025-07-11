// SalesmanBot Background Script
console.log("SalesmanBot background script loaded");

chrome.runtime.onInstalled.addListener(() => {
  console.log("SalesmanBot extension installed successfully");
  
  // Enable side panel for the extension
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
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

// Handle action clicks to open sidebar
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

console.log("Background script setup complete");
