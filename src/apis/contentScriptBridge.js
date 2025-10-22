/**
 * Bridge between sidebar and content script for AI operations
 * Since window.ai is only available in page context, we use content script as a bridge
 */

class ContentScriptBridge {
    constructor() {
        this.isAvailable = false;
        this.activeTab = null;
    }

    async getActiveTab() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        this.activeTab = tab;
        return tab;
    }

    async sendMessage(type, data = {}) {
        try {
            const tab = await this.getActiveTab();

            if (!tab || !tab.id) {
                throw new Error('No active tab found');
            }

            return new Promise((resolve, reject) => {
                chrome.tabs.sendMessage(tab.id, { type, data }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(response);
                    }
                });
            });
        } catch (error) {
            console.error('Content script bridge error:', error);
            throw error;
        }
    }

    async checkAvailability() {
        try {
            const response = await this.sendMessage('check-ai-availability');
            this.isAvailable = response.available;
            return response;
        } catch (error) {
            this.isAvailable = false;
            return { available: false, message: error.message };
        }
    }

    async analyzePrompt(prompt) {
        return await this.sendMessage('ai-analyze-prompt', { prompt });
    }

    async generateDraft(title, outline) {
        return await this.sendMessage('ai-generate-draft', { title, outline });
    }

    async rewriteText(text, tone) {
        return await this.sendMessage('ai-rewrite-text', { text, tone });
    }

    async proofread(text) {
        return await this.sendMessage('ai-proofread', { text });
    }
}

export default new ContentScriptBridge();
