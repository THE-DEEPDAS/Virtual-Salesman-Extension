class QueryParser {
  constructor() {
    this.categories = {
      'processor': ['processor', 'cpu', 'intel', 'amd', 'ryzen', 'core i3', 'core i5', 'core i7', 'core i9'],
      'graphics_card': ['graphics card', 'gpu', 'geforce', 'radeon', 'rtx', 'gtx', 'rx', 'video card'],
      'motherboard': ['motherboard', 'mobo', 'mainboard', 'board'],
      'ram': ['ram', 'memory', 'ddr4', 'ddr5'],
      'storage': ['ssd', 'hdd', 'hard drive', 'nvme', 'storage', 'disk'],
      'power_supply': ['power supply', 'psu', 'smps'],
      'case': ['case', 'cabinet', 'tower', 'chassis'],
      'cooling': ['cooler', 'fan', 'liquid cooling', 'aio', 'cooling'],
      'monitor': ['monitor', 'display', 'screen', 'lcd', 'led'],
      'keyboard': ['keyboard', 'mechanical keyboard'],
      'mouse': ['mouse', 'gaming mouse'],
      'laptop': ['laptop', 'notebook'],
      'desktop': ['desktop', 'pc', 'computer', 'gaming pc', 'workstation']
    };
  }

  parseQuery(query) {
    const queryLower = query.toLowerCase();
    const parsed = {
      budget: this.extractBudget(queryLower),
      categories: this.extractCategories(queryLower),
      specs: this.extractSpecs(queryLower),
      brands: this.extractBrands(queryLower),
      purpose: this.extractPurpose(queryLower),
      originalQuery: query
    };

    return parsed;
  }

  extractBudget(query) {
    // Extract budget patterns like "under 50000", "below 1 lakh", "around 75k", etc.
    const budgetPatterns = [
      /(?:under|below|less than|up to)\s*(?:rs\.?|₹)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:k|thousand|lakh|crore)?/i,
      /(?:around|about|approximately)\s*(?:rs\.?|₹)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:k|thousand|lakh|crore)?/i,
      /(?:budget|price)\s*(?:of|is|around)?\s*(?:rs\.?|₹)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:k|thousand|lakh|crore)?/i,
      /(?:rs\.?|₹)\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:k|thousand|lakh|crore)?/i
    ];

    for (const pattern of budgetPatterns) {
      const match = query.match(pattern);
      if (match) {
        let amount = parseFloat(match[1].replace(/,/g, ''));
        
        // Convert based on suffix
        if (query.includes('k') || query.includes('thousand')) {
          amount *= 1000;
        } else if (query.includes('lakh')) {
          amount *= 100000;
        } else if (query.includes('crore')) {
          amount *= 10000000;
        }
        
        return {
          amount: amount,
          operator: query.includes('under') || query.includes('below') || query.includes('less than') ? 'under' : 'around'
        };
      }
    }
    
    return null;
  }

  extractCategories(query) {
    const foundCategories = [];
    
    for (const [category, keywords] of Object.entries(this.categories)) {
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          foundCategories.push(category);
          break;
        }
      }
    }
    
    return foundCategories;
  }

  extractSpecs(query) {
    const specs = {};
    
    // Extract RAM
    const ramMatch = query.match(/(\d+)\s*gb\s*(?:ram|memory|ddr)/i);
    if (ramMatch) {
      specs.ram = parseInt(ramMatch[1]);
    }
    
    // Extract storage
    const storageMatch = query.match(/(\d+)\s*(gb|tb)\s*(?:ssd|hdd|storage)/i);
    if (storageMatch) {
      specs.storage = {
        size: parseInt(storageMatch[1]),
        unit: storageMatch[2].toLowerCase(),
        type: query.includes('ssd') ? 'ssd' : 'hdd'
      };
    }
    
    // Extract graphics requirements
    if (query.includes('gaming') || query.includes('gpu') || query.includes('graphics')) {
      specs.graphics = 'dedicated';
    }
    
    // Extract processor generation/type
    const processorMatch = query.match(/(intel|amd|ryzen|core)\s*(?:i)?(\d+)/i);
    if (processorMatch) {
      specs.processor = {
        brand: processorMatch[1].toLowerCase(),
        series: processorMatch[2]
      };
    }
    
    return specs;
  }

  extractBrands(query) {
    const brands = {
      'intel': ['intel'],
      'amd': ['amd', 'ryzen'],
      'nvidia': ['nvidia', 'geforce', 'rtx', 'gtx'],
      'asus': ['asus'],
      'msi': ['msi'],
      'gigabyte': ['gigabyte'],
      'corsair': ['corsair'],
      'gskill': ['g.skill', 'gskill'],
      'samsung': ['samsung'],
      'western_digital': ['wd', 'western digital'],
      'seagate': ['seagate'],
      'hp': ['hp', 'hewlett packard'],
      'dell': ['dell'],
      'lenovo': ['lenovo'],
      'acer': ['acer']
    };
    
    const foundBrands = [];
    
    for (const [brand, keywords] of Object.entries(brands)) {
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          foundBrands.push(brand);
          break;
        }
      }
    }
    
    return foundBrands;
  }

  extractPurpose(query) {
    const purposes = {
      'gaming': ['gaming', 'game', 'gamer', 'fps', 'esports'],
      'work': ['work', 'office', 'business', 'productivity', 'professional'],
      'programming': ['programming', 'coding', 'development', 'developer', 'software'],
      'content_creation': ['video editing', 'content creation', 'streaming', 'youtube', 'creator'],
      'study': ['study', 'student', 'education', 'learning'],
      'home': ['home', 'family', 'basic', 'everyday']
    };
    
    for (const [purpose, keywords] of Object.entries(purposes)) {
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          return purpose;
        }
      }
    }
    
    return 'general';
  }

  // Method to generate search terms for the parsed query
  generateSearchTerms(parsedQuery) {
    const searchTerms = [];
    
    // Add categories as search terms
    if (parsedQuery.categories.length > 0) {
      searchTerms.push(...parsedQuery.categories);
    }
    
    // Add purpose-based terms
    if (parsedQuery.purpose === 'gaming') {
      searchTerms.push('gaming');
    }
    
    // Add brand terms
    if (parsedQuery.brands.length > 0) {
      searchTerms.push(...parsedQuery.brands);
    }
    
    // Add spec-based terms
    if (parsedQuery.specs.ram) {
      searchTerms.push(`${parsedQuery.specs.ram}GB RAM`);
    }
    
    if (parsedQuery.specs.storage) {
      searchTerms.push(`${parsedQuery.specs.storage.size}${parsedQuery.specs.storage.unit} ${parsedQuery.specs.storage.type}`);
    }
    
    return searchTerms;
  }
}

// Legacy function for backward compatibility
function parseUserQuery(query) {
  const parser = new QueryParser();
  const parsed = parser.parseQuery(query);
  return {
    budget: parsed.budget?.amount || null,
    categories: parsed.categories,
    specs: parsed.specs,
    keywords: query.toLowerCase().split(/[^a-zA-Z0-9]/).filter(w => w.length > 2),
    originalQuery: query
  };
}

// Make it available globally
window.QueryParser = QueryParser;

console.log("QueryParser script executed");
