/**
 * check & log available Chrome AI capabilities
 */

export async function checkAICapabilities() {
    const capabilities = {};

    console.log('🔍 Checking Chrome AI Capabilities...');

    // check prompt API (Gemini Nano with multimodal)
    if ('ai' in window && 'languageModel' in window.ai) {
        try {
            const canCreate = await window.ai.languageModel.canCreateTextSession();
            capabilities.promptAPI = {
                available: canCreate === 'readily' || canCreate === 'after-download',
                status: canCreate,
                description: 'Prompt API for text analysis and generation',
            };
            console.log('✓ Prompt API:', canCreate);
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
    }

    // check Summarizer API
    if ('ai' in window && 'summarizer' in window.ai) {
        try {
            const canCreate = await window.ai.summarizer.canCreateSummarizerSession();
            capabilities.summarizerAPI = {
                available: canCreate === 'readily' || canCreate === 'after-download',
                status: canCreate,
                description: 'Summarizer API for content condensing',
            };
            console.log('✓ Summarizer API:', canCreate);
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
    }

    // check Writer API
    if ('ai' in window && 'writer' in window.ai) {
        try {
            const canCreate = await window.ai.writer.canCreateGenericSession();
            capabilities.writerAPI = {
                available: canCreate === 'readily' || canCreate === 'after-download',
                status: canCreate,
                description: 'Writer API for content generation',
            };
            console.log('✓ Writer API:', canCreate);
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
    }

    // check Rewriter API
    if ('ai' in window && 'rewriter' in window.ai) {
        try {
            const canCreate = await window.ai.rewriter.canCreateGenericSession();
            capabilities.rewriterAPI = {
                available: canCreate === 'readily' || canCreate === 'after-download',
                status: canCreate,
                description: 'Rewriter API for content rewriting',
            };
            console.log('✓ Rewriter API:', canCreate);
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
    }

    // check Translator API
    if ('ai' in window && 'translator' in window.ai) {
        try {
            capabilities.translatorAPI = {
                available: true,
                description: 'Translator API for multilingual support',
            };
            console.log('✓ Translator API: available');
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
    }

    // check Proofreader API
    if ('ai' in window && 'proofreader' in window.ai) {
        try {
            const canCreate = await window.ai.proofreader.canCreateProofreaderSession();
            capabilities.proofreaderAPI = {
                available: canCreate === 'readily' || canCreate === 'after-download',
                status: canCreate,
                description: 'Proofreader API for grammar checking',
            };
            console.log('✓ Proofreader API:', canCreate);
        } catch (e) {
            capabilities.proofreaderAPI = { 
                available: false, 
                error: e.message,
                description: 'Proofreader API - NOT AVAILABLE'
            };
            console.warn('✗ Proofreader API error:', e.message);
        }
    } else {
        capabilities.proofreaderAPI = { 
            available: false, 
            description: 'Proofreader API not found' 
        };
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