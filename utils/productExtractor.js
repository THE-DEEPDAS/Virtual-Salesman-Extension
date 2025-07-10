// Product extractor utility for different e-commerce sites
class ProductExtractor {
  constructor() {
    this.siteName = this.detectSite();
    this.selectors = this.getSelectors();
  }

  detectSite() {
    const hostname = window.location.hostname;
    if (hostname.includes('amazon')) return 'amazon';
    if (hostname.includes('flipkart')) return 'flipkart';
    return 'unknown';
  }

  getSelectors() {
    const selectors = {
      amazon: {
        // More comprehensive selectors for Amazon
        productCards: [
          '[data-component-type="s-search-result"]',
          '[data-asin]:not([data-asin=""])',
          '.s-result-item',
          '.sg-col-inner .s-widget-container',
          '.s-card-container'
        ].join(', '),
        title: [
          '[data-cy="title-recipe-title"] span',
          'h2 a span',
          '.a-size-mini span',
          '.a-size-base-plus',
          '.a-size-medium',
          '.s-size-mini',
          'h2.a-size-mini span',
          '.a-link-normal .a-text-normal'
        ].join(', '),
        price: [
          '.a-price-whole',
          '.a-offscreen',
          '.a-price .a-offscreen',
          '.a-price-range',
          '.s-price-instructions-style',
          '.a-color-price',
          '.a-price-symbol'
        ].join(', '),
        rating: [
          '.a-icon-alt',
          '.a-star-medium .a-icon-alt',
          '.a-declarative .a-icon-alt',
          '.s-link-style .a-icon-alt'
        ].join(', '),
        image: [
          '.s-image',
          '.a-dynamic-image',
          '.s-product-image-container img',
          'img[data-image-latency]'
        ].join(', '),
        link: [
          'h2 a',
          '.a-link-normal',
          '.s-link-style',
          'a[data-csa-c-type="link"]'
        ].join(', '),
        availability: [
          '.a-color-success',
          '.a-color-price',
          '.a-color-base',
          '.s-availability-text'
        ].join(', ')
      },
      flipkart: {
        // Updated selectors for Flipkart
        productCards: [
          '._1AtVbE',
          '._13oc-S',
          '._2kHMtA',
          '.s1Q9rs',
          '._3pLy-c',
          '._2-gKeQ',
          '._1fQZEK',
          '._3O0U0u'
        ].join(', '),
        title: [
          '._4rR01T',
          '.s1Q9rs',
          '._3pLy-c .IRpwTa',
          '.KzDlHZ',
          '._2WkVRV',
          '.IRpwTa',
          '._4rR01T'
        ].join(', '),
        price: [
          '._30jeq3',
          '._1_TUVl',
          '.Nx9bqj',
          '._30jeq3._1_TUVl',
          '._25b18c'
        ].join(', '),
        rating: [
          '._3LWZlK',
          '.gUuXy-',
          '._2_R_DZ',
          '._3LWZlK',
          '.XQDdHH'
        ].join(', '),
        image: [
          '._396cs4',
          '._2r_T1I',
          '.DByuf4',
          '._396cs4',
          '._2r_T1I'
        ].join(', '),
        link: [
          'a',
          '._1fQZEK',
          '._2rpwqI'
        ].join(', '),
        availability: [
          '._2D5lwg',
          '.DeR9-s'
        ].join(', ')
      }
    };
    return selectors[this.siteName] || selectors.amazon;
  }

  extractProducts() {
    console.log(`Extracting products from ${this.siteName}`);
    console.log(`Using selectors:`, this.selectors);
    
    const productCards = document.querySelectorAll(this.selectors.productCards);
    console.log(`Found ${productCards.length} product cards with selector: ${this.selectors.productCards}`);
    
    // If no products found with primary selectors, try fallback selectors
    if (productCards.length === 0) {
      console.log('No products found with primary selectors, trying fallback...');
      return this.extractProductsFallback();
    }
    
    const products = [];
    
    productCards.forEach((card, index) => {
      try {
        console.log(`Processing card ${index}:`, card);
        const product = this.extractProductFromCard(card, index);
        if (product && product.title && product.price) {
          console.log(`Successfully extracted product ${index}:`, product);
          products.push(product);
        } else {
          console.log(`Failed to extract product ${index} - missing title or price`);
        }
      } catch (error) {
        console.error(`Error extracting product ${index}:`, error);
      }
    });

    console.log(`Successfully extracted ${products.length} products`);
    return products;
  }

  extractProductsFallback() {
    console.log('Trying fallback extraction methods...');
    
    // Fallback selectors for when primary ones don't work
    const fallbackSelectors = {
      amazon: [
        '.s-result-item',
        '[data-asin]',
        '.sg-col-inner',
        '.s-widget-container'
      ],
      flipkart: [
        '[data-id]',
        '.col',
        '._1AtVbE',
        '._13oc-S'
      ]
    };
    
    const selectors = fallbackSelectors[this.siteName] || fallbackSelectors.amazon;
    
    for (const selector of selectors) {
      const cards = document.querySelectorAll(selector);
      console.log(`Trying fallback selector "${selector}": found ${cards.length} elements`);
      
      if (cards.length > 0) {
        // Update selectors for this fallback
        this.selectors.productCards = selector;
        const products = [];
        
        cards.forEach((card, index) => {
          try {
            const product = this.extractProductFromCard(card, index);
            if (product && product.title && product.price) {
              products.push(product);
            }
          } catch (error) {
            console.error(`Error in fallback extraction ${index}:`, error);
          }
        });
        
        if (products.length > 0) {
          console.log(`Fallback extraction successful: ${products.length} products`);
          return products;
        }
      }
    }
    
    console.log('All fallback methods failed');
    return [];
  }

  extractProductFromCard(card, index) {
    console.log(`Extracting from card ${index}:`, card);
    
    const titleEl = card.querySelector(this.selectors.title);
    const priceEl = card.querySelector(this.selectors.price);
    const ratingEl = card.querySelector(this.selectors.rating);
    const imageEl = card.querySelector(this.selectors.image);
    const linkEl = card.querySelector(this.selectors.link);

    console.log(`Elements found for card ${index}:`, {
      title: !!titleEl,
      price: !!priceEl,
      rating: !!ratingEl,
      image: !!imageEl,
      link: !!linkEl
    });

    const title = this.extractText(titleEl);
    const price = this.extractPrice(priceEl);
    const rating = this.extractRating(ratingEl);
    const image = this.extractImage(imageEl);
    const link = this.extractLink(linkEl);

    console.log(`Extracted data for card ${index}:`, {
      title: title.substring(0, 50) + '...',
      price,
      rating,
      hasImage: !!image,
      hasLink: !!link
    });

    if (!title || !price) {
      console.log(`Skipping card ${index} - missing title (${!!title}) or price (${!!price})`);
      return null;
    }

    return {
      id: `${this.siteName}_${index}_${Date.now()}`,
      title: title,
      price: price,
      rating: rating,
      image: image,
      url: link,
      site: this.siteName,
      category: this.categorizeProduct(title),
      specs: this.extractSpecs(title)
    };
  }

  extractText(element) {
    if (!element) return '';
    
    // Try different text extraction methods
    let text = element.textContent?.trim() || 
               element.innerText?.trim() || 
               element.getAttribute?.('aria-label')?.trim() || 
               element.getAttribute?.('title')?.trim() || 
               '';
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }

  extractPrice(element) {
    if (!element) return '';
    
    let priceText = this.extractText(element);
    console.log(`Raw price text: "${priceText}"`);
    
    // If element has aria-label, try that too
    if (!priceText && element.getAttribute) {
      priceText = element.getAttribute('aria-label') || '';
    }
    
    // If still no text, try parent elements
    if (!priceText && element.parentElement) {
      priceText = this.extractText(element.parentElement);
    }
    
    if (!priceText) return '';
    
    // Remove extra whitespace and normalize
    priceText = priceText.replace(/\s+/g, ' ').trim();
    
    // Try different price patterns
    const pricePatterns = [
      /₹\s*[\d,]+(?:\.\d{2})?/g,  // ₹ symbol with digits
      /Rs\.?\s*[\d,]+(?:\.\d{2})?/gi,  // Rs with digits
      /[\d,]+\s*rupees?/gi,  // digits with rupees
      /[\d,]+(?:\.\d{2})?/g   // just digits
    ];
    
    for (const pattern of pricePatterns) {
      const matches = priceText.match(pattern);
      if (matches && matches.length > 0) {
        let price = matches[0];
        // Extract just the numeric part
        const numericMatch = price.match(/[\d,]+(?:\.\d{2})?/);
        if (numericMatch) {
          const numericPrice = numericMatch[0].replace(/,/g, '');
          console.log(`Extracted price: ₹${numericPrice}`);
          return `₹${numericPrice}`;
        }
      }
    }
    
    console.log(`Could not extract price from: "${priceText}"`);
    return priceText;
  }

  extractRating(element) {
    if (!element) return '';
    
    const ratingText = this.extractText(element);
    const ratingMatch = ratingText.match(/(\d+\.?\d*)\s*out of\s*5/i) || 
                       ratingText.match(/(\d+\.?\d*)/);
    
    return ratingMatch ? ratingMatch[1] : ratingText;
  }

  extractImage(element) {
    if (!element) return '';
    
    return element.src || element.getAttribute('data-src') || '';
  }

  extractLink(element) {
    if (!element) return window.location.href;
    
    // If element is not a link, try to find a link within it
    let linkEl = element;
    if (element.tagName !== 'A') {
      linkEl = element.querySelector('a') || element.closest('a');
    }
    
    if (!linkEl) return window.location.href;
    
    const href = linkEl.href || linkEl.getAttribute('href') || '';
    
    if (href.startsWith('/')) {
      return window.location.origin + href;
    }
    
    return href || window.location.href;
  }

  categorizeProduct(title) {
    const titleLower = title.toLowerCase();
    
    const categories = {
      'processor': ['processor', 'cpu', 'intel', 'amd', 'ryzen', 'core i3', 'core i5', 'core i7', 'core i9'],
      'graphics_card': ['graphics card', 'gpu', 'geforce', 'radeon', 'rtx', 'gtx', 'rx'],
      'motherboard': ['motherboard', 'mobo', 'mainboard'],
      'ram': ['ram', 'memory', 'ddr4', 'ddr5', 'corsair vengeance', 'g.skill'],
      'storage': ['ssd', 'hdd', 'hard drive', 'nvme', 'storage'],
      'power_supply': ['power supply', 'psu', 'smps'],
      'case': ['case', 'cabinet', 'tower'],
      'cooling': ['cooler', 'fan', 'liquid cooling', 'aio'],
      'monitor': ['monitor', 'display', 'lcd', 'led'],
      'keyboard': ['keyboard', 'mechanical'],
      'mouse': ['mouse', 'gaming mouse'],
      'laptop': ['laptop', 'notebook'],
      'desktop': ['desktop', 'pc', 'computer']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => titleLower.includes(keyword))) {
        return category;
      }
    }
    
    return 'other';
  }

  extractSpecs(title) {
    const specs = {};
    const titleLower = title.toLowerCase();
    
    // Extract RAM size
    const ramMatch = titleLower.match(/(\d+)\s*gb\s*(ram|memory|ddr)/);
    if (ramMatch) {
      specs.ram = `${ramMatch[1]}GB`;
    }
    
    // Extract storage
    const storageMatch = titleLower.match(/(\d+)\s*(gb|tb)\s*(ssd|hdd|storage)/);
    if (storageMatch) {
      specs.storage = `${storageMatch[1]}${storageMatch[2].toUpperCase()} ${storageMatch[3].toUpperCase()}`;
    }
    
    // Extract processor info
    const processorMatch = titleLower.match(/(intel|amd|ryzen|core)\s*(i\d|ryzen\s*\d|\d+)/);
    if (processorMatch) {
      specs.processor = processorMatch[0];
    }
    
    // Extract graphics card
    const gpuMatch = titleLower.match(/(rtx|gtx|rx)\s*\d+/);
    if (gpuMatch) {
      specs.graphics = gpuMatch[0];
    }
    
    return specs;
  }

  // Method to check if current page has products
  hasProducts() {
    const productCards = document.querySelectorAll(this.selectors.productCards);
    console.log(`hasProducts check: found ${productCards.length} cards with primary selectors`);
    
    if (productCards.length > 0) {
      return true;
    }
    
    // Try fallback selectors
    const fallbackSelectors = {
      amazon: [
        '.s-result-item',
        '[data-asin]',
        '.sg-col-inner',
        '.s-widget-container'
      ],
      flipkart: [
        '[data-id]',
        '.col',
        '._1AtVbE',
        '._13oc-S'
      ]
    };
    
    const selectors = fallbackSelectors[this.siteName] || fallbackSelectors.amazon;
    
    for (const selector of selectors) {
      const cards = document.querySelectorAll(selector);
      console.log(`hasProducts fallback check with "${selector}": found ${cards.length} elements`);
      if (cards.length > 0) {
        return true;
      }
    }
    
    return false;
  }

  // Method to wait for products to load
  async waitForProducts(timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (this.hasProducts()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return false;
  }
}

// Make it available globally
window.ProductExtractor = ProductExtractor;
