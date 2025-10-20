/**
 * chrome AI proofreader api wrapper
 */

class ProofreaderAPIWrapper {
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
            if (!('ai' in window) || !('proofreader' in window.ai)) {
                throw new Error('Proofreader API not available');
            }

            const canCreate = await window.ai.proofreader.canCreateProofreaderSession();
            
            if (canCreate === 'after-download') {
                console.log('⏳ Downloading Proofreader model...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            this.session = await window.ai.proofreader.createProofreaderSession();
            this.isReady = true;
            this.createdAt = Date.now();
            
            console.log('✓ Proofreader API session initialized');
            return this.session;
        } catch (error) {
            console.error('❌ Proofreader API initialization failed:', error.message);
            this.isReady = false;
            throw error;
        }
    }

    /**
     * proofread text & return corrections
     */
    async proofread(text) {
        if (!text || text.trim().length === 0) {
            return { success: false, error: 'Text cannot be empty' };
        }

        const session = await this.initialize();

        try {
            const corrections = await session.proofread(text);
            
            const formattedCorrections = this._formatCorrections(corrections);
            const stats = this._calculateStats(text, formattedCorrections);
            
            return {
                success: true,
                corrections: formattedCorrections,
                stats,
                totalErrors: formattedCorrections.length,
                correctedText: this._applyCorrections(text, formattedCorrections),
                hasCriticalErrors: formattedCorrections.some(c => c.severity === 'critical'),
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Proofread error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * format corrections for display
     */
    _formatCorrections(corrections) {
        if (!Array.isArray(corrections)) {
            return [];
        }

        return corrections.map((correction) => {
            const type = this._categorizeError(correction);
            const severity = this._determineSeverity(type);
            
            return {
                type,
                severity,
                original: correction.original || '',
                suggestion: correction.suggestion || '',
                explanation: this._getExplanation(type, correction),
                position: correction.start || 0,
                context: this._getContext(correction),
            };
        });
    }

    /**
     * categorize error type
     */
    _categorizeError(correction) {
        const reason = (correction.reason || '').toLowerCase();
        
        if (reason.includes('spelling') || reason.includes('misspell')) return 'spelling';
        if (reason.includes('grammar')) return 'grammar';
        if (reason.includes('punctuation')) return 'punctuation';
        if (reason.includes('subject') && reason.includes('verb')) return 'subject-verb-agreement';
        if (reason.includes('tense')) return 'tense';
        if (reason.includes('article')) return 'article-usage';
        if (reason.includes('style')) return 'style';
        if (reason.includes('clarity')) return 'clarity';
        if (reason.includes('word choice')) return 'word-choice';
        
        return 'other';
    }

    /**
     * determine error severity
     */
    _determineSeverity(type) {
        const criticalErrors = ['grammar', 'subject-verb-agreement', 'spelling'];
        const warningErrors = ['punctuation', 'tense', 'article-usage'];
        
        if (criticalErrors.includes(type)) return 'critical';
        if (warningErrors.includes(type)) return 'warning';
        return 'info';
    }

    /**
     * get educational explanation for error
     */
    _getExplanation(type, correction) {
        const explanations = {
            spelling: `"${correction.original}" is misspelled. Use "${correction.suggestion}" instead.`,
            grammar: `Grammar issue: ${correction.reason || 'Incorrect usage'}. Suggestion: "${correction.suggestion}"`,
            punctuation: `Punctuation correction: ${correction.reason || 'Punctuation needed'}. Use: "${correction.suggestion}"`,
            'subject-verb-agreement': `The subject and verb don't agree. Change to: "${correction.suggestion}"`,
            tense: `Tense inconsistency detected. Use: "${correction.suggestion}"`,
            'article-usage': `Article usage: Use "${correction.suggestion}" instead of "${correction.original}"`,
            style: `Style improvement: "${correction.suggestion}" is better than "${correction.original}"`,
            clarity: `For clarity: Change "${correction.original}" to "${correction.suggestion}"`,
            'word-choice': `Word choice: "${correction.suggestion}" fits better than "${correction.original}"`,
        };
        
        return explanations[type] || `Suggested change: "${correction.suggestion}"`;
    }

    /**
     * get context around error
     */
    _getContext(correction) {
        return {
            before: correction.before || '',
            after: correction.after || '',
        };
    }

    /**
     * calculate proofreading statistics
     */
    _calculateStats(originalText, corrections) {
        const byType = {};
        const bySeverity = { critical: 0, warning: 0, info: 0 };
        
        corrections.forEach(c => {
            byType[c.type] = (byType[c.type] || 0) + 1;
            bySeverity[c.severity] = (bySeverity[c.severity] || 0) + 1;
        });
        
        return {
            totalErrors: corrections.length,
            byType,
            bySeverity,
            errorRate: ((corrections.length / originalText.split(/\s+/).length) * 100).toFixed(2),
        };
    }

    /**
     * apply corrections to text
     */
    _applyCorrections(original, corrections) {
        let corrected = original;
        
        // sort corrections by position (reverse order to maintain positions)
        const sorted = [...corrections].sort((a, b) => b.position - a.position);
        
        sorted.forEach((correction) => {
            if (correction.suggestion && correction.original) {
                const regex = new RegExp(correction.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                corrected = corrected.replace(regex, correction.suggestion);
            }
        });
        
        return corrected;
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

export default new ProofreaderAPIWrapper();