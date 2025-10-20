/**
 * chrome AI Prompt api wrapper
 * handles essay prompt analysis, idea generation, multimodal input
 */

class PromptAPIWrapper {
    constructor() {
        this.session = null;
        this.isReady = false;
        this.sessionTimeout = 30 * 60 * 1000; // 30 mins
        this.createdAt = null;
    }

    /**
     * initialize Prompt API session
     */
    async initialize() {
        if (this.isReady && !this._isSessionExpired()) {
            return this.session;
        }

        try {
            if (!('ai' in window) || !('languageModel' in window.ai)) {
                throw new Error('Prompt API not available. Chrome 132+ with built-in AI required.');
            }

            const canCreate = await window.ai.languageModel.canCreateTextSession();
            
            if (canCreate === 'no') {
                throw new Error('Prompt API not supported on this system');
            }

            if (canCreate === 'after-download') {
                console.log('⏳ Downloading Prompt API model...');
                // Model download in background may take a few secs
                await this._waitForModelDownload(5000);
            }

            this.session = await window.ai.languageModel.create();
            this.isReady = true;
            this.createdAt = Date.now();
            
            console.log('✓ Prompt API session initialized');
            return this.session;

        } catch (error) {
            console.error('❌ Prompt API initialization failed:', error.message);
            this.isReady = false;
            throw error;
        }
    }

    /**
     * analyze essay assignment prompt
     */
    async analyzePrompt(prompt) {
        if (!prompt || prompt.trim().length === 0) {
            return {
                success: false,
                error: 'Prompt cannot be empty',
            };
        }

        const session = await this.initialize();
        
        const analysisPrompt = `
You are an experienced educator analyzing a student's assignment prompt.

ASSIGNMENT PROMPT:
"${prompt}"

Please provide a structured analysis with:

1. **Main Topic/Question**: What is the core subject?
2. **Key Requirements**: List 3-5 specific requirements mentioned
3. **Essay Structure**: Suggest a clear outline (intro, body sections, conclusion)
4. **Recommended Length**: Estimate appropriate word count
5. **Writing Tips**: 2-3 tips for approaching this essay

Format your response clearly and concisely focus on practical guidance.
        `;

        try {
            let fullResponse = '';
            
            // use streaming for better UX
            const stream = await session.promptStreaming(analysisPrompt);
            
            for await (const chunk of stream) {
                fullResponse += chunk;
            }
            
            return {
                success: true,
                analysis: fullResponse,
                timestamp: new Date().toISOString(),
                tokensUsed: Math.ceil(fullResponse.length / 4), // rough estimate
            };
        } catch (error) {
            console.error('Analysis error:', error);
            return {
                success: false,
                error: error.message || 'Failed to analyze prompt',
            };
        }
    }

    /**
     * generate brainstorming ideas
     */
    async generateIdeas(prompt, studentContext = '') {
        const session = await this.initialize();
        
        const ideaPrompt = `
Assignment: "${prompt}"
${studentContext ? `Student background: "${studentContext}"` : ''}

Generate 5 unique thesis statement ideas that could work well for this assignment.

For each idea:
- Start with "Thesis #X:"
- Keep it to one sentence
- Make it specific and arguable
- Make it appropriate for academic writing

Format each on a new line.
        `;

        try {
            const response = await session.prompt(ideaPrompt);
            
            // parse response into array
            const ideas = response
                .split('\n')
                .filter(line => line.includes('Thesis'))
                .map(line => line.replace(/^Thesis #\d+:\s*/, '').trim())
                .filter(idea => idea.length > 0);
            
            return {
                success: true,
                ideas,
                count: ideas.length,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Idea generation error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * extract key concepts from text
     */
    async extractConcepts(text) {
        const session = await this.initialize();
        
        const conceptPrompt = `
Analyze this text and extract the 5-7 most important concepts or themes:

"${text.substring(0, 500)}"

Format as a simple comma-separated list of concepts.
        `;

        try {
            const response = await session.prompt(conceptPrompt);
            
            const concepts = response
                .split(',')
                .map(c => c.trim())
                .filter(c => c.length > 0);
            
            return {
                success: true,
                concepts,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * session management
     */
    _isSessionExpired() {
        return this.createdAt && (Date.now() - this.createdAt > this.sessionTimeout);
    }

    async _waitForModelDownload(timeout) {
        return new Promise(resolve => setTimeout(resolve, timeout));
    }

    async destroy() {
        if (this.session) {
            await this.session.destroy();
            this.session = null;
            this.isReady = false;
        }
    }
}

export default new PromptAPIWrapper();