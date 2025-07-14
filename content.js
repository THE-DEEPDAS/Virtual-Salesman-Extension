console.log("SalesmanBot content script loaded successfully");

// Check if we're on a supported site first
const currentUrl = window.location.href;
const isSupported = currentUrl.includes('amazon') || currentUrl.includes('flipkart') || currentUrl.includes('walmart');
console.log(`Current URL: ${currentUrl}`);
console.log(`Is supported site: ${isSupported}`);

if (!isSupported) {
  console.warn("Content script loaded on unsupported site");
}

// Initialize services
let productExtractor, queryParser, aiService, contextTracker;
let servicesInitialized = false;

// Wait for page to fully load before initializing
function waitForDOMReady(callback, retries = 5, delay = 1000) {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    callback();
  } else if (retries > 0) {
    console.log(`DOM not ready, retrying in ${delay}ms... (${retries} retries left)`);
    setTimeout(() => waitForDOMReady(callback, retries - 1, delay), delay);
  } else {
    console.error('Failed to initialize services: DOM not ready after multiple retries');
  }
}

function waitForProductExtractor(callback, retries = 5, delay = 1000) {
  if (typeof ProductExtractor !== 'undefined') {
    callback();
  } else if (retries > 0) {
    console.log(`ProductExtractor not available, retrying in ${delay}ms... (${retries} retries left)`);
    setTimeout(() => waitForProductExtractor(callback, retries - 1, delay), delay);
  } else {
    console.error('Failed to initialize services: ProductExtractor not available after multiple retries');
  }
}

function waitForAIService(callback, retries = 5, delay = 1000) {
  if (typeof AIService !== 'undefined') {
    callback();
  } else if (retries > 0) {
    console.log(`AIService not available, retrying in ${delay}ms... (${retries} retries left)`);
    setTimeout(() => waitForAIService(callback, retries - 1, delay), delay);
  } else {
    console.error('Failed to initialize services: AIService not available after multiple retries');
  }
}

function waitForContextTracker(callback, retries = 5, delay = 1000) {
  if (typeof ContextTracker !== 'undefined') {
    callback();
  } else if (retries > 0) {
    console.log(`ContextTracker not available, retrying in ${delay}ms... (${retries} retries left)`);
    setTimeout(() => waitForContextTracker(callback, retries - 1, delay), delay);
  } else {
    console.error('Failed to initialize services: ContextTracker not available after multiple retries');
  }
}

// Replace the existing DOMContentLoaded and setTimeout logic
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    waitForProductExtractor(() => {
      waitForAIService(() => {
        waitForContextTracker(initializeServices);
      });
    });
  });
} else {
  waitForProductExtractor(() => {
    waitForAIService(() => {
      waitForContextTracker(initializeServices);
    });
  });
}

function initializeServices() {
  try {
    // Check if the classes are available
    if (typeof ProductExtractor === 'undefined') {
      console.error('ProductExtractor class not available');
      return;
    }
    if (typeof QueryParser === 'undefined') {
      console.error('QueryParser class not available');
      return;
    }
    if (typeof AIService === 'undefined') {
      console.error('AIService class not available');
      return;
    }
    if (typeof ContextTracker === 'undefined') {
      console.error('ContextTracker class not available');
      return;
    }

    productExtractor = new ProductExtractor();
    queryParser = new QueryParser();
    aiService = new AIService();
    contextTracker = new ContextTracker();
    
    // Initialize context tracker
    contextTracker.initialize().then(() => {
      console.log("ContextTracker initialized");
      // Update page context
      const productCount = productExtractor.hasProducts() ? 
        document.querySelectorAll(productExtractor.selectors.productCards).length : 0;
      contextTracker.updatePageContext(productExtractor.siteName, productCount);
      
      // Broadcast initial context to sidebar
      broadcastContextUpdate();
    });
    
    servicesInitialized = true;
    console.log("All services initialized successfully");
  } catch (error) {
    console.error("Failed to initialize services:", error);
    servicesInitialized = false;
  }
}

// Function to broadcast context updates to sidebar
function broadcastContextUpdate() {
  if (!contextTracker) return;
  
  const contextData = {
    context: contextTracker.context,
    preferences: contextTracker.preferences,
    insights: contextTracker.getContextualInsights()
  };
  
  // Send to runtime for sidebar to pick up
  chrome.runtime.sendMessage({
    type: 'CONTEXT_BROADCAST',
    data: contextData
  }).catch(error => {
    console.log('Runtime not ready for context broadcast:', error);
  });
}

// Enhanced message listener with better error handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in content script:", message);
  
  // Always respond to prevent "Receiving end does not exist" errors
  const safeResponse = (response) => {
    try {
      sendResponse(response);
    } catch (error) {
      console.warn("Response already sent or connection closed:", error.message);
    }
  };
  
  if (message.type === 'CONTEXT_UPDATED') {
    console.log("Context updated message received:", message);
    // Handle context update logic here
    safeResponse({ status: 'context_handled' });
    return true;
  }

  // Check if services are initialized
  if (!servicesInitialized && message.type === 'USER_QUERY') {
    safeResponse({ 
      status: 'error', 
      message: 'Content script services not ready. Please refresh the page and try again.' 
    });
    return true;
  }
  
  if (message.type === 'USER_QUERY') {
    handleUserQuery(message.query, safeResponse);
    return true; // Keep the message channel open for async response
  }
  
  if (message.type === 'SET_API_KEY') {
    handleSetApiKey(message.apiKey, safeResponse);
    return true;
  }
  
  if (message.type === 'CHECK_API_KEY') {
    handleCheckApiKey(safeResponse);
    return true;
  }

  if (message.type === 'REQUEST_CONTEXT_UPDATE') {
    handleContextUpdateRequest(safeResponse);
    return true;
  }

  if (message.type === 'PREFERENCES_CLEARED') {
    handlePreferencesCleared();
    safeResponse({ status: 'preferences_cleared' });
    return true;
  }
  
  // Default response for unhandled messages
  safeResponse({ status: 'message_received' });
  return true;
});

async function handleUserQuery(query, sendResponse) {
  try {
    console.log(`Processing query: "${query}"`);
    
    // Send immediate acknowledgment
    sendResponse({ status: 'processing', message: 'Analyzing your request...' });
    
    // Parse the user query
    const parsedQuery = queryParser.parseQuery(query);
    console.log("Parsed query:", parsedQuery);

    // Learn from this query for context-aware recommendations
    if (contextTracker) {
      await contextTracker.learnFromQuery(query, parsedQuery);
      console.log("Learned from query:", query);
      
      // Broadcast context update after learning
      broadcastContextUpdate();
    }
    
    // Check if we're on a product page first
    console.log("Checking current page URL:", window.location.href);
    console.log("Page title:", document.title);
    
    // Wait for products to load if necessary
    console.log("Waiting for products to load...");
    const hasProducts = await productExtractor.waitForProducts(5000);
    console.log("Products available:", hasProducts);
    
    if (!hasProducts) {
      console.log("No products detected, sending error message");
      chrome.runtime.sendMessage({
        type: 'ERROR',
        message: 'No products found on this page. Please navigate to a product search or listing page.'
      }).catch(error => {
        console.log("Failed to send error message:", error);
      });
      return;
    }
    
    // Extract products from the current page
    console.log("Extracting products...");
    const products = productExtractor.extractProducts();
    console.log(`Extracted ${products.length} products:`, products.slice(0, 3)); // Log first 3 for debugging
    
    if (products.length === 0) {
      console.log("Product extraction returned empty array");
      chrome.runtime.sendMessage({
        type: 'ERROR',
        message: 'No products could be extracted from this page. Please try on a product listing page.'
      }).catch(error => {
        console.log("Failed to send error message:", error);
      });
      return;
    }
    
    // Filter products based on basic criteria first
    let filteredProducts = filterProducts(products, parsedQuery);
    console.log(`Filtered to ${filteredProducts.length} products`);
    
    // If we have too many products, take top 20 for AI analysis
    if (filteredProducts.length > 20) {
      filteredProducts = filteredProducts.slice(0, 20);
    }
    
    // Use AI to analyze and recommend products
    try {
      // Get contextual insights for AI analysis
      const contextualInsights = contextTracker ? contextTracker.getContextualInsights() : null;
      console.log("Contextual insights:", contextualInsights);
      
      const aiRecommendations = await aiService.analyzeAndRecommend(query, filteredProducts, parsedQuery, contextualInsights);
      
      // Send AI-powered recommendations
      chrome.runtime.sendMessage({
        type: 'AI_RECOMMENDATIONS',
        recommendations: aiRecommendations.recommendations,
        summary: aiRecommendations.summary,
        buildSuggestion: aiRecommendations.buildSuggestion,
        alternatives: aiRecommendations.alternatives,
        contextInsights: aiRecommendations.contextInsights,
        totalProducts: products.length,
        filteredProducts: filteredProducts.length
      }).catch(error => {
        console.log("Failed to send AI recommendations:", error);
      });
      
    } catch (aiError) {
      console.error("AI analysis failed, falling back to basic filtering:", aiError);
      
      // Fallback to basic recommendation
      const basicRecommendations = filteredProducts.slice(0, 5).map(product => ({
        product: product,
        score: calculateBasicScore(product, parsedQuery),
        reason: 'Matched based on your search criteria',
        pros: getProductPros(product),
        cons: [],
        compatibility: ''
      }));
      
      chrome.runtime.sendMessage({
        type: 'RECOMMENDATIONS',
        items: basicRecommendations.map(rec => rec.product),
        message: aiError.message.includes('API key') ? 
          'AI analysis unavailable. Please set up your Gemini API key in the extension popup.' :
          'Basic filtering applied. Set up AI for better recommendations.\n\n<b>Tip:</b> For best results, use this extension on <b>Walmart.com</b> product search or category pages!'
      }).catch(error => {
        console.log("Failed to send basic recommendations:", error);
      });
    }
    
  } catch (error) {
    console.error("Error processing query:", error);
    chrome.runtime.sendMessage({
      type: 'ERROR',
      message: `Error processing your request: ${error.message}`
    }).catch(err => {
      console.log("Failed to send error message:", err);
    });
  }
}

// Legacy functions for backward compatibility (simplified versions)
function filterProducts(products, parsedQuery) {
  return products.filter(product => {
    // Budget filter
    if (parsedQuery.budget) {
      const productPrice = extractNumericPrice(product.price);
      if (productPrice > 0) {
        if (parsedQuery.budget.operator === 'under' && productPrice > parsedQuery.budget.amount) {
          return false;
        }
        if (parsedQuery.budget.operator === 'around') {
          const tolerance = parsedQuery.budget.amount * 0.2; // 20% tolerance
          if (productPrice > parsedQuery.budget.amount + tolerance) {
            return false;
          }
        }
      }
    }
    
    // Category filter
    if (parsedQuery.categories.length > 0) {
      const productMatches = parsedQuery.categories.some(category => 
        product.category === category || 
        product.title.toLowerCase().includes(category.replace('_', ' '))
      );
      if (!productMatches) {
        return false;
      }
    }
    
    return true;
  });
}

function extractNumericPrice(priceString) {
  if (!priceString) return 0;
  const match = priceString.match(/[\d,]+(?:\.\d{2})?/);
  return match ? parseInt(match[0].replace(/,/g, '')) : 0;
}

function calculateBasicScore(product, parsedQuery) {
  let score = 50; // Base score
  
  // Rating bonus
  if (product.rating) {
    const rating = parseFloat(product.rating);
    if (!isNaN(rating)) {
      score += rating * 8;
    }
  }
  
  return Math.min(score, 100);
}

function getProductPros(product) {
  const pros = [];
  
  if (product.rating && parseFloat(product.rating) >= 4.0) {
    pros.push('High rating');
  }
  
  return pros.length > 0 ? pros : ['Available on ' + (product.site || 'this site')];
}

async function handleSetApiKey(apiKey, sendResponse) {
  try {
    const success = await aiService.setApiKey(apiKey);
    sendResponse({ success: success });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleCheckApiKey(sendResponse) {
  try {
    const hasKey = await aiService.hasApiKey();
    sendResponse({ hasApiKey: hasKey });
  } catch (error) {
    sendResponse({ hasApiKey: false, error: error.message });
  }
}

async function handleContextUpdateRequest(sendResponse) {
  try {
    if (contextTracker) {
      // Update product count
      const productCount = productExtractor && productExtractor.hasProducts() ? 
        document.querySelectorAll(productExtractor.selectors.productCards).length : 0;
      contextTracker.updatePageContext(
        productExtractor ? productExtractor.siteName : 'Unknown', 
        productCount
      );
      
      sendResponse({ 
        context: contextTracker.context,
        insights: contextTracker.getContextualInsights()
      });
    } else {
      sendResponse({ error: 'ContextTracker not initialized' });
    }
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

function handlePreferencesCleared() {
  if (contextTracker) {
    contextTracker.clearPreferences();
    console.log("Preferences cleared from content script");
  }
}

// Export for testing
if (typeof window !== 'undefined') {
  window.salesmanBotContent = {
    productExtractor,
    queryParser,
    aiService,
    isSupported,
    servicesInitialized
  };
}
