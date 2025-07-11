# 🤖 SalesmanBot - AI PC Assistant

## 🎯 Walmart Sparkathon 2025 Submission

**"Reimagining Customer Experience"**

SalesmanBot is an intelligent Chrome/Firefox extension that serves as your personal AI-powered shopping assistant for PC components. Specifically designed for **Walmart Sparkathon 2025**, this extension transforms the shopping experience on Walmart.com with context-aware AI recommendations.

## ✨ Key Features

### 🧠 AI-Powered Intelligence
- **Context-Aware Recommendations**: Uses Google Gemini AI with learned user preferences
- **Smart Product Analysis**: Intelligent matching based on specifications and compatibility
- **Preference Learning**: Adapts to your shopping patterns over time
- **Natural Language Processing**: Understands complex queries like "gaming laptop under $1000 with RTX graphics"

### 🛒 Enhanced Shopping Experience
- **Multi-Platform Support**: Works on Walmart.com (primary), Amazon, and Flipkart
- **Real-Time Product Extraction**: Advanced CSS selectors with fallback mechanisms
- **Budget Intelligence**: Learns your spending patterns and suggests alternatives
- **Brand Preference Tracking**: Remembers your preferred manufacturers

### 🎨 Modern UI/UX
- **Beautiful Popup Interface**: Clean, modern design with Walmart brand alignment
- **Smart Context Sidebar**: Real-time display of learned preferences and insights
- **Responsive Design**: Optimized for all screen sizes and devices

## 🚀 Installation

### Chrome Installation:
1. Enable Developer Mode in `chrome://extensions/`
2. Click "Load unpacked" and select the extension folder
3. Pin the extension for easy access

### Firefox Installation:
1. Go to `about:debugging`
2. Click "Load Temporary Add-on"
3. Select the `manifest.json` file

## 🔑 Setup

1. **Get Gemini API Key**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Configure Extension**: Click SalesmanBot icon and enter your API key
3. **Start Shopping**: Visit Walmart.com and begin your AI-enhanced shopping experience

## 🎮 Usage

1. **Visit Walmart.com** (or supported sites)
2. **Click SalesmanBot Icon**
3. **Ask Natural Questions**: "Best gaming laptop for $1200" or "RTX 4060 graphics cards"
4. **Get Smart Recommendations** with context-aware insights
5. **View Learning Sidebar** to see your preference patterns

## 🏆 Walmart Sparkathon Innovation

### Reimagining Customer Experience Through:

- **Personalization at Scale**: Individual preference learning
- **AI-Driven Assistance**: Intelligent product discovery
- **Context-Aware Shopping**: Session and historical context integration
- **Modern Interface Design**: Intuitive, beautiful user experience

## 🛡️ Privacy & Security

- ✅ **Local Data Storage**: All preferences stored on your device
- ✅ **Secure Communications**: HTTPS for all API calls
- ✅ **No Personal Data Collection**: Privacy-first design
- ✅ **Open Source**: Transparent, auditable code

## 📁 Project Structure

```
├── manifest.json              # Extension configuration
├── background.js             # Service worker & storage management
├── content.js               # Main orchestrator & message routing
├── popup.html/js            # Main interface & AI interaction
├── sidebar.html/js          # Context display & preference tracking
├── style.css               # Modern UI styling
└── utils/
    ├── aiService.js        # Gemini AI integration
    ├── contextTracker.js   # Preference learning engine
    ├── productExtractor.js # Multi-site product extraction
    └── queryParser.js      # Natural language processing
```

## 🔧 Technical Highlights

- **Advanced Product Extraction**: Multi-tier CSS selector fallbacks
- **Context-Aware AI Prompts**: Dynamic prompt engineering with user context
- **Real-Time Preference Learning**: Adaptive recommendation engine
- **Cross-Browser Compatibility**: Chrome & Firefox support
- **Security-First Design**: Safe DOM manipulation, input sanitization

## 📊 Supported Platforms

| Platform | Status | Special Features |
|----------|--------|------------------|
| **Walmart.com** | ✅ Primary Focus | Optimized selectors, enhanced UX |
| Amazon.com | ✅ Full Support | Comprehensive product extraction |
| Flipkart.com | ✅ Full Support | Regional pricing & preferences |

## 🎉 Get Started

Ready to revolutionize your PC shopping experience? Install SalesmanBot and discover intelligent, personalized recommendations that learn and adapt to your needs!

---

*Proudly built for Walmart Sparkathon 2025 🛒*
