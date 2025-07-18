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
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeServices);
} else {
  initializeServices();
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

// Message listener for popup communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in content script:", message);
  
  
  // Check if services are initialized
  if (!servicesInitialized && message.type === 'USER_QUERY') {
    sendResponse({ 
      status: 'error', 
      message: 'Content script services not ready. Please refresh the page and try again.' 
    });
    return true;
  }
  
  if (message.type === 'USER_QUERY') {
    handleUserQuery(message.query, sendResponse);
    return true; // Keep the message channel open for async response
  }
  
  if (message.type === 'SET_API_KEY') {
    handleSetApiKey(message.apiKey, sendResponse);
    return true;
  }
  
  if (message.type === 'CHECK_API_KEY') {
    handleCheckApiKey(sendResponse);
    return true;
  }

  if (message.type === 'REQUEST_CONTEXT_UPDATE') {
    handleContextUpdateRequest(sendResponse);
    return true;
  }

  if (message.type === 'PREFERENCES_CLEARED') {
    handlePreferencesCleared();
    return true;
  }
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
      });
    }
    
  } catch (error) {
    console.error("Error processing query:", error);
    chrome.runtime.sendMessage({
      type: 'ERROR',
      message: `Error processing your request: ${error.message}`
    });
  }
}

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
    
    // Brand filter
    if (parsedQuery.brands.length > 0) {
      const productMatches = parsedQuery.brands.some(brand => 
        product.title.toLowerCase().includes(brand)
      );
      if (!productMatches) {
        return false;
      }
    }
    
    // Specs filter
    if (parsedQuery.specs.ram) {
      const productRam = extractRAMSize(product.title);
      if (productRam > 0 && productRam < parsedQuery.specs.ram) {
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

function extractRAMSize(title) {
  const match = title.match(/(\d+)\s*gb\s*(?:ram|memory|ddr)/i);
  return match ? parseInt(match[1]) : 0;
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
  
  // Category match bonus
  if (parsedQuery.categories.includes(product.category)) {
    score += 20;
  }
  
  // Brand match bonus
  if (parsedQuery.brands.some(brand => 
    product.title.toLowerCase().includes(brand))) {
    score += 15;
  }
  
  // Price appropriateness
  if (parsedQuery.budget) {
    const productPrice = extractNumericPrice(product.price);
    if (productPrice > 0) {
      const budgetUtilization = productPrice / parsedQuery.budget.amount;
      if (budgetUtilization >= 0.7 && budgetUtilization <= 1.0) {
        score += 10; // Good budget utilization
      }
    }
  }
  
  return Math.min(score, 100);
}

function getProductPros(product) {
  const pros = [];
  
  if (product.rating && parseFloat(product.rating) >= 4.0) {
    pros.push('High rating');
  }
  
  if (product.specs && Object.keys(product.specs).length > 0) {
    pros.push('Detailed specifications available');
  }
  
  if (product.category && product.category !== 'other') {
    pros.push('Properly categorized');
  }
  
  return pros.length > 0 ? pros : ['Available on ' + product.site];
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

// Legacy functions for backward compatibility
function scrapeCurrentPage() {
  if (productExtractor) {
    return productExtractor.extractProducts();
  }
  return [];
}

function parseUserQuery(query) {
  if (queryParser) {
    return queryParser.parseQuery(query);
  }
  return { budget: null, categories: [], specs: {}, keywords: [] };
}

function matchProduct(product, parsedQuery) {
  const title = product.title.toLowerCase();
  const priceNum = Number((product.price || "0").replace(/[^\d]/g, ""));

  if (parsedQuery.budget && priceNum > parsedQuery.budget) return false;

  let score = 0;
  if (parsedQuery.keywords) {
    parsedQuery.keywords.forEach(k => {
      if (title.includes(k)) score++;
    });
  }

  return score > 0;
}

// Function to check if current page is supported
function isPageSupported() {
  const url = window.location.href;
  return url.includes('amazon') || url.includes('flipkart');
}

// Function to check page readiness
function isPageReady() {
  return productExtractor && productExtractor.hasProducts();
}

// Export for testing
if (typeof window !== 'undefined') {
  window.salesmanBotContent = {
    productExtractor,
    queryParser,
    aiService,
    isPageSupported,
    isPageReady
  };
}
