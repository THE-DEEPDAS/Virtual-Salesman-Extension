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
        productCards: '[data-component-type="s-search-result"], [data-asin]:not([data-asin=""])',
        title: 'h2 a span, .a-size-mini span, .a-size-base-plus, .a-size-medium',
        price: '.a-price-whole, .a-offscreen, .a-price .a-offscreen',
        rating: '.a-icon-alt, .a-star-medium .a-icon-alt',
        image: '.s-image, .a-dynamic-image',
        link: 'h2 a, .a-link-normal',
        availability: '.a-color-success, .a-color-price, .a-color-base'
      },
      flipkart: {
        productCards: '._1AtVbE, ._13oc-S, ._2kHMtA, .s1Q9rs, ._3pLy-c',
        title: '._4rR01T, .s1Q9rs, ._3pLy-c .IRpwTa, .KzDlHZ',
        price: '._30jeq3, ._1_TUVl, .Nx9bqj, ._30jeq3._1_TUVl',
        rating: '._3LWZlK, .gUuXy-, ._2_R_DZ',
        image: '._396cs4, ._2r_T1I, .DByuf4',
        link: 'a, ._1fQZEK',
        availability: '._2D5lwg, .DeR9-s'
      }
    };
    return selectors[this.siteName] || selectors.amazon;
  }

  extractProducts() {
    console.log(`Extracting products from ${this.siteName}`);
    const productCards = document.querySelectorAll(this.selectors.productCards);
    console.log(`Found ${productCards.length} product cards`);
    
    const products = [];
    
    productCards.forEach((card, index) => {
      try {
        const product = this.extractProductFromCard(card, index);
        if (product && product.title && product.price) {
          products.push(product);
        }
      } catch (error) {
        console.error(`Error extracting product ${index}:`, error);
      }
    });

    console.log(`Successfully extracted ${products.length} products`);
    return products;
  }

  extractProductFromCard(card, index) {
    const titleEl = card.querySelector(this.selectors.title);
    const priceEl = card.querySelector(this.selectors.price);
    const ratingEl = card.querySelector(this.selectors.rating);
    const imageEl = card.querySelector(this.selectors.image);
    const linkEl = card.querySelector(this.selectors.link);

    const title = this.extractText(titleEl);
    const price = this.extractPrice(priceEl);
    const rating = this.extractRating(ratingEl);
    const image = this.extractImage(imageEl);
    const link = this.extractLink(linkEl);

    if (!title || !price) {
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
    return element.textContent?.trim() || element.innerText?.trim() || '';
  }

  extractPrice(element) {
    if (!element) return '';
    
    const priceText = this.extractText(element);
    
    // Remove currency symbols and extract numeric value
    const priceMatch = priceText.match(/[\d,]+(?:\.\d{2})?/);
    if (priceMatch) {
      const numericPrice = priceMatch[0].replace(/,/g, '');
      return `₹${numericPrice}`;
    }
    
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
    
    const href = element.href || element.getAttribute('href') || '';
    
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
    return productCards.length > 0;
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
