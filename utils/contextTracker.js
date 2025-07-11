// Context tracker for learning user preferences
class ContextTracker {
    constructor() {
        this.preferences = {
            budget: {},
            categories: {},
            brands: {},
            specs: {},
            purposes: {}
        };
        this.context = {
            currentPage: 'Unknown',
            productCount: 0,
            lastQuery: 'None',
            sessionQueries: [],
            browsedProducts: []
        };
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            // Load existing preferences
            const prefResult = await chrome.storage.local.get('userPreferences');
            if (prefResult.userPreferences) {
                this.preferences = { ...this.preferences, ...prefResult.userPreferences };
            }

            // Load existing context
            const contextResult = await chrome.storage.local.get('currentContext');
            if (contextResult.currentContext) {
                this.context = { ...this.context, ...contextResult.currentContext };
            }

            this.initialized = true;
            console.log('ContextTracker initialized with preferences:', this.preferences);
        } catch (error) {
            console.error('Failed to initialize ContextTracker:', error);
        }
    }

    // Learn from user queries
    async learnFromQuery(query, parsedQuery) {
        if (!this.initialized) await this.initialize();

        try {
            // Update query history
            this.context.lastQuery = query;
            this.context.sessionQueries = this.context.sessionQueries || [];
            this.context.sessionQueries.push({
                query: query,
                parsed: parsedQuery,
                timestamp: Date.now()
            });

            // Keep only last 10 queries
            if (this.context.sessionQueries.length > 10) {
                this.context.sessionQueries = this.context.sessionQueries.slice(-10);
            }

            // Learn budget preferences
            if (parsedQuery.budget) {
                await this.learnBudgetPreference(parsedQuery.budget);
            }

            // Learn category preferences
            if (parsedQuery.categories && parsedQuery.categories.length > 0) {
                await this.learnCategoryPreferences(parsedQuery.categories);
            }

            // Learn brand preferences
            if (parsedQuery.brands && parsedQuery.brands.length > 0) {
                await this.learnBrandPreferences(parsedQuery.brands);
            }

            // Learn spec preferences
            if (parsedQuery.specs && Object.keys(parsedQuery.specs).length > 0) {
                await this.learnSpecPreferences(parsedQuery.specs);
            }

            // Learn purpose preferences
            if (parsedQuery.purpose) {
                await this.learnPurposePreference(parsedQuery.purpose);
            }

            await this.savePreferences();
            await this.saveContext();

        } catch (error) {
            console.error('Failed to learn from query:', error);
        }
    }

    async learnBudgetPreference(budget) {
        const budgetRange = this.getBudgetRange(budget.amount);
        
        if (!this.preferences.budget[budgetRange]) {
            this.preferences.budget[budgetRange] = {
                count: 0,
                totalAmount: 0,
                operator: budget.operator,
                confidence: 0
            };
        }

        this.preferences.budget[budgetRange].count++;
        this.preferences.budget[budgetRange].totalAmount += budget.amount;
        this.preferences.budget[budgetRange].operator = budget.operator;
        
        // Calculate confidence (0-100)
        const totalQueries = Object.values(this.preferences.budget).reduce((sum, b) => sum + b.count, 0);
        this.preferences.budget[budgetRange].confidence = Math.min(
            (this.preferences.budget[budgetRange].count / totalQueries) * 100,
            100
        );
    }

    async learnCategoryPreferences(categories) {
        categories.forEach(category => {
            if (!this.preferences.categories[category]) {
                this.preferences.categories[category] = {
                    count: 0,
                    confidence: 0,
                    lastSeen: Date.now()
                };
            }

            this.preferences.categories[category].count++;
            this.preferences.categories[category].lastSeen = Date.now();
        });

        // Update confidence scores
        const totalCategoryQueries = Object.values(this.preferences.categories).reduce((sum, c) => sum + c.count, 0);
        Object.keys(this.preferences.categories).forEach(category => {
            this.preferences.categories[category].confidence = Math.min(
                (this.preferences.categories[category].count / totalCategoryQueries) * 100,
                100
            );
        });
    }

    async learnBrandPreferences(brands) {
        brands.forEach(brand => {
            if (!this.preferences.brands[brand]) {
                this.preferences.brands[brand] = {
                    count: 0,
                    confidence: 0,
                    lastSeen: Date.now()
                };
            }

            this.preferences.brands[brand].count++;
            this.preferences.brands[brand].lastSeen = Date.now();
        });

        // Update confidence scores
        const totalBrandQueries = Object.values(this.preferences.brands).reduce((sum, b) => sum + b.count, 0);
        Object.keys(this.preferences.brands).forEach(brand => {
            this.preferences.brands[brand].confidence = Math.min(
                (this.preferences.brands[brand].count / totalBrandQueries) * 100,
                100
            );
        });
    }

    async learnSpecPreferences(specs) {
        Object.entries(specs).forEach(([specType, specValue]) => {
            const specKey = `${specType}:${JSON.stringify(specValue)}`;
            
            if (!this.preferences.specs[specKey]) {
                this.preferences.specs[specKey] = {
                    type: specType,
                    value: specValue,
                    count: 0,
                    confidence: 0,
                    lastSeen: Date.now()
                };
            }

            this.preferences.specs[specKey].count++;
            this.preferences.specs[specKey].lastSeen = Date.now();
        });

        // Update confidence scores
        const totalSpecQueries = Object.values(this.preferences.specs).reduce((sum, s) => sum + s.count, 0);
        Object.keys(this.preferences.specs).forEach(specKey => {
            this.preferences.specs[specKey].confidence = Math.min(
                (this.preferences.specs[specKey].count / totalSpecQueries) * 100,
                100
            );
        });
    }

    async learnPurposePreference(purpose) {
        if (!this.preferences.purposes[purpose]) {
            this.preferences.purposes[purpose] = {
                count: 0,
                confidence: 0,
                lastSeen: Date.now()
            };
        }

        this.preferences.purposes[purpose].count++;
        this.preferences.purposes[purpose].lastSeen = Date.now();

        // Update confidence scores
        const totalPurposeQueries = Object.values(this.preferences.purposes).reduce((sum, p) => sum + p.count, 0);
        Object.keys(this.preferences.purposes).forEach(purpose => {
            this.preferences.purposes[purpose].confidence = Math.min(
                (this.preferences.purposes[purpose].count / totalPurposeQueries) * 100,
                100
            );
        });
    }

    updatePageContext(siteName, productCount) {
        this.context.currentPage = siteName;
        this.context.productCount = productCount;
        this.saveContext();
    }

    // Get context-aware recommendations
    getContextualInsights() {
        const insights = {
            recommendedBudget: this.getRecommendedBudget(),
            preferredCategories: this.getPreferredCategories(),
            preferredBrands: this.getPreferredBrands(),
            commonSpecs: this.getCommonSpecs(),
            searchPatterns: this.getSearchPatterns()
        };

        return insights;
    }

    getRecommendedBudget() {
        const budgets = Object.entries(this.preferences.budget)
            .sort(([,a], [,b]) => b.confidence - a.confidence);
        
        if (budgets.length > 0) {
            const topBudget = budgets[0][1];
            return {
                range: budgets[0][0],
                averageAmount: Math.round(topBudget.totalAmount / topBudget.count),
                operator: topBudget.operator,
                confidence: topBudget.confidence
            };
        }
        return null;
    }

    getPreferredCategories() {
        return Object.entries(this.preferences.categories)
            .sort(([,a], [,b]) => b.confidence - a.confidence)
            .slice(0, 3)
            .map(([category, data]) => ({
                category,
                confidence: data.confidence,
                count: data.count
            }));
    }

    getPreferredBrands() {
        return Object.entries(this.preferences.brands)
            .sort(([,a], [,b]) => b.confidence - a.confidence)
            .slice(0, 3)
            .map(([brand, data]) => ({
                brand,
                confidence: data.confidence,
                count: data.count
            }));
    }

    getCommonSpecs() {
        return Object.entries(this.preferences.specs)
            .sort(([,a], [,b]) => b.confidence - a.confidence)
            .slice(0, 3)
            .map(([specKey, data]) => ({
                type: data.type,
                value: data.value,
                confidence: data.confidence,
                count: data.count
            }));
    }

    getSearchPatterns() {
        return {
            totalQueries: this.context.sessionQueries.length,
            recentQueries: this.context.sessionQueries.slice(-3).map(q => q.query),
            dominantPurpose: this.getDominantPurpose()
        };
    }

    getDominantPurpose() {
        const purposes = Object.entries(this.preferences.purposes)
            .sort(([,a], [,b]) => b.confidence - a.confidence);
        
        return purposes.length > 0 ? purposes[0][0] : 'general';
    }

    getBudgetRange(amount) {
        if (amount < 20000) return 'Under ₹20k';
        if (amount < 50000) return '₹20k - ₹50k';
        if (amount < 75000) return '₹50k - ₹75k';
        if (amount < 100000) return '₹75k - ₹1L';
        if (amount < 150000) return '₹1L - ₹1.5L';
        return 'Above ₹1.5L';
    }

    async savePreferences() {
        try {
            await chrome.storage.local.set({ userPreferences: this.preferences });
            
            // Notify sidebar
            chrome.runtime.sendMessage({
                type: 'PREFERENCES_UPDATED',
                preferences: this.preferences
            });
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }

    async saveContext() {
        try {
            await chrome.storage.local.set({ currentContext: this.context });
            
            // Notify sidebar
            chrome.runtime.sendMessage({
                type: 'CONTEXT_UPDATED',
                context: this.context
            });
        } catch (error) {
            console.error('Failed to save context:', error);
        }
    }

    async clearPreferences() {
        this.preferences = {
            budget: {},
            categories: {},
            brands: {},
            specs: {},
            purposes: {}
        };
        await this.savePreferences();
    }
}

// Make it available globally
window.ContextTracker = ContextTracker;
