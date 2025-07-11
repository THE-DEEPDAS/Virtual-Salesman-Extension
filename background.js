// SalesmanBot Background Script
console.log("SalesmanBot background script loaded");

chrome.runtime.onInstalled.addListener(() => {
  console.log("SalesmanBot extension installed successfully");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);
  
  if (message.type === 'PAGE_ANALYSIS_COMPLETE') {
    console.log("Page analysis completed");
  }
  
  if (message.type === 'EXTENSION_ERROR') {
    console.error("Extension error:", message.error);
  }
  
  return true;
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.geminiApiKey) {
    console.log("Gemini API key updated");
  }
});

console.log("Background script setup complete");
