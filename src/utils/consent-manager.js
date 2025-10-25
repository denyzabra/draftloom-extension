/**
 * Consent Manager - Handles user consent for data processing
 * Ensures GDPR and privacy law compliance
 */

class ConsentManager {
    constructor() {
        this.storageKey = 'draftloom_consent';
        this.consentData = null;
    }

    /**
     * Check if user has given consent
     */
    async hasConsent() {
        if (!this.consentData) {
            await this.loadConsent();
        }
        return this.consentData?.granted === true;
    }

    /**
     * Load consent data from storage
     */
    async loadConsent() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get([this.storageKey]);
                this.consentData = result[this.storageKey] || null;
            }
        } catch (error) {
            console.error('Error loading consent data:', error);
            this.consentData = null;
        }
        return this.consentData;
    }

    /**
     * Grant consent
     */
    async grantConsent(options = {}) {
        const consentData = {
            granted: true,
            timestamp: Date.now(),
            version: '1.0',
            dataProcessing: options.dataProcessing !== false, // Default true
            localStorageOnly: options.localStorageOnly !== false, // Default true (always on-device)
            analyticsConsent: options.analyticsConsent || false,
        };

        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set({
                    [this.storageKey]: consentData
                });
            }
            this.consentData = consentData;
            return true;
        } catch (error) {
            console.error('Error saving consent:', error);
            return false;
        }
    }

    /**
     * Revoke consent and optionally clear data
     */
    async revokeConsent(clearData = true) {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.remove([this.storageKey]);

                if (clearData) {
                    // Clear all app data
                    await chrome.storage.local.remove([
                        'draftloom_session',
                        'draftloom_drafts'
                    ]);
                }
            }
            this.consentData = null;
            return true;
        } catch (error) {
            console.error('Error revoking consent:', error);
            return false;
        }
    }

    /**
     * Check if consent is needed (first time user)
     */
    async needsConsent() {
        await this.loadConsent();
        return this.consentData === null;
    }

    /**
     * Get consent details
     */
    getConsentDetails() {
        return this.consentData;
    }

    /**
     * Update specific consent preferences
     */
    async updateConsent(updates) {
        if (!this.consentData) {
            await this.loadConsent();
        }

        if (!this.consentData) {
            return false;
        }

        this.consentData = {
            ...this.consentData,
            ...updates,
            lastUpdated: Date.now()
        };

        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set({
                    [this.storageKey]: this.consentData
                });
            }
            return true;
        } catch (error) {
            console.error('Error updating consent:', error);
            return false;
        }
    }

    /**
     * Show consent dialog (returns promise that resolves when user decides)
     */
    async showConsentDialog() {
        return new Promise((resolve) => {
            // This would be implemented in the UI layer
            // For now, just resolve with false (user needs to explicitly grant)
            resolve(false);
        });
    }
}

export default new ConsentManager();
