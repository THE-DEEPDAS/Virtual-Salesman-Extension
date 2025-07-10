# SalesmanBot - AI PC Assistant

A powerful Chrome extension that acts as your personal AI salesman for finding PC parts and builds on e-commerce websites like Amazon and Flipkart.

## Features

🤖 **AI-Powered Recommendations**: Uses Google's Gemini-1.5-flash to analyze products and provide intelligent recommendations
💰 **Budget-Aware Filtering**: Understands budget constraints and filters products accordingly
🔍 **Smart Query Parsing**: Parses natural language queries to understand specs, brands, and requirements
⚡ **Real-time Analysis**: Extracts and analyzes products from current page
🛒 **Multi-Site Support**: Works on Amazon India, Amazon.com, and Flipkart
📊 **Detailed Product Info**: Shows ratings, specs, compatibility notes, and pros/cons

## Installation

1. **Download the Extension**
   - Clone or download this repository
   - Ensure all files are in the `Salesman Bot Extension` folder

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked" and select the extension folder
   - The SalesmanBot icon should appear in your toolbar

3. **Get Gemini API Key**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a free API key
   - Copy the key for setup

## Setup & Usage

### Initial Setup
1. **Navigate to a supported site**: Amazon India, Amazon.com, or Flipkart
2. **Click the extension icon** to open the popup
3. **Enter your Gemini API key** when prompted
4. **Click "Setup AI"** to enable AI-powered recommendations

### Using the Extension
1. **Go to a product listing page** (search results, category pages)
2. **Open the extension popup**
3. **Type your query** in natural language, for example:
   - "gaming PC under ₹70,000 with 16GB RAM and SSD"
   - "Intel processor for video editing under ₹25,000"
   - "RTX graphics card for 1080p gaming"
   - "laptop for programming under ₹60,000"

### Query Examples
- **Budget queries**: "under ₹50,000", "around 1 lakh", "budget of ₹75k"
- **Spec queries**: "16GB RAM", "1TB SSD", "Intel Core i5", "RTX 3060"
- **Purpose queries**: "gaming", "video editing", "programming", "office work"
- **Brand queries**: "Intel", "AMD", "ASUS", "MSI", "Corsair"

## How It Works

### 1. Product Extraction
- **Smart Selectors**: Uses advanced CSS selectors to extract product information
- **Multi-Site Support**: Different extraction logic for Amazon and Flipkart
- **Rich Data**: Extracts title, price, rating, images, specs, and links

### 2. Query Parsing
- **Natural Language Processing**: Understands budget, specs, brands, and purpose
- **Budget Recognition**: Handles various formats (₹50k, 1 lakh, under 75000)
- **Spec Extraction**: Identifies RAM, storage, processors, graphics cards
- **Brand Detection**: Recognizes major PC component brands

### 3. AI Analysis
- **Gemini Integration**: Uses Google's Gemini-1.5-flash for intelligent analysis
- **Compatibility Checking**: Warns about potential compatibility issues
- **Score-based Ranking**: Provides match scores for each product
- **Detailed Explanations**: Explains why products are recommended

### 4. Smart Filtering
- **Budget Filtering**: Respects budget constraints with tolerance
- **Category Matching**: Filters by component categories
- **Brand Preferences**: Prioritizes preferred brands
- **Spec Requirements**: Ensures minimum specifications are met

## File Structure

```
Salesman Bot Extension/
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup interface
├── popup.js              # Popup logic and UI handling
├── content.js            # Main content script
├── background.js         # Background service worker
├── style.css             # Popup styling
├── Salesman bot.png      # Extension icon
└── utils/
    ├── productExtractor.js   # Product extraction logic
    ├── queryParser.js        # Query parsing and analysis
    └── aiService.js          # Gemini AI integration
```

## Technical Details

### Supported Sites
- **Amazon India** (`*.amazon.in`)
- **Amazon.com** (`*.amazon.com`)
- **Flipkart** (`*.flipkart.com`)

### Permissions Required
- `scripting`: To inject content scripts
- `activeTab`: To access current tab content
- `storage`: To save API key and preferences
- `notifications`: To show helpful notifications
- `contextMenus`: For right-click menu options

### API Usage
- **Google Gemini API**: For AI-powered product analysis
- **Free Tier Available**: Generous free quotas for personal use
- **Secure Storage**: API key stored locally in Chrome storage

## Privacy & Security

- **Local Processing**: All data processing happens locally
- **No Data Collection**: Extension doesn't collect or store personal data
- **Secure API Key Storage**: API key stored in Chrome's secure storage
- **No External Tracking**: No analytics or tracking scripts

## Troubleshooting

### Content Script Not Loading
1. **Check URL**: Ensure you're on Amazon or Flipkart
2. **Reload Extension**: Go to `chrome://extensions/` and click reload
3. **Refresh Page**: Reload the e-commerce page
4. **Check Console**: Open DevTools and check for errors

### AI Not Working
1. **Verify API Key**: Ensure you've entered a valid Gemini API key
2. **Check Quota**: Verify your API quota hasn't been exceeded
3. **Network Issues**: Check internet connection and try again

### No Products Found
1. **Navigate to Listings**: Go to search results or category pages
2. **Wait for Load**: Let the page fully load before using extension
3. **Try Different Page**: Some specialized pages may not be supported

## Development

### Adding New Sites
1. **Update Manifest**: Add new URL patterns to `matches` and `host_permissions`
2. **Extend ProductExtractor**: Add selectors for the new site
3. **Test Thoroughly**: Ensure all functionality works on new site

### Customizing AI Prompts
- **Edit `aiService.js`**: Modify the `buildPrompt` method
- **Adjust Parameters**: Change temperature, max tokens for different responses
- **Add New Features**: Extend the analysis capabilities

## Support

For issues, feature requests, or contributions:
1. **Check Console**: Look for error messages in browser console
2. **Reload Extension**: Try reloading the extension first
3. **Test on Different Pages**: Some pages may have different layouts

## License

This project is for educational and personal use. Ensure compliance with website terms of service when using.

---

**Happy PC Building! 🛠️**
