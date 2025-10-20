/**
 * chrome AI Writer api wrapper
 */

class WriterAPIWrapper {
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
            if (!('ai' in window) || !('writer' in window.ai)) {
                throw new Error('Writer API not available');
            }

            const canCreate = await window.ai.writer.canCreateGenericSession();
            
            if (canCreate === 'after-download') {
                console.log('⏳ Downloading Writer model...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

            this.session = await window.ai.writer.createGenericSession();
            this.isReady = true;
            this.createdAt = Date.now();
            
            console.log('✓ Writer API session initialized');
            return this.session;
        } catch (error) {
            console.error('❌ Writer API initialization failed:', error.message);
            this.isReady = false;
            throw error;
        }
    }

    /**
     * generate essay draft from outline
     */
    async generateDraft(topic, outlinePoints, tone = 'academic') {
        const session = await this.initialize();
        
        const pointsText = Array.isArray(outlinePoints) 
            ? outlinePoints.map((p, i) => `${i + 1}. ${p}`).join('\n')
            : outlinePoints;

        const draftPrompt = `
Write a well-structured academic essay draft on: "${topic}"

Follow this outline:
${pointsText}

Requirements:
- Include a clear introduction with thesis statement
- Develop each outline point into a full paragraph
- Include a strong conclusion
- Use formal academic tone
- Maintain coherent flow between paragraphs
- Aim for 500-800 words

Generate the essay now:
        `;

        try {
            const response = await session.write(draftPrompt);
            
            const wordCount = response.split(/\s+/).length;
            const paragraphs = response.split('\n\n').filter(p => p.trim().length > 0);
            
            return {
                success: true,
                draft: response,
                wordCount,
                paragraphs: paragraphs.length,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Draft generation error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * generate thesis statement
     */
    async generateThesis(topic, requirements = '') {
        const session = await this.initialize();
        
        const thesisPrompt = `
Create a strong, clear thesis statement for an academic essay about: "${topic}"
${requirements ? `Essay requirements: ${requirements}` : ''}

The thesis statement should:
- Be specific and arguable
- Take a clear position
- Be 1-2 sentences maximum
- Guide the rest of the essay
- Use academic language

Generate only the thesis statement (no additional text):
        `;

        try {
            const response = await session.write(thesisPrompt);
            
            return {
                success: true,
                thesis: response.trim(),
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
     * generate essay outline
     */
    async generateOutline(topic, requirements = '') {
        const session = await this.initialize();
        
        const outlinePrompt = `
Create a detailed essay outline for: "${topic}"
${requirements ? `Requirements: ${requirements}` : ''}

Format the outline as:
I. Introduction
   A. Hook
   B. Background context
   C. Thesis statement

II. Body Paragraph 1
   A. Topic sentence
   B. Supporting evidence
   C. Analysis

III. Body Paragraph 2
   A. Topic sentence
   B. Supporting evidence
   C. Analysis

IV. Body Paragraph 3
   A. Topic sentence
   B. Supporting evidence
   C. Analysis

V. Conclusion
   A. Restatement of thesis
   B. Summary of main points
   C. Final thoughts

Generate the outline now:
        `;

        try {
            const response = await session.write(outlinePrompt);
            
            return {
                success: true,
                outline: response,
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
     * generate intro paragraph
     */
    async generateIntroduction(topic, thesis) {
        const session = await this.initialize();
        
        const introPrompt = `
Write an engaging introduction paragraph for an academic essay about: "${topic}"

Thesis statement: "${thesis}"

The introduction should:
- Start with a compelling hook (question, quote, or statistic)
- Provide brief background context
- Lead naturally to the thesis statement
- End with the thesis statement provided above
- Be 100-150 words

Generate only the introduction paragraph:
        `;

        try {
            const response = await session.write(introPrompt);
            
            return {
                success: true,
                introduction: response.trim(),
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

export default new WriterAPIWrapper();