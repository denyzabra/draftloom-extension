import sessionStore from '../storage/session-store.js';
import apiManager from '../apis/apiManager.js';
import promptAPI from '../apis/promptAPI.js';
import writerAPI from '../apis/writerAPI.js';
import rewriterAPI from '../apis/rewriterAPI.js';
import proofreaderAPI from '../apis/proofreaderAPI.js';
import summarizerAPI from '../apis/summarizerAPI.js';
import translatorAPI from '../apis/translatorAPI.js';
import ferpaChecker from '../utils/ferpa-checker.js';
import cacheStore from '../storage/cache-store.js';

class SidebarController {
    constructor() {
        this.elements = {};
        this.currentSession = null;
        this.currentDraft = null;
        this.isProcessing = false;
        this.init();
    }

    async init() {
        try {
            console.log('🎨 Initializing DraftLoom Sidebar...');
            
            // Initialize API manager
            await apiManager.initialize();
            
            // Check critical APIs
            if (!apiManager.isCriticalReady()) {
                this.showWarning('Some AI features are not available. Please update Chrome to version 132+');
            }

            // Cache elements
            this.cacheElements();
            
            // Attach event listeners
            this.attachEventListeners();
            
            // Load current session
            this.currentSession = await sessionStore.getOrCreateSession();
            
            // Setup tab navigation
            this.setupTabNavigation();
            
            console.log('✅ Sidebar initialized successfully');
        } catch (error) {
            console.error('❌ Sidebar initialization error:', error);
            this.showError('Failed to initialize DraftLoom. Please refresh the page.');
        }
    }

    cacheElements() {
        this.elements = {
            // Tabs
            tabButtons: document.querySelectorAll('.tab-btn'),
            tabContents: document.querySelectorAll('.tab-content'),
            
            // Brainstorm Tab
            promptInput: document.getElementById('prompt-input'),
            analyzePromptBtn: document.getElementById('analyze-prompt'),
            promptAnalysis: document.getElementById('prompt-analysis'),

            // Draft Tab
            draftInput: document.getElementById('draft-input'),
            generateDraftBtn: document.getElementById('generate-draft'),
            draftOutput: document.getElementById('draft-output'),

            // Rewrite Tab
            toneSelect: document.getElementById('tone-select'),
            lengthSelect: document.getElementById('length-select'),
            rewriteInput: document.getElementById('rewrite-input'),
            rewriteBtn: document.getElementById('rewrite-text'),
            rewriteOutput: document.getElementById('rewrite-output'),

            // Proofread Tab
            proofreadInput: document.getElementById('proofread-input'),
            proofreadBtn: document.getElementById('proofread-text'),
            proofreadOutput: document.getElementById('proofread-output'),
            correctionsList: document.getElementById('corrections-list'),
        };
    }

    attachEventListeners() {
        this.elements.analyzePromptBtn?.addEventListener('click', () => this.analyzePrompt());
        this.elements.generateDraftBtn?.addEventListener('click', () => this.generateDraft());
        this.elements.rewriteBtn?.addEventListener('click', () => this.rewriteText());
        this.elements.proofreadBtn?.addEventListener('click', () => this.proofreadText());
    }

    setupTabNavigation() {
        this.elements.tabButtons.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
    }

    switchTab(tabName) {
        this.elements.tabContents.forEach((content) => {
            content.classList.remove('active');
        });

        this.elements.tabButtons.forEach((btn) => {
            btn.classList.remove('active');
        });

        const tabContent = document.getElementById(`${tabName}-tab`);
        if (tabContent) {
            tabContent.classList.add('active');
        }

        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabBtn) {
            tabBtn.classList.add('active');
        }
    }

    async analyzePrompt() {
        const prompt = this.elements.promptInput.value.trim();

        if (!prompt) {
            this.showError('Please enter an assignment prompt');
            return;
        }

        // Check FERPA compliance
        const ferpaCheck = ferpaChecker.verifyCompliance(prompt);
        if (!ferpaCheck.compliant) {
            this.showError('⚠️ Your prompt contains sensitive student information. Please remove it to comply with FERPA regulations.');
            console.log('FERPA violations:', ferpaCheck.violations);
            return;
        }

        this.setButtonLoading(this.elements.analyzePromptBtn, true);

        try {
            // Check cache first
            const cacheKey = cacheStore.getCacheKey('analyzePrompt', { prompt });
            let analysis = cacheStore.get(cacheKey);

            if (!analysis) {
                analysis = await promptAPI.analyzePrompt(prompt);
                
                if (analysis.success) {
                    // Cache the result
                    cacheStore.set(cacheKey, analysis);
                }
            }

            if (analysis.success) {
                this.elements.promptAnalysis.innerHTML = this._formatOutput(analysis.analysis);
                this.showSuccess('Prompt analyzed successfully!');
            } else {
                this.showError(`Error: ${analysis.error}`);
            }
        } catch (error) {
            console.error('Analysis error:', error);
            this.showError('Failed to analyze prompt. Please try again.');
        } finally {
            this.setButtonLoading(this.elements.analyzePromptBtn, false);
        }
    }

    async generateDraft() {
        const ideas = this.elements.draftInput.value.trim();

        if (!ideas) {
            this.showError('Please enter your ideas or outline');
            return;
        }

        // Check FERPA compliance
        const ferpaCheck = ferpaChecker.verifyCompliance(ideas);
        if (!ferpaCheck.compliant) {
            this.showError('⚠️ Your draft contains sensitive information. Please remove it.');
            return;
        }

        this.setButtonLoading(this.elements.generateDraftBtn, true);

        try {
            const draft = await writerAPI.generateDraft('Student Essay', ideas, 'academic');

            if (draft.success) {
                this.elements.draftOutput.innerHTML = this._formatOutput(draft.draft);
                
                // Save draft
                this.currentDraft = await sessionStore.saveDraft({
                    title: 'Generated Draft',
                    content: draft.draft,
                });

                this.showSuccess(`Draft generated! (${draft.wordCount} words)`);
            } else {
                this.showError(`Error: ${draft.error}`);
            }
        } catch (error) {
            console.error('Draft generation error:', error);
            this.showError('Failed to generate draft. Please try again.');
        } finally {
            this.setButtonLoading(this.elements.generateDraftBtn, false);
        }
    }

    async rewriteText() {
        const text = this.elements.rewriteInput.value.trim();
        const tone = this.elements.toneSelect.value;
        const length = this.elements.lengthSelect.value;

        if (!text) {
            this.showError('Please enter text to rewrite');
            return;
        }

        this.setButtonLoading(this.elements.rewriteBtn, true);

        try {
            let result;

            if (length !== 'maintain') {
                result = await rewriterAPI.adjustLength(text, length);
                const message = length === 'expand' 
                    ? `Text expanded (+${result.percentChange}%)`
                    : `Text condensed (${result.percentChange}%)`;
                this.showSuccess(message);
            } else {
                result = await rewriterAPI.rewriteWithTone(text, tone);
                this.showSuccess(`Text rewritten in ${tone} tone`);
            }

            if (result.success) {
                const content = result.rewritten || result.adjusted;
                this.elements.rewriteOutput.innerHTML = this._formatOutput(content);
            } else {
                this.showError(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Rewrite error:', error);
            this.showError('Failed to rewrite text. Please try again.');
        } finally {
            this.setButtonLoading(this.elements.rewriteBtn, false);
        }
    }

    async proofreadText() {
        const text = this.elements.proofreadInput.value.trim();

        if (!text) {
            this.showError('Please enter text to proofread');
            return;
        }

        this.setButtonLoading(this.elements.proofreadBtn, true);

        try {
            const result = await proofreaderAPI.proofread(text);

            if (result.success) {
                this._displayCorrections(result);
                
                const message = result.totalErrors === 0 
                    ? '✅ No errors found!'
                    : `Found ${result.totalErrors} issue(s)`;
                this.showSuccess(message);
            } else {
                this.showError(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Proofread error:', error);
            this.showError('Failed to proofread. Please try again.');
        } finally {
            this.setButtonLoading(this.elements.proofreadBtn, false);
        }
    }

    _displayCorrections(result) {
        this.elements.correctionsList.innerHTML = '';

        if (result.totalErrors === 0) {
            this.elements.correctionsList.innerHTML = '<p class="success">✓ No errors found!</p>';
            return;
        }

        // Summary stats
        const stats = result.stats;
        const summaryHTML = `
            <div class="corrections-summary">
                <p><strong>Total Issues:</strong> ${result.totalErrors}</p>
                <p><strong>Critical:</strong> ${stats.bySeverity.critical} | 
                   <strong>Warnings:</strong> ${stats.bySeverity.warning} | 
                   <strong>Info:</strong> ${stats.bySeverity.info}</p>
                <p><strong>Error Rate:</strong> ${stats.errorRate}%</p>
            </div>
        `;
        this.elements.correctionsList.innerHTML = summaryHTML;

        // Individual corrections
        result.corrections.forEach((correction, index) => {
            const item = document.createElement('div');
            item.className = `correction-item correction-${correction.severity}`;
            
            const typeLabel = correction.type.replace(/-/g, ' ').toUpperCase();
            
            item.innerHTML = `
                <div class="correction-header">
                    <strong>${typeLabel}</strong>
                    <span class="severity-badge severity-${correction.severity}">${correction.severity}</span>
                </div>
                <div class="correction-content">
                    <p class="original">Original: <del>"${this._escapeHtml(correction.original)}"</del></p>
                    <p class="suggestion">Suggestion: <ins>"${this._escapeHtml(correction.suggestion)}"</ins></p>
                    <p class="explanation">${this._escapeHtml(correction.explanation)}</p>
                </div>
            `;
            this.elements.correctionsList.appendChild(item);
        });

        // Corrected text section
        const correctionSection = document.createElement('div');
        correctionSection.className = 'corrected-text-section';
        correctionSection.innerHTML = `
            <h4>Corrected Version:</h4>
            <textarea readonly class="corrected-text">${result.correctedText}</textarea>
            <button class="btn btn-secondary" onclick="copyToClipboard(this.nextElementSibling)">
                Copy Corrected Text
            </button>
        `;
        this.elements.proofreadOutput.appendChild(correctionSection);
    }

    _formatOutput(text) {
        return `<div class="formatted-output">${text.replace(/\n/g, '<br>')}</div>`;
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setButtonLoading(button, isLoading) {
        if (!button) return;

        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = '⏳ Processing...';
            this.isProcessing = true;
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || 'Process';
            this.isProcessing = false;
        }
    }

    showSuccess(message) {
        this._showNotification(message, 'success');
    }

    showError(message) {
        this._showNotification(message, 'error');
    }

    showWarning(message) {
        this._showNotification(message, 'warning');
    }

    _showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add to page
        const header = document.querySelector('.sidebar-header');
        if (header) {
            header.parentElement.insertBefore(notification, header.nextElementSibling);
        }

        // Auto-remove after 4 seconds
        setTimeout(() => {
            notification.remove();
        }, 4000);

        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new SidebarController());
} else {
    new SidebarController();
}

// Global utility
window.copyToClipboard = function(element) {
    if (element.tagName === 'TEXTAREA') {
        element.select();
        document.execCommand('copy');
        alert('✓ Copied to clipboard!');
    }
};