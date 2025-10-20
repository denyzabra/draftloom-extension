/**
 * API Manager coordinates all Chrome AI API interactions
 * single interface for all API operations
 */

import promptAPI from './promptAPI.js';
import writerAPI from './writerAPI.js';
import rewriterAPI from './rewriterAPI.js';
import proofreaderAPI from './proofreaderAPI.js';
import summarizerAPI from './summarizerAPI.js';
import translatorAPI from './translatorAPI.js';
import { checkAICapabilities } from './capabilities.js';

class APIManager {
    constructor() {
        this.apis = {
            prompt: promptAPI,
            writer: writerAPI,
            rewriter: rewriterAPI,
            proofreader: proofreaderAPI,
            summarizer: summarizerAPI,
            translator: translatorAPI,
        };
        this.capabilities = null;
        this.requestQueue = [];
        this.isProcessing = false;
    }

    /**
     * initialize all APIs
     */
    async initialize() {
        try {
            console.log('🚀 Initializing DraftLoom APIs...');
            this.capabilities = await checkAICapabilities();
            console.log('✅ APIs initialized successfully');
            return this.capabilities;
        } catch (error) {
            console.error('❌ API initialization failed:', error);
            throw error;
        }
    }

    /**
     * check if all critical APIs are ready
     */
    isCriticalReady() {
        if (!this.capabilities) {
            return false;
        }

        return !!(
            this.capabilities.promptAPI?.available &&
            this.capabilities.writerAPI?.available &&
            this.capabilities.proofreaderAPI?.available
        );
    }

    /**
     * get capabilities
     */
    getCapabilities() {
        return this.capabilities;
    }

    /**
     * queue API requests for better UX
     */
    async queueRequest(apiName, methodName, ...args) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({
                apiName,
                methodName,
                args,
                resolve,
                reject,
            });
            this._processQueue();
        });
    }

    async _processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) return;

        this.isProcessing = true;

        while (this.requestQueue.length > 0) {
            const request = this.requestQueue.shift();

            // small delay before processing each request
            await new Promise(resolve => setTimeout(resolve, 100));

            try {
                const api = this.apis[request.apiName];
                if (!api) {
                    throw new Error(`API not found: ${request.apiName}`);
                }

                const method = api[request.methodName];
                if (!method) {
                    throw new Error(`Method not found: ${request.methodName}`);
                }

                const result = await method.apply(api, request.args);
                request.resolve(result);
            } catch (error) {
                request.reject(error);
            }
        }

        this.isProcessing = false;
    }

    /**
     * cleanup all sessions
     */
    async cleanup() {
        console.log('🧹 Cleaning up API sessions...');
        
        for (const [name, api] of Object.entries(this.apis)) {
            if (api.destroy) {
                try {
                    await api.destroy();
                    console.log(`✓ ${name} cleaned up`);
                } catch (error) {
                    console.warn(`Warning cleaning ${name}:`, error);
                }
            }
        }
    }
}

export default new APIManager();