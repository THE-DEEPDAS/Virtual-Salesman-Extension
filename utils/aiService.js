// AI Service for product recommendations using Gemini
class AIService {
  constructor() {
    this.apiKey = null;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
    this.initialized = false;
  }

  async initialize() {
    try {
      // Get API key from storage
      const result = await chrome.storage.sync.get('geminiApiKey');
      if (result.geminiApiKey) {
        this.apiKey = result.geminiApiKey;
        this.initialized = true;
        console.log('AI Service initialized successfully');
        return true;
      } else {
        console.warn('Gemini API key not found in storage');
        return false;
      }
    } catch (error) {
      console.error('Failed to initialize AI Service:', error);
      return false;
    }
  }

  async analyzeAndRecommend(userQuery, products, parsedQuery) {
    if (!this.initialized) {
      const initResult = await this.initialize();
      if (!initResult) {
        throw new Error('AI Service not initialized. Please set up your Gemini API key.');
      }
    }

    try {
      const prompt = this.buildPrompt(userQuery, products, parsedQuery);
      const response = await this.callGeminiAPI(prompt);
      return this.parseAIResponse(response, products);
    } catch (error) {
      console.error('AI analysis failed:', error);
      throw error;
    }
  }

  buildPrompt(userQuery, products, parsedQuery) {
    const productsData = products.map((product, index) => ({
      id: index,
      title: product.title,
      price: product.price,
      category: product.category,
      specs: product.specs,
      rating: product.rating,
      site: product.site
    }));

    return `You are an expert PC hardware salesman assistant. Analyze the user's query and recommend the best products from the available options.

User Query: "${userQuery}"

Parsed Requirements:
- Budget: ${parsedQuery.budget ? `₹${parsedQuery.budget.amount} (${parsedQuery.budget.operator})` : 'Not specified'}
- Categories: ${parsedQuery.categories.length > 0 ? parsedQuery.categories.join(', ') : 'Not specified'}
- Purpose: ${parsedQuery.purpose}
- Brands: ${parsedQuery.brands.length > 0 ? parsedQuery.brands.join(', ') : 'Not specified'}
- Specs: ${JSON.stringify(parsedQuery.specs)}

Available Products:
${JSON.stringify(productsData, null, 2)}

Instructions:
1. Analyze each product against the user's requirements
2. Consider price, specifications, brand preferences, and purpose
3. Score each product from 0-100 based on how well it matches the requirements
4. Provide recommendations in order of relevance
5. Explain why each product is recommended
6. If building a complete PC, suggest compatible components
7. Warn about any potential compatibility issues
8. Consider price-to-performance ratio

Respond in JSON format:
{
  "recommendations": [
    {
      "productId": 0,
      "score": 95,
      "reason": "Detailed explanation of why this product is recommended",
      "pros": ["List of advantages"],
      "cons": ["List of disadvantages or limitations"],
      "compatibility": "Notes about compatibility with other components"
    }
  ],
  "summary": "Overall recommendation summary and advice",
  "buildSuggestion": "If applicable, suggest a complete build with total cost",
  "alternatives": "Suggest alternatives if budget allows or if certain products are unavailable"
}`;
  }

  async callGeminiAPI(prompt) {
    if (!this.apiKey) {
      throw new Error('Gemini API key not available');
    }

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    };

    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  }

  parseAIResponse(response, products) {
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const aiAnalysis = JSON.parse(jsonMatch[0]);
      
      // Map product IDs back to actual products
      const recommendations = aiAnalysis.recommendations.map(rec => ({
        product: products[rec.productId],
        score: rec.score,
        reason: rec.reason,
        pros: rec.pros || [],
        cons: rec.cons || [],
        compatibility: rec.compatibility || ''
      }));

      return {
        recommendations: recommendations,
        summary: aiAnalysis.summary || '',
        buildSuggestion: aiAnalysis.buildSuggestion || '',
        alternatives: aiAnalysis.alternatives || ''
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Fallback to simple filtering if AI parsing fails
      return this.fallbackRecommendation(products);
    }
  }

  fallbackRecommendation(products) {
    // Simple fallback recommendation system
    const sortedProducts = products
      .filter(product => product.title && product.price)
      .sort((a, b) => {
        // Simple scoring based on rating and price
        const scoreA = this.calculateFallbackScore(a);
        const scoreB = this.calculateFallbackScore(b);
        return scoreB - scoreA;
      })
      .slice(0, 5);

    const recommendations = sortedProducts.map(product => ({
      product: product,
      score: this.calculateFallbackScore(product),
      reason: 'Recommended based on rating and price analysis',
      pros: ['Good rating', 'Competitive price'],
      cons: ['Limited analysis without AI'],
      compatibility: 'Please verify compatibility manually'
    }));

    return {
      recommendations: recommendations,
      summary: 'AI analysis unavailable. Showing products sorted by rating and price.',
      buildSuggestion: 'Please consult with hardware experts for complete build suggestions.',
      alternatives: 'Consider checking user reviews and specifications manually.'
    };
  }

  calculateFallbackScore(product) {
    let score = 50; // Base score
    
    // Add points for rating
    if (product.rating) {
      const rating = parseFloat(product.rating);
      if (!isNaN(rating)) {
        score += rating * 10;
      }
    }
    
    // Add points for having detailed specs
    if (product.specs && Object.keys(product.specs).length > 0) {
      score += 10;
    }
    
    // Add points for recognized brands/categories
    if (product.category && product.category !== 'other') {
      score += 10;
    }
    
    return Math.min(score, 100);
  }

  // Method to set API key
  async setApiKey(apiKey) {
    try {
      await chrome.storage.sync.set({ geminiApiKey: apiKey });
      this.apiKey = apiKey;
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to save API key:', error);
      return false;
    }
  }

  // Method to check if API key is set
  async hasApiKey() {
    try {
      const result = await chrome.storage.sync.get('geminiApiKey');
      return !!result.geminiApiKey;
    } catch (error) {
      console.error('Failed to check API key:', error);
      return false;
    }
  }
}

// Make it available globally
window.AIService = AIService;
