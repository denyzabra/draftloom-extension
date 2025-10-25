/**
 * Production Logger
 * Only logs in development mode, silent in production
 */

class ProductionLogger {
    constructor() {
        // Check if we're in development mode
        const manifest = chrome.runtime.getManifest();
        this.isDev = manifest.version_name ? manifest.version_name.includes('dev') : true;

        // For now, enable logging until we add version_name to manifest
        // In production, set version_name: "1.0.0" and this will auto-disable
        this.isDev = true; // TODO: Set to false for production build
    }

    log(...args) {
        if (this.isDev) {
            console.log(...args);
        }
    }

    info(...args) {
        if (this.isDev) {
            console.info(...args);
        }
    }

    warn(...args) {
        // Always show warnings
        console.warn(...args);
    }

    error(...args) {
        // Always show errors, but sanitize in production
        if (this.isDev) {
            console.error(...args);
        } else {
            // In production, log generic error
            console.error('An error occurred. Enable dev mode for details.');
        }
    }

    debug(...args) {
        if (this.isDev) {
            console.log('[DEBUG]', ...args);
        }
    }

    // Group logging for better organization
    group(label) {
        if (this.isDev && console.group) {
            console.group(label);
        }
    }

    groupEnd() {
        if (this.isDev && console.groupEnd) {
            console.groupEnd();
        }
    }
}

export default new ProductionLogger();
