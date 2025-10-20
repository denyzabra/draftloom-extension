/**
 * chrome AI summarizer api Wrapper
 */

class SummarizerAPIWrapper {
    constructor() {
        this.sessionCache = {};
    }

    async initialize(type = 'teaser') {
        if (!('ai' in window) || !('summarizer' in window.ai)) {
            throw new Error('Summarizer API not available');
        }
        
        if (!this.sessionCache[type]) {
            try {
                this.sessionCache[type] = await window.ai.summarizer.createSummarizerSession({ 
                    type // 'teaser', 'headline', 'key-points'
                });
                console.log('✓ Summarizer API session initialized');
            } catch (error) {
                console.error('❌ Summarizer initialization error:', error);
                throw error;
            }
        }
        
        return this.sessionCache[type];
    }

    async summarize(text, type = 'teaser') {
        if (!text || text.trim().length === 0) {
            return { success: false, error: 'Text cannot be empty' };
        }

        try {
            const session = await this.initialize(type);
            const summary = await session.summarize(text);
            
            return {
                success: true,
                summary,
                type,
                originalLength: text.split(/\s+/).length,
                summaryLength: summary.split(/\s+/).length,
                compressionRatio: ((summary.length / text.length) * 100).toFixed(1),
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Summarize error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
}

export default new SummarizerAPIWrapper();