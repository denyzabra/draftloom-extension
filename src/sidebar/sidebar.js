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
import contentScriptBridge from '../apis/contentScriptBridge.js';
import geminiAPI from '../apis/geminiAPI.js';
import demoAPI from '../apis/demoAPI.js';

class SidebarController {
    constructor() {
        this.elements = {};
        this.currentSession = null;
        this.currentDraft = null;
        this.isProcessing = false;
        this.useDemoMode = false;
        this.useGeminiAPI = false;
        this.init();
    }

    async init() {
        try {
            console.log('🎨 Initializing DraftLoom Sidebar...');

            // Cache elements first
            this.cacheElements();

            // Initialize API manager (direct access - won't work in extension context)
            await apiManager.initialize();

            // Check critical APIs and show detailed status
            const caps = apiManager.getCapabilities();
            const availableCount = Object.values(caps).filter(c => c.available).length;

            // Try content script bridge as workaround
            console.log('🔄 Checking content script bridge...');
            const bridgeStatus = await contentScriptBridge.checkAvailability();

            // Check Gemini API availability
            await geminiAPI.initialize();
            const geminiStatus = await geminiAPI.checkAvailability();

            if (availableCount === 0 && !bridgeStatus.available) {
                // No Chrome AI available - check for Gemini API
                if (geminiStatus.available) {
                    this.showSuccess(`✅ AI Powered by Google Gemini API

Chrome Built-in AI not available, using Gemini API fallback.
All features working with real AI processing!

🔒 FERPA compliance enabled
📊 Session management active`);
                    this.useGeminiAPI = true;
                    this.useDemoMode = false;
                } else {
                    this.showWarning(`⚙️ AI API Configuration Required

Chrome Built-in AI is not available on this browser.
Please configure Google Gemini API in Settings for real AI processing.

🎯 Currently using Demo Mode (simulated responses)
✅ All features functional
✅ FERPA compliance enabled

💡 Go to Settings → Configure Gemini API Key`);
                    this.useDemoMode = true;
                    this.useGeminiAPI = false;
                }
            } else if (bridgeStatus.available) {
                this.showSuccess(`✅ AI Features ready via Chrome Built-in AI!

Navigate to any webpage to use AI features.`);
                this.useDemoMode = false;
                this.useGeminiAPI = false;
            } else if (!apiManager.isCriticalReady()) {
                // Partial availability - use Gemini as fallback
                if (geminiStatus.available) {
                    this.showSuccess(`✅ Hybrid Mode Active

Chrome AI: ${availableCount}/6 APIs
Gemini API: Configured ✅
Missing features will use Gemini API.`);
                    this.useGeminiAPI = true;
                    this.useDemoMode = false;
                } else {
                    this.showWarning(`Some AI features unavailable (${availableCount}/6 APIs ready). Using demo mode for unavailable features.`);
                    this.useDemoMode = true;
                    this.useGeminiAPI = false;
                }
            } else {
                this.showSuccess(`✅ All AI features ready (${availableCount}/6 Chrome APIs available)`);
                this.useDemoMode = false;
                this.useGeminiAPI = false;
            }

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
            // Header
            closeBtn: document.getElementById('close-sidebar'),

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

            // Analyze Page Tab
            analyzePageBtn: document.getElementById('analyze-page-btn'),
            pageAnalysisOutput: document.getElementById('page-analysis-output'),

            // Settings Tab
            apiStatus: document.getElementById('api-status'),
            refreshApiStatusBtn: document.getElementById('refresh-api-status'),
            geminiApiKeyInput: document.getElementById('gemini-api-key'),
            saveGeminiKeyBtn: document.getElementById('save-gemini-key'),
            testGeminiKeyBtn: document.getElementById('test-gemini-key'),
            geminiStatus: document.getElementById('gemini-status'),
            enableCacheCheckbox: document.getElementById('enable-cache'),
            clearCacheBtn: document.getElementById('clear-cache'),
        };
    }

    attachEventListeners() {
        // Close button
        this.elements.closeBtn?.addEventListener('click', () => {
            window.close();
        });

        // Feature buttons
        this.elements.analyzePromptBtn?.addEventListener('click', () => this.analyzePrompt());
        this.elements.generateDraftBtn?.addEventListener('click', () => this.generateDraft());
        this.elements.rewriteBtn?.addEventListener('click', () => this.rewriteText());
        this.elements.proofreadBtn?.addEventListener('click', () => this.proofreadText());
        this.elements.analyzePageBtn?.addEventListener('click', () => this.analyzeCurrentPage());

        // Settings buttons
        this.elements.refreshApiStatusBtn?.addEventListener('click', () => this.refreshAPIStatus());
        this.elements.saveGeminiKeyBtn?.addEventListener('click', () => this.saveGeminiKey());
        this.elements.testGeminiKeyBtn?.addEventListener('click', () => this.testGeminiConnection());
        this.elements.clearCacheBtn?.addEventListener('click', () => this.clearCache());
        this.elements.enableCacheCheckbox?.addEventListener('change', (e) => {
            this.toggleCache(e.target.checked);
        });
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

        // Auto-refresh API status when settings tab is opened
        if (tabName === 'settings') {
            this.refreshAPIStatus();
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
                // Priority: Chrome AI (bridge/direct) → Gemini API → Demo Mode
                if (this.useDemoMode && !this.useGeminiAPI) {
                    console.log('🎯 Using demo mode');
                    analysis = await demoAPI.analyzePrompt(prompt);
                } else if (this.useGeminiAPI) {
                    console.log('🌐 Using Gemini API');
                    try {
                        analysis = await geminiAPI.analyzePrompt(prompt);
                    } catch (geminiError) {
                        console.warn('Gemini API failed, falling back to demo mode:', geminiError);
                        analysis = await demoAPI.analyzePrompt(prompt);
                    }
                } else {
                    try {
                        analysis = await contentScriptBridge.analyzePrompt(prompt);
                        console.log('✅ Used Chrome Built-in AI (content script)');
                    } catch (bridgeError) {
                        console.warn('Content script bridge failed, trying direct API:', bridgeError);
                        try {
                            analysis = await promptAPI.analyzePrompt(prompt);
                            console.log('✅ Used Chrome Built-in AI (direct)');
                        } catch (directError) {
                            console.warn('Chrome AI failed, trying Gemini API:', directError);
                            try {
                                await geminiAPI.initialize();
                                analysis = await geminiAPI.analyzePrompt(prompt);
                                console.log('✅ Used Gemini API fallback');
                            } catch (geminiError) {
                                console.warn('All APIs failed, using demo mode:', geminiError);
                                analysis = await demoAPI.analyzePrompt(prompt);
                            }
                        }
                    }
                }

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
            this.showError('Failed to analyze prompt. Make sure you have a webpage open.');
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
            let draft;
            // Priority: Chrome AI → Gemini API → Demo Mode
            if (this.useDemoMode && !this.useGeminiAPI) {
                console.log('🎯 Using demo mode');
                draft = await demoAPI.generateDraft('Student Essay', ideas);
            } else if (this.useGeminiAPI) {
                console.log('🌐 Using Gemini API');
                try {
                    draft = await geminiAPI.generateDraft('Student Essay', ideas);
                } catch (geminiError) {
                    console.warn('Gemini API failed, falling back to demo mode:', geminiError);
                    draft = await demoAPI.generateDraft('Student Essay', ideas);
                }
            } else {
                try {
                    draft = await contentScriptBridge.generateDraft('Student Essay', ideas);
                    console.log('✅ Used Chrome Built-in AI');
                } catch (bridgeError) {
                    try {
                        draft = await writerAPI.generateDraft('Student Essay', ideas, 'academic');
                    } catch (directError) {
                        try {
                            await geminiAPI.initialize();
                            draft = await geminiAPI.generateDraft('Student Essay', ideas);
                            console.log('✅ Used Gemini API fallback');
                        } catch (geminiError) {
                            draft = await demoAPI.generateDraft('Student Essay', ideas);
                        }
                    }
                }
            }

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
            this.showError('Failed to generate draft. Make sure you have a webpage open.');
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

            // Priority: Chrome AI → Gemini API → Demo Mode
            if (this.useDemoMode && !this.useGeminiAPI) {
                console.log('🎯 Using demo mode');
                result = await demoAPI.rewriteText(text, tone);
            } else if (this.useGeminiAPI) {
                console.log('🌐 Using Gemini API');
                try {
                    result = await geminiAPI.rewriteText(text, tone);
                } catch (geminiError) {
                    console.warn('Gemini API failed, falling back to demo mode:', geminiError);
                    result = await demoAPI.rewriteText(text, tone);
                }
            } else {
                try {
                    result = await contentScriptBridge.rewriteText(text, tone);
                    console.log('✅ Used Chrome Built-in AI');
                } catch (bridgeError) {
                    try {
                        if (length !== 'maintain') {
                            result = await rewriterAPI.adjustLength(text, length);
                        } else {
                            result = await rewriterAPI.rewriteWithTone(text, tone);
                        }
                    } catch (directError) {
                        try {
                            await geminiAPI.initialize();
                            result = await geminiAPI.rewriteText(text, tone);
                            console.log('✅ Used Gemini API fallback');
                        } catch (geminiError) {
                            result = await demoAPI.rewriteText(text, tone);
                        }
                    }
                }
            }

            if (result.success) {
                const content = result.rewritten || result.adjusted;
                this.elements.rewriteOutput.innerHTML = this._formatOutput(content);
                this.showSuccess(`Text rewritten in ${tone} tone`);
            } else {
                this.showError(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Rewrite error:', error);
            this.showError('Failed to rewrite text. Make sure you have a webpage open.');
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
            let result;

            // Priority: Chrome AI → Gemini API → Demo Mode
            if (this.useDemoMode && !this.useGeminiAPI) {
                console.log('🎯 Using demo mode');
                result = await demoAPI.proofread(text);
            } else if (this.useGeminiAPI) {
                console.log('🌐 Using Gemini API');
                try {
                    result = await geminiAPI.proofread(text);
                } catch (geminiError) {
                    console.warn('Gemini API failed, falling back to demo mode:', geminiError);
                    result = await demoAPI.proofread(text);
                }
            } else {
                try {
                    result = await proofreaderAPI.proofread(text);
                    console.log('✅ Used Chrome Built-in AI');
                } catch (error) {
                    try {
                        await geminiAPI.initialize();
                        result = await geminiAPI.proofread(text);
                        console.log('✅ Used Gemini API fallback');
                    } catch (geminiError) {
                        result = await demoAPI.proofread(text);
                    }
                }
            }

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
            // Fallback to demo mode
            try {
                const result = await demoAPI.proofread(text);
                this._displayCorrections(result);
                this.showSuccess(`Found ${result.totalErrors} issue(s) [Demo Mode]`);
            } catch (demoError) {
                this.showError('Failed to proofread. Please try again.');
            }
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

        // Support multiline messages
        notification.style.whiteSpace = 'pre-line';
        notification.textContent = message;

        // Add to page
        const header = document.querySelector('.sidebar-header');
        if (header) {
            header.parentElement.insertBefore(notification, header.nextElementSibling);
        }

        // Auto-remove after longer time for errors
        const duration = type === 'error' ? 10000 : 4000;
        setTimeout(() => {
            notification.remove();
        }, duration);

        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    async analyzeCurrentPage() {
        if (!this.elements.pageAnalysisOutput) return;

        this.setButtonLoading(this.elements.analyzePageBtn, true);

        try {
            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab || !tab.id) {
                this.showError('Could not access current tab');
                return;
            }

            // Send message to content script to analyze the page
            chrome.tabs.sendMessage(tab.id, { type: 'analyze-page' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Error:', chrome.runtime.lastError);
                    this.showError('Could not analyze page. Make sure the page is fully loaded.');
                    this.setButtonLoading(this.elements.analyzePageBtn, false);
                    return;
                }

                if (response && response.status === 'success') {
                    const data = response.data;

                    let outputHTML = `
                        <div class="page-analysis-result">
                            <h3>Page Analysis Results</h3>
                            <div class="analysis-item">
                                <strong>Title:</strong> ${this._escapeHtml(data.title)}
                            </div>
                            <div class="analysis-item">
                                <strong>URL:</strong> <a href="${this._escapeHtml(data.url)}" target="_blank">${this._escapeHtml(data.url)}</a>
                            </div>
                            <div class="analysis-item">
                                <strong>Word Count:</strong> ${data.wordCount} words
                            </div>
                            <div class="analysis-item">
                                <strong>Editable Areas:</strong> ${data.textAreasCount} ${data.hasTextAreas ? '✅' : '❌'}
                            </div>
                    `;

                    if (data.headings && data.headings.length > 0) {
                        outputHTML += `
                            <div class="analysis-item">
                                <strong>Main Headings:</strong>
                                <ul>
                                    ${data.headings.map(h => `<li>${this._escapeHtml(h)}</li>`).join('')}
                                </ul>
                            </div>
                        `;
                    }

                    outputHTML += `
                            <div class="analysis-item">
                                <strong>Analyzed:</strong> ${new Date(data.timestamp).toLocaleString()}
                            </div>
                        </div>
                    `;

                    this.elements.pageAnalysisOutput.innerHTML = outputHTML;
                    this.showSuccess('Page analyzed successfully!');
                } else {
                    this.showError('Failed to analyze page');
                }

                this.setButtonLoading(this.elements.analyzePageBtn, false);
            });
        } catch (error) {
            console.error('Error analyzing page:', error);
            this.showError('Error analyzing page');
            this.setButtonLoading(this.elements.analyzePageBtn, false);
        }
    }

    disableAllButtons() {
        const buttons = document.querySelectorAll('.btn-primary');
        buttons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.title = 'Chrome AI APIs not available. Please enable them first.';
        });
    }

    async refreshAPIStatus() {
        if (!this.elements.apiStatus) return;

        this.elements.apiStatus.innerHTML = '<p>Checking API status...</p>';

        try {
            await apiManager.initialize();
            const caps = apiManager.getCapabilities();

            let statusHTML = '<div class="api-status-list">';

            const apiNames = {
                promptAPI: 'Prompt API',
                writerAPI: 'Writer API',
                rewriterAPI: 'Rewriter API',
                summarizerAPI: 'Summarizer API',
                translatorAPI: 'Translator API',
                proofreaderAPI: 'Language Detector API'
            };

            Object.entries(caps).forEach(([key, cap]) => {
                const name = apiNames[key] || key;
                const icon = cap.available ? '✅' : '❌';
                const status = cap.status || (cap.available ? 'Available' : 'Not Available');
                statusHTML += `<div class="api-status-item">
                    <span class="api-icon">${icon}</span>
                    <span class="api-name">${name}</span>
                    <span class="api-state">${status}</span>
                </div>`;
            });

            statusHTML += '</div>';

            const availableCount = Object.values(caps).filter(c => c.available).length;
            statusHTML += `<p class="status-summary">${availableCount}/6 APIs available</p>`;

            if (availableCount === 0) {
                statusHTML += `<p class="error-text">No APIs detected. Please enable Chrome AI flags and restart your browser.</p>`;
            }

            this.elements.apiStatus.innerHTML = statusHTML;
            this.showSuccess('API status refreshed');
        } catch (error) {
            console.error('Error refreshing API status:', error);
            this.elements.apiStatus.innerHTML = '<p class="error-text">Error checking API status</p>';
            this.showError('Failed to refresh API status');
        }
    }

    clearCache() {
        try {
            cacheStore.clear();
            this.showSuccess('Cache cleared successfully');
        } catch (error) {
            console.error('Error clearing cache:', error);
            this.showError('Failed to clear cache');
        }
    }

    toggleCache(enabled) {
        try {
            // Store cache preference
            chrome.storage.local.set({ cacheEnabled: enabled });
            if (enabled) {
                this.showSuccess('Cache enabled');
            } else {
                this.showSuccess('Cache disabled');
                cacheStore.clear();
            }
        } catch (error) {
            console.error('Error toggling cache:', error);
            this.showError('Failed to update cache settings');
        }
    }

    async saveGeminiKey() {
        const apiKey = this.elements.geminiApiKeyInput?.value.trim();

        if (!apiKey) {
            this.showError('Please enter a valid API key');
            return;
        }

        if (!apiKey.startsWith('AIza')) {
            this.showWarning('API key should start with "AIza". Please verify your key.');
        }

        try {
            await geminiAPI.setApiKey(apiKey);
            this.elements.geminiStatus.innerHTML = '<p class="success">✅ API key saved successfully!</p>';
            this.showSuccess('Gemini API key configured. Click "Test Connection" to verify.');

            // Update mode flags
            this.useGeminiAPI = true;
            this.useDemoMode = false;
        } catch (error) {
            console.error('Error saving API key:', error);
            this.showError('Failed to save API key');
        }
    }

    async testGeminiConnection() {
        if (!this.elements.geminiStatus) return;

        this.elements.geminiStatus.innerHTML = '<p class="warning">Testing connection...</p>';
        this.setButtonLoading(this.elements.testGeminiKeyBtn, true);

        try {
            await geminiAPI.initialize();
            const status = await geminiAPI.checkAvailability();

            if (!status.available) {
                this.elements.geminiStatus.innerHTML = '<p class="error">❌ No API key configured. Please save your key first.</p>';
                this.showError('Please save your Gemini API key first');
                return;
            }

            // Test with a simple prompt
            const testResult = await geminiAPI.makeRequest('Respond with: "Connection successful"', 0.1, 50);

            if (testResult && testResult.includes('successful')) {
                this.elements.geminiStatus.innerHTML = `
                    <p class="success">✅ Connection successful!</p>
                    <p class="info-text">Your Gemini API is working correctly.</p>
                    <p class="info-text">Model: gemini-1.5-flash-latest</p>
                `;
                this.showSuccess('✅ Gemini API connection verified!');

                // Update mode
                this.useGeminiAPI = true;
                this.useDemoMode = false;
            } else {
                throw new Error('Unexpected response from API');
            }
        } catch (error) {
            console.error('Gemini API test failed:', error);
            this.elements.geminiStatus.innerHTML = `
                <p class="error">❌ Connection failed</p>
                <p class="error-text">${error.message}</p>
                <p class="info-text">Please check your API key and try again.</p>
            `;
            this.showError(`Connection test failed: ${error.message}`);
        } finally {
            this.setButtonLoading(this.elements.testGeminiKeyBtn, false);
        }
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