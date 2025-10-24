/**
 * Logging utility for DraftLoom
 * Provides conditional logging based on environment
 */

class Logger {
    constructor() {
        // Check environment - only log in development mode
        this.isDevelopment = typeof chrome !== 'undefined' &&
            chrome.runtime &&
            chrome.runtime.getManifest &&
            chrome.runtime.getManifest().version_name?.includes('dev');

        // Fallback to checking manifest
        this.isDebugMode = false;
        this._loadDebugMode();
    }

    async _loadDebugMode() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get(['debugMode']);
                this.isDebugMode = result.debugMode || false;
            }
        } catch (e) {
            // Ignore storage errors
        }
    }

    /**
     * Check if logging should be enabled
     */
    _shouldLog() {
        return this.isDevelopment || this.isDebugMode || process.env.NODE_ENV === 'development';
    }

    /**
     * Log info message
     */
    log(...args) {
        if (this._shouldLog()) {
            console.log(...args);
        }
    }

    /**
     * Log info with emoji prefix
     */
    info(...args) {
        if (this._shouldLog()) {
            console.log('ℹ️', ...args);
        }
    }

    /**
     * Log success message
     */
    success(...args) {
        if (this._shouldLog()) {
            console.log('✅', ...args);
        }
    }

    /**
     * Log warning (always shown)
     */
    warn(...args) {
        console.warn('⚠️', ...args);
    }

    /**
     * Log error (always shown)
     */
    error(...args) {
        console.error('❌', ...args);
    }

    /**
     * Log debug message
     */
    debug(...args) {
        if (this._shouldLog()) {
            console.debug('🔍', ...args);
        }
    }

    /**
     * Enable debug mode
     */
    async enableDebug() {
        this.isDebugMode = true;
        if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.local.set({ debugMode: true });
        }
    }

    /**
     * Disable debug mode
     */
    async disableDebug() {
        this.isDebugMode = false;
        if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.local.set({ debugMode: false });
        }
    }
}

export default new Logger();
