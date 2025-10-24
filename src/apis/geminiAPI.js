/**
 * Google Gemini API Integration
 * Fallback for Chrome Built-in AI when window.ai is unavailable
 * Uses Gemini 1.5 Flash for fast, cost-effective responses
 */

class GeminiAPI {
    constructor() {
        this.apiKey = null;
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.model = 'gemini-1.5-flash-latest'; // Fast, free tier available
        this.isConfigured = false;

        // Rate limiting
        this.requestCount = 0;
        this.requestWindow = 60000; // 1 minute
        this.maxRequestsPerWindow = 15; // 15 requests per minute
        this.lastResetTime = Date.now();

        // Input limits
        this.maxInputLength = 30000; // ~30k characters max
    }

    /**
     * Initialize with API key from chrome.storage
     */
    async initialize() {
        try {
            const result = await chrome.storage.local.get(['geminiApiKey']);
            if (result.geminiApiKey) {
                this.apiKey = result.geminiApiKey;
                this.isConfigured = true;
                console.log('✅ Gemini API initialized');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to initialize Gemini API:', error);
            return false;
        }
    }

    /**
     * Set and save API key
     */
    async setApiKey(key) {
        // Validate and sanitize key
        const sanitizedKey = key?.trim();
        if (!sanitizedKey || !this._isValidApiKey(sanitizedKey)) {
            throw new Error('Invalid API key format. Expected format: AIza...');
        }

        this.apiKey = sanitizedKey;
        await chrome.storage.local.set({ geminiApiKey: sanitizedKey });
        this.isConfigured = true;
        console.log('✅ Gemini API key saved');
    }

    /**
     * Check if API is configured
     */
    async checkAvailability() {
        if (!this.apiKey) {
            await this.initialize();
        }
        return {
            available: this.isConfigured,
            message: this.isConfigured
                ? 'Gemini API configured and ready'
                : 'Gemini API key not configured'
        };
    }

    /**
     * Make API request to Gemini
     */
    async makeRequest(prompt, temperature = 0.7, maxTokens = 2048) {
        if (!this.apiKey) {
            throw new Error('Gemini API key not configured');
        }

        // Validate API key format
        if (!this._isValidApiKey(this.apiKey)) {
            throw new Error('Invalid API key format');
        }

        // Check rate limiting
        this._checkRateLimit();

        // Validate input length
        this._validateInputLength(prompt);

        const url = `${this.baseURL}/${this.model}:generateContent`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': this.apiKey
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: temperature,
                    maxOutputTokens: maxTokens,
                    topP: 0.95,
                    topK: 40
                }
            })
        });

        if (!response.ok) {
            let errorMessage = 'Gemini API request failed';
            try {
                const error = await response.json();
                errorMessage = error.error?.message || errorMessage;
            } catch (e) {
                // If response is not JSON, use status text
                errorMessage = `${errorMessage}: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            throw new Error('Invalid response from Gemini API');
        }

        return data.candidates[0].content.parts[0].text;
    }

    /**
     * Analyze assignment prompt
     */
    async analyzePrompt(prompt) {
        try {
            // Sanitize input
            const sanitizedPrompt = this._sanitizeInput(prompt);
            if (!sanitizedPrompt) {
                throw new Error('Invalid or empty prompt provided');
            }

            const systemPrompt = `You are an experienced educator analyzing a student's assignment prompt.

ASSIGNMENT PROMPT:
"${sanitizedPrompt}"

Please provide a structured analysis with:

1. **Main Topic/Question**: What is the core subject?
2. **Key Requirements**: List 3-5 specific requirements mentioned
3. **Essay Structure**: Suggest a clear outline (intro, body sections, conclusion)
4. **Recommended Length**: Estimate appropriate word count
5. **Writing Tips**: 2-3 tips for approaching this essay

Format your response clearly and concisely with markdown formatting.`;

            const analysis = await this.makeRequest(systemPrompt, 0.7, 1024);

            return {
                success: true,
                analysis: analysis,
                timestamp: new Date().toISOString(),
                source: 'gemini'
            };
        } catch (error) {
            console.error('Gemini analyzePrompt error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate essay draft
     */
    async generateDraft(title, outline) {
        try {
            // Sanitize inputs
            const sanitizedTitle = this._sanitizeInput(title);
            const sanitizedOutline = this._sanitizeInput(outline);

            if (!sanitizedTitle || !sanitizedOutline) {
                throw new Error('Invalid or empty title/outline provided');
            }

            const systemPrompt = `Write a well-structured academic essay draft on: "${sanitizedTitle}"

Follow this outline:
${sanitizedOutline}

Requirements:
- Include a clear introduction with thesis statement
- Develop each outline point into a full paragraph with supporting details
- Include topic sentences and smooth transitions
- Use formal academic tone with sophisticated vocabulary
- Include a strong conclusion that synthesizes ideas
- Aim for 600-900 words
- Use specific examples and evidence

Generate the complete essay now:`;

            const draft = await this.makeRequest(systemPrompt, 0.8, 2048);
            const wordCount = draft.split(/\s+/).length;

            return {
                success: true,
                draft: draft,
                wordCount: wordCount,
                timestamp: new Date().toISOString(),
                source: 'gemini'
            };
        } catch (error) {
            console.error('Gemini generateDraft error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Rewrite text in different tone
     */
    async rewriteText(text, tone) {
        try {
            // Sanitize inputs
            const sanitizedText = this._sanitizeInput(text);
            const sanitizedTone = tone?.toLowerCase().trim();

            if (!sanitizedText) {
                throw new Error('Invalid or empty text provided');
            }

            const toneDescriptions = {
                academic: 'formal academic tone with sophisticated vocabulary, avoiding contractions and casual language',
                professional: 'professional business tone that is clear, concise, and authoritative',
                casual: 'friendly, conversational tone with natural flow'
            };

            const validTone = toneDescriptions[sanitizedTone] ? sanitizedTone : 'academic';

            const systemPrompt = `Rewrite the following text in a ${toneDescriptions[validTone]}.

Original text:
"${sanitizedText}"

Requirements:
- Maintain the same core meaning and ideas
- Keep similar length (±10% word count)
- Ensure smooth flow and readability
- Use appropriate vocabulary for ${validTone} style

Provide ONLY the rewritten text, no explanations:`;

            const rewritten = await this.makeRequest(systemPrompt, 0.6, 1024);

            return {
                success: true,
                rewritten: rewritten.trim(),
                tone: tone,
                timestamp: new Date().toISOString(),
                source: 'gemini'
            };
        } catch (error) {
            console.error('Gemini rewriteText error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Proofread text for errors
     */
    async proofread(text) {
        try {
            // Sanitize input
            const sanitizedText = this._sanitizeInput(text);
            if (!sanitizedText) {
                throw new Error('Invalid or empty text provided');
            }

            const systemPrompt = `Proofread the following text and identify grammar, spelling, punctuation, and style issues:

"${sanitizedText}"

For each issue found, provide in this exact format:
TYPE: [grammar/spelling/punctuation/style]
SEVERITY: [critical/warning/info]
ORIGINAL: [the text with the error]
SUGGESTION: [the corrected version]
EXPLANATION: [brief explanation]

If no issues found, respond with "NO ERRORS FOUND"

Now analyze the text:`;

            const analysis = await this.makeRequest(systemPrompt, 0.3, 1024);

            // Parse the response
            const corrections = this._parseProofreadResponse(analysis);

            return {
                success: true,
                corrections: corrections,
                totalErrors: corrections.length,
                correctedText: text, // Could implement auto-correction
                stats: {
                    totalErrors: corrections.length,
                    byType: this._countByField(corrections, 'type'),
                    bySeverity: this._countByField(corrections, 'severity'),
                    errorRate: ((corrections.length / text.split(/\s+/).length) * 100).toFixed(2)
                },
                timestamp: new Date().toISOString(),
                source: 'gemini'
            };
        } catch (error) {
            console.error('Gemini proofread error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Parse proofread response into structured corrections
     */
    _parseProofreadResponse(response) {
        if (response.includes('NO ERRORS FOUND')) {
            return [];
        }

        const corrections = [];
        const lines = response.split('\n');
        let currentCorrection = {};

        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed.startsWith('TYPE:')) {
                if (Object.keys(currentCorrection).length > 0) {
                    corrections.push(currentCorrection);
                }
                currentCorrection = {
                    type: trimmed.replace('TYPE:', '').trim().toLowerCase()
                };
            } else if (trimmed.startsWith('SEVERITY:')) {
                currentCorrection.severity = trimmed.replace('SEVERITY:', '').trim().toLowerCase();
            } else if (trimmed.startsWith('ORIGINAL:')) {
                currentCorrection.original = trimmed.replace('ORIGINAL:', '').trim();
            } else if (trimmed.startsWith('SUGGESTION:')) {
                currentCorrection.suggestion = trimmed.replace('SUGGESTION:', '').trim();
            } else if (trimmed.startsWith('EXPLANATION:')) {
                currentCorrection.explanation = trimmed.replace('EXPLANATION:', '').trim();
            }
        }

        // Add last correction
        if (Object.keys(currentCorrection).length > 0) {
            corrections.push(currentCorrection);
        }

        return corrections;
    }

    /**
     * Count corrections by field
     */
    _countByField(corrections, field) {
        return corrections.reduce((acc, correction) => {
            const value = correction[field];
            acc[value] = (acc[value] || 0) + 1;
            return acc;
        }, {});
    }

    /**
     * Validate API key format
     * @private
     */
    _isValidApiKey(key) {
        if (!key || typeof key !== 'string') return false;
        // Google API keys start with 'AIza' and are 39 characters
        return /^AIza[0-9A-Za-z_-]{35}$/.test(key);
    }

    /**
     * Check and enforce rate limiting
     * @private
     */
    _checkRateLimit() {
        const now = Date.now();

        // Reset counter if window has passed
        if (now - this.lastResetTime >= this.requestWindow) {
            this.requestCount = 0;
            this.lastResetTime = now;
        }

        // Check if limit exceeded
        if (this.requestCount >= this.maxRequestsPerWindow) {
            const timeUntilReset = this.requestWindow - (now - this.lastResetTime);
            throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(timeUntilReset / 1000)} seconds.`);
        }

        this.requestCount++;
    }

    /**
     * Sanitize input to prevent prompt injection
     * @private
     */
    _sanitizeInput(input) {
        if (!input || typeof input !== 'string') return '';

        // Remove potentially dangerous control characters
        let sanitized = input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

        // Escape any potential prompt injection patterns
        // Remove multiple system-like instructions
        sanitized = sanitized.replace(/\n{3,}/g, '\n\n'); // Limit consecutive newlines

        return sanitized.trim();
    }

    /**
     * Validate input length
     * @private
     */
    _validateInputLength(input) {
        if (!input) return true;
        if (input.length > this.maxInputLength) {
            throw new Error(`Input too long. Maximum ${this.maxInputLength} characters allowed (got ${input.length}).`);
        }
        return true;
    }
}

export default new GeminiAPI();
