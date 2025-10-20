/**
 * error handling & logging
 */

class ErrorBoundary {
    constructor() {
        this.errors = [];
        this.setupGlobalHandlers();
    }

    setupGlobalHandlers() {
        // handle uncaught errors
        window.addEventListener('error', (event) => {
            this.captureError('uncaught-error', event.error);
        });

        // handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.captureError('unhandled-promise', event.reason);
        });
    }

    captureError(type, error) {
        const errorInfo = {
            type,
            message: error?.message || String(error),
            stack: error?.stack || '',
            timestamp: new Date().toISOString(),
        };

        this.errors.push(errorInfo);
        console.error(`[ERROR BOUNDARY] ${type}:`, errorInfo);

        // keep only last 10 errors
        if (this.errors.length > 10) {
            this.errors.shift();
        }

        return errorInfo;
    }

    getErrors() {
        return this.errors;
    }

    clearErrors() {
        this.errors = [];
    }
}

export default new ErrorBoundary();