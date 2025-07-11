// Safe DOM manipulation utilities
function createSafeElement(tag, className = '', textContent = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (textContent) element.textContent = textContent;
    return element;
}

function clearAndAppendSafe(container, elements) {
    // Clear container safely
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    // Append new elements
    if (Array.isArray(elements)) {
        elements.forEach(el => {
            if (el instanceof Node) {
                container.appendChild(el);
            }
        });
    } else if (elements instanceof Node) {
        container.appendChild(elements);
    }
}

function createNoDataElement(message = 'No data yet') {
    return createSafeElement('div', 'no-data', message);
}

function createPreferenceItem(label, value, confidence = 0) {
    const item = createSafeElement('div', 'preference-item');
    
    const labelSpan = createSafeElement('span', '', label);
    const valueSpan = createSafeElement('span', 'preference-value', value);
    
    // Create confidence bar
    const confidenceBar = createSafeElement('div', 'confidence-bar');
    const confidenceFill = createSafeElement('div', 'confidence-fill');
    confidenceFill.style.width = `${confidence}%`;
    confidenceBar.appendChild(confidenceFill);
    
    item.appendChild(labelSpan);
    item.appendChild(valueSpan);
    item.appendChild(confidenceBar);
    
    return item;
}

class SidebarManager {
    constructor() {
        this.preferences = null;
        this.context = null;
        this.init();
    }

    async init() {
        console.log('Initializing sidebar...');
        await this.loadPreferences();
        await this.loadContext();
        this.setupEventListeners();
        this.updateDisplay();
        this.startContextUpdates();
    }

    async loadPreferences() {
        try {
            const result = await chrome.storage.local.get('userPreferences');
            this.preferences = result.userPreferences || {
                budget: {},
                categories: {},
                brands: {},
                specs: {},
                purposes: {}
            };
        } catch (error) {
            console.error('Failed to load preferences:', error);
            this.preferences = {
                budget: {},
                categories: {},
                brands: {},
                specs: {},
                purposes: {}
            };
        }
    }

    async loadContext() {
        try {
            const result = await chrome.storage.local.get('currentContext');
            this.context = result.currentContext || {
                currentPage: 'Unknown',
                productCount: 0,
                lastQuery: 'None',
                sessionQueries: [],
                browsedProducts: []
            };
        } catch (error) {
            console.error('Failed to load context:', error);
            this.context = {
                currentPage: 'Unknown',
                productCount: 0,
                lastQuery: 'None',
                sessionQueries: [],
                browsedProducts: []
            };
        }
    }

    setupEventListeners() {
        // Clear preferences button
        const clearBtn = document.getElementById('clearPreferences');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearPreferences());
        }

        // Listen for preference updates from content script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'PREFERENCES_UPDATED') {
                this.preferences = message.preferences;
                this.updateDisplay();
            } else if (message.type === 'CONTEXT_UPDATED') {
                this.context = message.context;
                this.updateDisplay();
            }
        });
    }

    updateDisplay() {
        this.updateBudgetPreferences();
        this.updateCategoryPreferences();
        this.updateBrandPreferences();
        this.updateSpecPreferences();
        this.updateCurrentContext();
    }

    updateBudgetPreferences() {
        const container = document.getElementById('budgetPreferences');
        if (!container) return;

        const budgetData = this.preferences.budget;
        if (!budgetData || Object.keys(budgetData).length === 0) {
            clearAndAppendSafe(container, createNoDataElement('No budget data yet'));
            return;
        }

        const elements = [];
        Object.entries(budgetData)
            .sort(([,a], [,b]) => b.confidence - a.confidence)
            .slice(0, 3)
            .forEach(([range, data]) => {
                const item = createPreferenceItem(
                    range,
                    `${data.count}x`,
                    data.confidence
                );
                elements.push(item);
            });

        clearAndAppendSafe(container, elements);
    }

    updateCategoryPreferences() {
        const container = document.getElementById('categoryPreferences');
        if (!container) return;

        const categoryData = this.preferences.categories;
        if (!categoryData || Object.keys(categoryData).length === 0) {
            clearAndAppendSafe(container, createNoDataElement('No category data yet'));
            return;
        }

        const elements = [];
        Object.entries(categoryData)
            .sort(([,a], [,b]) => b.confidence - a.confidence)
            .slice(0, 4)
            .forEach(([category, data]) => {
                const item = createPreferenceItem(
                    category.replace('_', ' '),
                    `${data.count}x`,
                    data.confidence
                );
                elements.push(item);
            });

        clearAndAppendSafe(container, elements);
    }

    updateBrandPreferences() {
        const container = document.getElementById('brandPreferences');
        if (!container) return;

        const brandData = this.preferences.brands;
        if (!brandData || Object.keys(brandData).length === 0) {
            clearAndAppendSafe(container, createNoDataElement('No brand data yet'));
            return;
        }

        const elements = [];
        Object.entries(brandData)
            .sort(([,a], [,b]) => b.confidence - a.confidence)
            .slice(0, 4)
            .forEach(([brand, data]) => {
                const item = createPreferenceItem(
                    brand.toUpperCase(),
                    `${data.count}x`,
                    data.confidence
                );
                elements.push(item);
            });

        clearAndAppendSafe(container, elements);
    }

    updateSpecPreferences() {
        const container = document.getElementById('specPreferences');
        if (!container) return;

        const specData = this.preferences.specs;
        if (!specData || Object.keys(specData).length === 0) {
            clearAndAppendSafe(container, createNoDataElement('No spec data yet'));
            return;
        }

        const elements = [];
        Object.entries(specData)
            .sort(([,a], [,b]) => b.confidence - a.confidence)
            .slice(0, 4)
            .forEach(([spec, data]) => {
                const item = createPreferenceItem(
                    spec,
                    data.value,
                    data.confidence
                );
                elements.push(item);
            });

        clearAndAppendSafe(container, elements);
    }

    updateCurrentContext() {
        const pageEl = document.getElementById('currentPage');
        const countEl = document.getElementById('productCount');
        const queryEl = document.getElementById('lastQuery');
        
        // Update basic context
        if (pageEl) pageEl.textContent = this.context.currentPage || 'Unknown';
        if (countEl) countEl.textContent = this.context.productCount || '0';
        if (queryEl) queryEl.textContent = this.context.lastQuery || 'None';
        
        // Update session info if available
        this.updateSessionInfo();
        this.updateBrowsingHistory();
    }
    
    updateSessionInfo() {
        const sessionQueriesEl = document.getElementById('sessionQueries');
        if (sessionQueriesEl && this.context.sessionQueries) {
            // Show last 3 queries
            const recentQueries = this.context.sessionQueries.slice(-3);
            if (recentQueries.length > 0) {
                const queryElements = recentQueries.map(query => 
                    createSafeElement('div', 'query-item', `"${query}"`)
                );
                clearAndAppendSafe(sessionQueriesEl, queryElements);
            } else {
                clearAndAppendSafe(sessionQueriesEl, createNoDataElement('No queries yet'));
            }
        }
    }
    
    updateBrowsingHistory() {
        const browsingEl = document.getElementById('browsingHistory');
        if (browsingEl && this.context.browsedProducts) {
            // Show last 3 browsed products
            const recentProducts = this.context.browsedProducts.slice(-3);
            if (recentProducts.length > 0) {
                const productElements = recentProducts.map(product => {
                    const item = createSafeElement('div', 'browsed-item');
                    const title = createSafeElement('div', 'product-title', product.title || 'Unknown Product');
                    const price = createSafeElement('div', 'product-price', product.price || 'Price not available');
                    item.appendChild(title);
                    item.appendChild(price);
                    return item;
                });
                clearAndAppendSafe(browsingEl, productElements);
            } else {
                clearAndAppendSafe(browsingEl, createNoDataElement('No browsing history'));
            }
        }
    }

    async clearPreferences() {
        if (confirm('Clear all learned preferences? This cannot be undone.')) {
            try {
                await chrome.storage.local.remove(['userPreferences']);
                this.preferences = {
                    budget: {},
                    categories: {},
                    brands: {},
                    specs: {},
                    purposes: {}
                };
                this.updateDisplay();
                
                // Notify content script
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            type: 'PREFERENCES_CLEARED'
                        });
                    }
                });
            } catch (error) {
                console.error('Failed to clear preferences:', error);
            }
        }
    }

    startContextUpdates() {
        // Update context every 5 seconds
        setInterval(() => {
            this.requestContextUpdate();
        }, 5000);
        
        // Also listen for storage changes to update immediately when preferences change
        this.setupStorageListener();
    }
    
    setupStorageListener() {
        // Listen for storage changes from other parts of the extension
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local') {
                if (changes.userPreferences) {
                    this.preferences = changes.userPreferences.newValue || this.preferences;
                    this.updateDisplay();
                    console.log('Preferences updated from storage:', this.preferences);
                }
                if (changes.currentContext) {
                    this.context = changes.currentContext.newValue || this.context;
                    this.updateDisplay();
                    console.log('Context updated from storage:', this.context);
                }
            }
        });
    }

    requestContextUpdate() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'REQUEST_CONTEXT_UPDATE'
                }, (response) => {
                    if (response && response.context) {
                        this.context = response.context;
                        this.updateDisplay();
                    }
                });
            }
        });
    }
}

// Initialize sidebar when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SidebarManager();
});
