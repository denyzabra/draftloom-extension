/**
 * chrome AI translator api wrapper
 */

class TranslatorAPIWrapper {
    constructor() {
        this.sessionCache = {};
    }

    async initialize(sourceLanguage = 'en', targetLanguage = 'es') {
        const cacheKey = `${sourceLanguage}-${targetLanguage}`;
        
        if (!('ai' in window) || !('translator' in window.ai)) {
            throw new Error('Translator API not available');
        }
        
        if (!this.sessionCache[cacheKey]) {
            try {
                this.sessionCache[cacheKey] = await window.ai.translator.createTranslatorSession({
                    sourceLanguage,
                    targetLanguage,
                });
                console.log(`✓ Translator session initialized: ${sourceLanguage} → ${targetLanguage}`);
            } catch (error) {
                console.error('❌ Translator initialization error:', error);
                throw error;
            }
        }
        
        return this.sessionCache[cacheKey];
    }

    async translate(text, sourceLanguage = 'en', targetLanguage = 'es') {
        if (!text || text.trim().length === 0) {
            return { success: false, error: 'Text cannot be empty' };
        }

        try {
            const session = await this.initialize(sourceLanguage, targetLanguage);
            const translated = await session.translate(text);
            
            return {
                success: true,
                translated,
                sourceLanguage,
                targetLanguage,
                originalLength: text.split(/\s+/).length,
                translatedLength: translated.split(/\s+/).length,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Translate error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    // supported languages
    getSupportedLanguages() {
        return [
            { code: 'en', name: 'English' },
            { code: 'es', name: 'Spanish' },
            { code: 'fr', name: 'French' },
            { code: 'de', name: 'German' },
            { code: 'it', name: 'Italian' },
            { code: 'pt', name: 'Portuguese' },
            { code: 'ja', name: 'Japanese' },
            { code: 'zh', name: 'Chinese' },
            { code: 'ru', name: 'Russian' },
            { code: 'ar', name: 'Arabic' },
            { code: 'sw', name: 'Swahili' },
        ];
    }
}

export default new TranslatorAPIWrapper();