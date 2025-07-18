// Initialize the popup when DOM is ready
document.addEventListener('DOMContentLoaded', initializePopup);

// DOM elements - will be set after DOM loads
let sendBtn, userInput, messagesDiv, apiKeyBtn, apiKeyInput, apiKeySection;

// Safe HTML sanitization function
function sanitizeHTML(html) {
  const tempDiv = document.createElement('div');
  tempDiv.textContent = html;
  return tempDiv.textContent; // Return text content, not innerHTML
}

// Safe HTML creation for trusted content
function createSafeHTML(htmlString) {
  // Only allow specific safe tags for message content
  const allowedTags = ['div', 'span', 'strong', 'em', 'br', 'a'];
  const allowedAttributes = ['href', 'target', 'class'];
  
  // For now, we'll create elements programmatically for safety
  const container = document.createElement('div');
  
  // Check if content contains HTML tags
  if (htmlString.includes('<') && htmlString.includes('>')) {
    // Parse and create safe elements
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    
    // Copy only safe content
    const walker = document.createTreeWalker(
      doc.body,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      if (node.nodeType === Node.TEXT_NODE) {
        container.appendChild(document.createTextNode(node.textContent));
      } else if (node.nodeType === Node.ELEMENT_NODE && allowedTags.includes(node.tagName.toLowerCase())) {
        const safeElement = document.createElement(node.tagName.toLowerCase());
        
        // Copy safe attributes
        for (const attr of node.attributes) {
          if (allowedAttributes.includes(attr.name.toLowerCase())) {
            safeElement.setAttribute(attr.name, attr.value);
          }
        }
        
        container.appendChild(safeElement);
      }
    }
  } else {
    // Plain text content
    container.textContent = htmlString;
  }
  
  return container;
}

async function initializePopup() {
  console.log('Initializing popup...');
  
  try {
    // Get DOM elements after DOM is loaded
    sendBtn = document.getElementById('sendBtn');
    userInput = document.getElementById('userInput');
    messagesDiv = document.getElementById('messages');
    apiKeyBtn = document.getElementById('apiKeyBtn');
    apiKeyInput = document.getElementById('apiKeyInput');
    apiKeySection = document.getElementById('apiKeySection');
    
    console.log('DOM elements:', {
      sendBtn: !!sendBtn,
      userInput: !!userInput,
      messagesDiv: !!messagesDiv,
      apiKeyBtn: !!apiKeyBtn,
      apiKeyInput: !!apiKeyInput,
      apiKeySection: !!apiKeySection
    });
    
    // Check if all required elements exist
    if (!sendBtn || !userInput || !messagesDiv) {
      console.error('Required DOM elements not found');
      // Safe DOM manipulation instead of innerHTML
      const errorDiv = document.createElement('div');
      errorDiv.style.padding = '20px';
      errorDiv.style.color = 'red';
      errorDiv.textContent = 'Error: Required DOM elements not found';
      while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild);
      }
      document.body.appendChild(errorDiv);
      return;
    }
    
    console.log('All DOM elements found, setting up event listeners...');
    
    // Set up event listeners
    sendBtn.addEventListener('click', handleSendMessage);
    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSendMessage();
      }
    });
    
    if (apiKeyBtn) {
      apiKeyBtn.addEventListener('click', handleApiKeySetup);
    }
    
    // Set up message listener for content script responses
    setupMessageListener();
    
    // Show welcome message
    addMessage('bot', 'Welcome to the <b>Walmart Sparkathon Salesman!</b> 🛒<br>Find the best products and deals on <b>Walmart.com</b> with AI-powered recommendations.<br><span style="color:#ffc220;font-weight:600;">Reimagining Customer Experience for Sparkathon 2025!</span>');
    
    // Check API key status
    checkApiKeyStatus();
    
    console.log('Popup initialization complete');
    
  } catch (error) {
    console.error('Error during popup initialization:', error);
    // Safe DOM manipulation instead of innerHTML
    const errorDiv = document.createElement('div');
    errorDiv.style.padding = '20px';
    errorDiv.style.color = 'red';
    errorDiv.textContent = 'Error: ' + error.message;
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    document.body.appendChild(errorDiv);
  }
}

async function checkApiKeyStatus() {
  try {
    console.log('Checking API key status...');
    
    // Check API key directly in popup using chrome.storage
    const result = await new Promise((resolve) => {
      chrome.storage.sync.get('geminiApiKey', resolve);
    });
    
    const hasKey = !!result.geminiApiKey;
    console.log('API key exists:', hasKey);
    
    if (hasKey) {
      hideApiKeySection();
      addMessage('bot', 'AI recommendations are enabled!');
    } else {
      showApiKeySection();
      addMessage('bot', '⚠️ Set up your Gemini API key for AI-powered recommendations.');
    }
  } catch (error) {
    console.error('Error checking API key:', error);
    showApiKeySection();
    addMessage('bot', '⚠️ Set up your Gemini API key for AI-powered recommendations.');
  }
}

function showApiKeySection() {
  if (apiKeySection) {
    apiKeySection.style.display = 'block';
  }
}

function hideApiKeySection() {
  if (apiKeySection) {
    apiKeySection.style.display = 'none';
  }
}

function setupMessageListener() {
  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Popup received message:', message);
    
    if (message.type === 'RECOMMENDATIONS') {
      displayRecommendations(message.items, message.message);
    } else if (message.type === 'AI_RECOMMENDATIONS') {
      displayAIRecommendations(message);
    } else if (message.type === 'ERROR') {
      addMessage('bot', `❌ ${message.message}`);
    }
    
    return true;
  });
}

function displayRecommendations(items, statusMessage) {
  if (statusMessage) {
    addMessage('bot', statusMessage.replace('Amazon and Flipkart', 'Walmart.com'));
  }
  
  if (items && items.length > 0) {
    items.forEach((item, index) => {
      const productCard = `
        <div class='card'>
          <strong>${item.title}</strong><br>
          <div class="price-rating">
            <span class="price">💰 ${item.price}</span>
          </div>
          <div class="actions">
            <a href="${item.url}" target="_blank" class="view-btn">View Product</a>
          </div>
        </div>
      `;
      addMessage('bot', `${index + 1}. ${productCard}`);
    });
  } else {
    addMessage('bot', '🔍 No products found for your query.');
  }
}

function displayAIRecommendations(message) {
  const { recommendations, summary, buildSuggestion, alternatives, contextInsights, totalProducts, filteredProducts } = message;
  
  if (summary) {
    addMessage('bot', `🤖 <b>AI Analysis:</b><br>${summary}`);
  }

  // Show context insights if available
  if (contextInsights) {
    addMessage('bot', `🧠 <b>Context Insights:</b><br>${contextInsights}`);
  }
  
  if (totalProducts !== undefined && filteredProducts !== undefined) {
    addMessage('bot', `📊 Analyzed ${totalProducts} products, filtered to ${filteredProducts} matches`);
  }
  
  if (recommendations && recommendations.length > 0) {
    addMessage('bot', `🎯 Top ${recommendations.length} AI Recommendations:`);
    
    recommendations.forEach((rec, index) => {
      const product = rec.product || rec;
      const score = rec.score || 'N/A';
      const reason = rec.reason || '';
      const pros = rec.pros || [];
      const cons = rec.cons || [];
      const contextAlignment = rec.contextAlignment || '';
      const preferenceDeviation = rec.preferenceDeviation || '';
      
      const productCard = `
        <div class='card ai-recommendation'>
          <div class="recommendation-header">
            <strong>${product.title}</strong>
            <span class="match-score">Match: ${score}%</span>
          </div>
          <div class="price-rating">
            <span class="price">💰 ${product.price}</span>
            ${product.rating ? `<span class="rating">⭐ ${product.rating}</span>` : ''}
          </div>
          ${reason ? `<div class="ai-reason">💡 ${reason}</div>` : ''}
          ${contextAlignment ? `<div class="context-alignment">🧠 <b>Context:</b> ${contextAlignment}</div>` : ''}
          ${preferenceDeviation ? `<div class="preference-deviation">🔄 <b>Note:</b> ${preferenceDeviation}</div>` : ''}
          ${pros.length > 0 ? `<div class="pros">✅ ${pros.join(', ')}</div>` : ''}
          ${cons.length > 0 ? `<div class="cons">⚠️ ${cons.join(', ')}</div>` : ''}
          <div class="actions">
            <a href="${product.url}" target="_blank" class="view-btn">View Product</a>
          </div>
        </div>
      `;
      addMessage('bot', `${index + 1}. ${productCard}`);
    });
  } else {
    addMessage('bot', '🔍 No matching products found for your criteria.');
  }
  
  if (buildSuggestion) {
    addMessage('bot', `💡 Build Suggestion: ${buildSuggestion}`);
  }
  
  if (alternatives) {
    addMessage('bot', `🔄 Alternatives: ${alternatives}`);
  }
}

async function handleApiKeySetup() {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    addMessage('bot', 'Please enter a valid Gemini API key.');
    return;
  }
  
  try {
    addMessage('bot', 'Setting up API key...');
    
    // Save API key directly in popup using chrome.storage
    await new Promise((resolve, reject) => {
      chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
    
    addMessage('bot', '✅ API key set successfully! AI recommendations are now enabled.');
    hideApiKeySection();
    apiKeyInput.value = '';
    
  } catch (error) {
    console.error('Error setting API key:', error);
    addMessage('bot', '❌ Failed to set API key. Please try again.');
  }
}

async function handleSendMessage() {
  const query = userInput.value.trim();
  if (!query) return;
  
  // Add user message
  addMessage('user', query);
  userInput.value = '';
  
  // Add loading message
  const loadingId = addMessage('bot', '🔍 Analyzing your request...');
  
  try {
    // Send query to content script
    const response = await sendMessageToContentScript({
      type: 'USER_QUERY',
      query: query
    });
    
    // Remove loading message
    removeMessage(loadingId);
    
    if (response && response.status === 'processing') {
      addMessage('bot', '⚡ Processing your request...');
    }
    
  } catch (error) {
    removeMessage(loadingId);
    addMessage('bot', `❌ Error: ${error.message}`);
  }
}

function sendMessageToContentScript(message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) {
        reject(new Error('No active tab found'));
        return;
      }
      
      chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error('Unable to connect to the content script. Please ensure you\'re on a supported page (Amazon or Flipkart).'));
        } else {
          resolve(response);
        }
      });
    });
  });
}

function addMessage(sender, content) {
  if (!messagesDiv) {
    console.error('messagesDiv not found, cannot add message');
    return null;
  }
  
  const messageId = `msg_${Date.now()}_${Math.random()}`;
  const messageDiv = document.createElement('div');
  messageDiv.id = messageId;
  messageDiv.className = sender;
  
  // Safe content handling
  if (typeof content === 'string' && (content.includes('<') && content.includes('>'))) {
    // For HTML content, create safe elements
    const safeContent = createSafeHTML(content);
    messageDiv.appendChild(safeContent);
  } else {
    // For plain text
    messageDiv.textContent = content;
  }
  
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  return messageId;
}

function removeMessage(messageId) {
  const messageElement = document.getElementById(messageId);
  if (messageElement) {
    messageElement.remove();
  }
}

function formatProductCard(product, recommendation = null) {
  const rating = product.rating ? `⭐ ${product.rating}` : '';
  const specs = product.specs && Object.keys(product.specs).length > 0 
    ? `<div class="specs">Specs: ${Object.entries(product.specs).map(([key, value]) => `${key}: ${value}`).join(', ')}</div>`
    : '';
  
  let recommendationInfo = '';
  if (recommendation) {
    recommendationInfo = `
      <div class="recommendation-info">
        <div class="score">Match Score: ${recommendation.score}%</div>
        <div class="reason">${recommendation.reason}</div>
        ${recommendation.pros.length > 0 ? `<div class="pros">✅ ${recommendation.pros.join(', ')}</div>` : ''}
        ${recommendation.cons.length > 0 ? `<div class="cons">⚠️ ${recommendation.cons.join(', ')}</div>` : ''}
      </div>
    `;
  }
  
  return `
    <div class='card'>
      <strong>${product.title}</strong><br>
      <div class="price-rating">
        <span class="price">💰 ${product.price}</span>
        ${rating ? `<span class="rating">${rating}</span>` : ''}
      </div>
      ${specs}
      ${recommendationInfo}
      <div class="actions">
        <a href="${product.url}" target="_blank" class="view-btn">View Product</a>
      </div>
    </div>
  `;
}