/**
 * chrome AI rewriter api wrapper
 */

class RewriterAPIWrapper {
    constructor() {
        this.session = null;
        this.isReady = false;
        this.createdAt = null;
        this.sessionTimeout = 30 * 60 * 1000;
    }

    async initialize() {
        if (this.isReady && !this._isSessionExpired()) {
            return this.session;
        }

        try {
            if (!('ai' in window) || !('rewriter' in window.ai)) {
                throw new Error('Rewriter API not available');
            }

            const canCreate = await window.ai.rewriter.canCreateGenericSession();
            
            if (canCreate === 'after-download') {
                console.log('⏳ Downloading Rewriter model...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

            this.session = await window.ai.rewriter.createGenericSession();
            this.isReady = true;
            this.createdAt = Date.now();
            
            console.log('✓ Rewriter API session initialized');
            return this.session;
        } catch (error) {
            console.error('❌ Rewriter API initialization failed:', error.message);
            this.isReady = false;
            throw error;
        }
    }

    /**
     * rewrite text with specific tone
     */
    async rewriteWithTone(text, tone = 'academic') {
        if (!text || text.trim().length === 0) {
            return { success: false, error: 'Text cannot be empty' };
        }

        const session = await this.initialize();
        
        const toneGuides = {
            academic: 'formal academic tone with sophisticated vocabulary and precise language',
            professional: 'professional business tone that is clear, concise, and action-oriented',
            casual: 'friendly, conversational tone that is approachable and engaging',
            formal: 'very formal, technical tone with precise terminology',
            creative: 'creative, engaging tone with personality and vivid language',
        };

        const rewritePrompt = `
Rewrite the following text in a ${toneGuides[tone] || toneGuides.academic}.

Original text:
"${text}"

Requirements:
- Maintain the same meaning and information
- Preserve key facts and arguments
- Keep similar length
- Make it suitable for academic writing
- Use varied sentence structure

Rewritten text:
        `;

        try {
            const response = await session.rewrite(rewritePrompt);
            
            return {
                success: true,
                rewritten: response.trim(),
                tone,
                originalLength: text.split(/\s+/).length,
                newLength: response.split(/\s+/).length,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Rewrite error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * adjust text length 
     */
    async adjustLength(text, mode = 'maintain') {
        if (!text || text.trim().length === 0) {
            return { success: false, error: 'Text cannot be empty' };
        }

        const session = await this.initialize();
        
        const modeGuides = {
            concise: 'Reduce the length by 30-40% while keeping all key information. Remove redundancy and filler words.',
            expand: 'Increase the length by 30-50%. Add more details, examples, and explanations to strengthen the argument.',
            maintain: 'Rephrase the text without significantly changing the length or meaning.',
        };

        const lengthPrompt = `
${modeGuides[mode] || modeGuides.maintain}

Original text:
"${text}"

Requirements:
- Preserve the main ideas and message
- Use clear, academic language
- Maintain logical flow
- Keep it coherent and well-structured

Adjusted text:
        `;

        try {
            const response = await session.rewrite(lengthPrompt);
            
            const originalWords = text.split(/\s+/).length;
            const newWords = response.split(/\s+/).length;
            const percentChange = Math.round(((newWords - originalWords) / originalWords) * 100);
            
            return {
                success: true,
                adjusted: response.trim(),
                mode,
                originalLength: originalWords,
                newLength: newWords,
                percentChange,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Length adjustment error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * simplify complex text
     */
    async simplifyText(text) {
        const session = await this.initialize();
        
        const simplifyPrompt = `
Simplify the following complex text while maintaining its meaning. Use:
- Shorter sentences
- Common vocabulary
- Clear structure
- Active voice

Original text:
"${text}"

Simplified version:
        `;

        try {
            const response = await session.rewrite(simplifyPrompt);
            
            return {
                success: true,
                simplified: response.trim(),
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    _isSessionExpired() {
        return this.createdAt && (Date.now() - this.createdAt > this.sessionTimeout);
    }

    async destroy() {
        if (this.session) {
            this.session = null;
            this.isReady = false;
        }
    }
}

export default new RewriterAPIWrapper();