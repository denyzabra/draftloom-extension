/**
 * check & log available Chrome AI capabilities
 */

export async function checkAICapabilities() {
    const capabilities = {};

    console.log('🔍 Checking Chrome AI Capabilities...');
    console.log('window.ai available:', 'ai' in window);
    console.log('window.ai type:', typeof window.ai);

    if ('ai' in window && window.ai) {
        console.log('window.ai contents:', Object.keys(window.ai));
    } else {
        console.warn('⚠️ window.ai is not available. This might be because:');
        console.warn('1. Chrome AI flags are not enabled');
        console.warn('2. You need to restart Chrome after enabling flags');
        console.warn('3. Chrome Canary/Dev version is too old (need 127+)');
    }

    // check prompt API (Gemini Nano with multimodal)
    if ('ai' in window && 'languageModel' in window.ai) {
        try {
            const canCreate = await window.ai.languageModel.capabilities();
            const available = canCreate.available !== 'no';
            capabilities.promptAPI = {
                available: available,
                status: canCreate.available,
                description: 'Prompt API for text analysis and generation',
            };
            console.log('✓ Prompt API:', canCreate.available);
        } catch (e) {
            capabilities.promptAPI = {
                available: false,
                error: e.message,
                description: 'Prompt API - NOT AVAILABLE'
            };
            console.warn('✗ Prompt API error:', e.message);
        }
    } else {
        capabilities.promptAPI = {
            available: false,
            description: 'Prompt API not found in window.ai'
        };
        console.warn('✗ Prompt API not found in window.ai');
    }

    // check Summarizer API
    if ('ai' in window && 'summarizer' in window.ai) {
        try {
            const canCreate = await window.ai.summarizer.capabilities();
            const available = canCreate.available !== 'no';
            capabilities.summarizerAPI = {
                available: available,
                status: canCreate.available,
                description: 'Summarizer API for content condensing',
            };
            console.log('✓ Summarizer API:', canCreate.available);
        } catch (e) {
            capabilities.summarizerAPI = {
                available: false,
                error: e.message,
                description: 'Summarizer API - NOT AVAILABLE'
            };
            console.warn('✗ Summarizer API error:', e.message);
        }
    } else {
        capabilities.summarizerAPI = {
            available: false,
            description: 'Summarizer API not found'
        };
        console.warn('✗ Summarizer API not found');
    }

    // check Writer API
    if ('ai' in window && 'writer' in window.ai) {
        try {
            const canCreate = await window.ai.writer.capabilities();
            const available = canCreate.available !== 'no';
            capabilities.writerAPI = {
                available: available,
                status: canCreate.available,
                description: 'Writer API for content generation',
            };
            console.log('✓ Writer API:', canCreate.available);
        } catch (e) {
            capabilities.writerAPI = {
                available: false,
                error: e.message,
                description: 'Writer API - NOT AVAILABLE'
            };
            console.warn('✗ Writer API error:', e.message);
        }
    } else {
        capabilities.writerAPI = {
            available: false,
            description: 'Writer API not found'
        };
        console.warn('✗ Writer API not found');
    }

    // check Rewriter API
    if ('ai' in window && 'rewriter' in window.ai) {
        try {
            const canCreate = await window.ai.rewriter.capabilities();
            const available = canCreate.available !== 'no';
            capabilities.rewriterAPI = {
                available: available,
                status: canCreate.available,
                description: 'Rewriter API for content rewriting',
            };
            console.log('✓ Rewriter API:', canCreate.available);
        } catch (e) {
            capabilities.rewriterAPI = {
                available: false,
                error: e.message,
                description: 'Rewriter API - NOT AVAILABLE'
            };
            console.warn('✗ Rewriter API error:', e.message);
        }
    } else {
        capabilities.rewriterAPI = {
            available: false,
            description: 'Rewriter API not found'
        };
        console.warn('✗ Rewriter API not found');
    }

    // check Translator API
    if ('ai' in window && 'translator' in window.ai) {
        try {
            const canCreate = await window.ai.translator.capabilities();
            const available = canCreate.available !== 'no';
            capabilities.translatorAPI = {
                available: available,
                status: canCreate.available,
                description: 'Translator API for multilingual support',
            };
            console.log('✓ Translator API:', canCreate.available);
        } catch (e) {
            capabilities.translatorAPI = {
                available: false,
                error: e.message,
                description: 'Translator API - NOT AVAILABLE'
            };
            console.warn('✗ Translator API error:', e.message);
        }
    } else {
        capabilities.translatorAPI = {
            available: false,
            description: 'Translator API not found'
        };
        console.warn('✗ Translator API not found');
    }

    // check Proofreader API
    if ('ai' in window && 'languageDetector' in window.ai) {
        try {
            const canCreate = await window.ai.languageDetector.capabilities();
            const available = canCreate.available !== 'no';
            capabilities.proofreaderAPI = {
                available: available,
                status: canCreate.available,
                description: 'Language Detector API for grammar checking',
            };
            console.log('✓ Language Detector API:', canCreate.available);
        } catch (e) {
            capabilities.proofreaderAPI = {
                available: false,
                error: e.message,
                description: 'Language Detector API - NOT AVAILABLE'
            };
            console.warn('✗ Language Detector API error:', e.message);
        }
    } else {
        capabilities.proofreaderAPI = {
            available: false,
            description: 'Language Detector API not found'
        };
        console.warn('✗ Language Detector API not found');
    }

    // summary
    const availableCount = Object.values(capabilities).filter(c => c.available).length;
    console.log(`\n✅ Summary: ${availableCount}/6 APIs available`);

    return capabilities;
}

/**
 * format capabilities 4 UI display
 */
export function formatCapabilitiesForUI(capabilities) {
    const status = {
        available: [],
        unavailable: [],
        info: []
    };

    Object.entries(capabilities).forEach(([key, cap]) => {
        const displayName = key.replace('API', '').replace(/([A-Z])/g, ' $1').trim();
        
        if (cap.available) {
            status.available.push(`✓ ${displayName}`);
        } else {
            status.unavailable.push(`✗ ${displayName}`);
        }
    });

    return status;
}

/**
 * check if all critical APIs are available
 */
export function areCriticalAPIsAvailable(capabilities) {
    const criticalAPIs = ['promptAPI', 'writerAPI', 'proofreaderAPI'];
    return criticalAPIs.every(api => capabilities[api]?.available);
}