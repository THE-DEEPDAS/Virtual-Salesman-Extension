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
            container.innerHTML = '<div class="no-data">No budget data yet</div>';
            return;
        }

        let html = '';
        Object.entries(budgetData)
            .sort(([,a], [,b]) => b.confidence - a.confidence)
            .slice(0, 3)
            .forEach(([range, data]) => {
                html += `
                    <div class="preference-item">
                        <span>${range}</span>
                        <div style="display: flex; align-items: center;">
                            <span class="preference-value">${data.count}x</span>
                            <div class="confidence-bar">
                                <div class="confidence-fill" style="width: ${data.confidence}%"></div>
                            </div>
                        </div>
                    </div>
                `;
            });

        container.innerHTML = html;
    }

    updateCategoryPreferences() {
        const container = document.getElementById('categoryPreferences');
        if (!container) return;

        const categoryData = this.preferences.categories;
        if (!categoryData || Object.keys(categoryData).length === 0) {
            container.innerHTML = '<div class="no-data">No category data yet</div>';
            return;
        }

        let html = '';
        Object.entries(categoryData)
            .sort(([,a], [,b]) => b.confidence - a.confidence)
            .slice(0, 4)
            .forEach(([category, data]) => {
                html += `
                    <div class="preference-item">
                        <span>${category.replace('_', ' ')}</span>
                        <div style="display: flex; align-items: center;">
                            <span class="preference-value">${data.count}x</span>
                            <div class="confidence-bar">
                                <div class="confidence-fill" style="width: ${data.confidence}%"></div>
                            </div>
                        </div>
                    </div>
                `;
            });

        container.innerHTML = html;
    }

    updateBrandPreferences() {
        const container = document.getElementById('brandPreferences');
        if (!container) return;

        const brandData = this.preferences.brands;
        if (!brandData || Object.keys(brandData).length === 0) {
            container.innerHTML = '<div class="no-data">No brand data yet</div>';
            return;
        }

        let html = '';
        Object.entries(brandData)
            .sort(([,a], [,b]) => b.confidence - a.confidence)
            .slice(0, 4)
            .forEach(([brand, data]) => {
                html += `
                    <div class="preference-item">
                        <span>${brand.toUpperCase()}</span>
                        <div style="display: flex; align-items: center;">
                            <span class="preference-value">${data.count}x</span>
                            <div class="confidence-bar">
                                <div class="confidence-fill" style="width: ${data.confidence}%"></div>
                            </div>
                        </div>
                    </div>
                `;
            });

        container.innerHTML = html;
    }

    updateSpecPreferences() {
        const container = document.getElementById('specPreferences');
        if (!container) return;

        const specData = this.preferences.specs;
        if (!specData || Object.keys(specData).length === 0) {
            container.innerHTML = '<div class="no-data">No spec data yet</div>';
            return;
        }

        let html = '';
        Object.entries(specData)
            .sort(([,a], [,b]) => b.confidence - a.confidence)
            .slice(0, 4)
            .forEach(([spec, data]) => {
                html += `
                    <div class="preference-item">
                        <span>${spec}</span>
                        <div style="display: flex; align-items: center;">
                            <span class="preference-value">${data.value}</span>
                            <div class="confidence-bar">
                                <div class="confidence-fill" style="width: ${data.confidence}%"></div>
                            </div>
                        </div>
                    </div>
                `;
            });

        container.innerHTML = html;
    }

    updateCurrentContext() {
        const pageEl = document.getElementById('currentPage');
        const countEl = document.getElementById('productCount');
        const queryEl = document.getElementById('lastQuery');

        if (pageEl) pageEl.textContent = this.context.currentPage || 'Unknown';
        if (countEl) countEl.textContent = this.context.productCount || '0';
        if (queryEl) queryEl.textContent = this.context.lastQuery || 'None';
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
