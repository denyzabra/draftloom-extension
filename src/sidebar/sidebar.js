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
import demoAPI from '../apis/demoAPI.js';

class SidebarController {
    constructor() {
        this.elements = {};
        this.currentSession = null;
        this.currentDraft = null;
        this.isProcessing = false;
        this.useDemoMode = false;
        this.sampleContent = this.getSampleContent();
        this.init();
    }

    getSampleContent() {
        return {
            prompts: {
                'social-media': 'Write a 1000-word argumentative essay analyzing the impact of social media on teenage mental health. Your essay should include at least three peer-reviewed sources, discuss both positive and negative effects, and propose evidence-based solutions for healthier social media use among adolescents.',
                'climate-change': 'Compose a research paper examining the effectiveness of renewable energy policies in reducing carbon emissions. Your analysis should compare at least three different countries, evaluate policy implementation challenges, and provide recommendations for future climate action.',
                'book-analysis': 'Write a literary analysis essay on the theme of injustice in "To Kill a Mockingbird" by Harper Lee. Discuss how the author uses symbolism, character development, and plot structure to convey her message about racial inequality in the American South.',
                'lab-report': 'Write a formal lab report on the effect of pH levels on enzyme activity. Include an introduction with hypothesis, materials and methods, results with data tables, discussion of findings, and conclusion with potential sources of error.'
            },
            draftIdeas: {
                'essay-outline': 'Topic: The Role of Artificial Intelligence in Education\n\nThesis: While AI can enhance personalized learning, educators must maintain their central role in developing critical thinking and emotional intelligence in students.\n\nMain Points:\n1. AI benefits: Personalized learning paths, instant feedback, accessibility\n2. Limitations: Lack of emotional understanding, potential bias, privacy concerns\n3. Teacher role: Facilitating discussions, developing creativity, building relationships\n4. Balanced approach: Combining AI tools with human instruction',
                'quick-notes': 'AI in education - personalized learning good but need teachers for critical thinking - examples of AI tutors - concerns about data privacy - conclusion: use AI as tool not replacement'
            },
            rewriteSamples: {
                'casual-text': 'Social media is really bad for teens mental health because they compare themselves to others all the time and it makes them feel sad and anxious. Also they spend way too much time on their phones instead of doing other stuff.'
            },
            proofreadSamples: {
                'errors': 'Their are many benifits to studying abroad. Firstly, it helps students to develope independence and adaptibility. Secondly, they gets exposure to different cultures and perpectives. Finally, it improves there language skills and comunication abilitys.'
            }
        };
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

            if (availableCount === 0 && !bridgeStatus.available) {
                // No Chrome AI available - use Demo Mode
                this.useDemoMode = true;
                this.updateStatusBanner('demo', 'Demo Mode Active', 'Chrome AI not available - simulated responses for testing');
                this.showWarning(`⚙️ Chrome Built-in AI Not Available

Chrome Built-in AI is not detected on this browser.

🎯 Currently using Demo Mode (simulated responses)
✅ All features functional
✅ FERPA compliance enabled
🔒 100% on-device processing (when Chrome AI is available)

💡 To enable Chrome AI:
1. Use Chrome 128+ (Canary/Dev recommended)
2. Enable required flags at chrome://flags
3. Restart browser

Demo Mode lets you test the UI and features!`);
            } else if (bridgeStatus.available) {
                this.useDemoMode = false;
                this.updateStatusBanner('active', 'Chrome AI Active', '100% On-Device • FERPA Protected');
                this.showSuccess(`✅ AI Features Ready via Chrome Built-in AI!

🔒 100% On-Device Processing
All student data stays private in your browser.

Navigate to any webpage to use AI features.`);
            } else if (!apiManager.isCriticalReady()) {
                // Partial availability - use demo mode for missing features
                this.useDemoMode = true;
                this.updateStatusBanner('demo', `Partial AI (${availableCount}/6 APIs)`, 'Some features using Demo Mode');
                this.showWarning(`⚠️ Partial Chrome AI Availability

${availableCount}/6 Chrome AI APIs detected.
Missing features will use Demo Mode.

🔒 Available features use 100% on-device processing`);
            } else {
                this.useDemoMode = false;
                this.updateStatusBanner('active', 'All AI Features Ready', `${availableCount}/6 APIs • 100% On-Device`);
                this.showSuccess(`✅ All AI Features Ready!

${availableCount}/6 Chrome AI APIs available
🔒 100% On-Device Processing - Student data never leaves your browser`);
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
            enableCacheCheckbox: document.getElementById('enable-cache'),
            clearCacheBtn: document.getElementById('clear-cache'),

            // AI Status Banner
            statusBanner: document.getElementById('ai-status-banner'),
            statusTitle: document.getElementById('status-title'),
            statusSubtitle: document.getElementById('status-subtitle'),
            statusActionBtn: document.getElementById('status-action-btn'),

            // Privacy/FERPA Protection
            privacyAlertContainer: document.getElementById('privacy-alert-container'),
            privacyTestInput: document.getElementById('privacy-test-input'),
            checkPrivacyBtn: document.getElementById('check-privacy-btn'),
            privacyTestResult: document.getElementById('privacy-test-result'),
            loadPiiSampleBtn: document.getElementById('load-pii-sample'),
        };
    }

    updateStatusBanner(status, title, subtitle, showActionBtn = false) {
        if (!this.elements.statusBanner) return;

        // Remove all status classes
        this.elements.statusBanner.classList.remove('status-active', 'status-demo', 'status-error');

        // Add appropriate status class
        if (status === 'active') {
            this.elements.statusBanner.classList.add('status-active');
        } else if (status === 'demo') {
            this.elements.statusBanner.classList.add('status-demo');
        } else if (status === 'error') {
            this.elements.statusBanner.classList.add('status-error');
        }

        // Update text
        if (this.elements.statusTitle) {
            this.elements.statusTitle.textContent = title;
        }
        if (this.elements.statusSubtitle) {
            this.elements.statusSubtitle.textContent = subtitle;
        }

        // Show/hide action button
        if (this.elements.statusActionBtn) {
            this.elements.statusActionBtn.style.display = showActionBtn ? 'block' : 'none';
        }
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
        this.elements.clearCacheBtn?.addEventListener('click', () => this.clearCache());
        this.elements.enableCacheCheckbox?.addEventListener('change', (e) => {
            this.toggleCache(e.target.checked);
        });

        // Status banner action button
        this.elements.statusActionBtn?.addEventListener('click', () => {
            // Open welcome/setup guide
            chrome.tabs.create({
                url: chrome.runtime.getURL('welcome.html')
            });
        });

        // Sample content buttons
        document.querySelectorAll('.load-sample').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sampleKey = e.target.dataset.sample;
                if (this.sampleContent.prompts[sampleKey] && this.elements.promptInput) {
                    this.elements.promptInput.value = this.sampleContent.prompts[sampleKey];
                    this.elements.promptInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        });

        document.querySelectorAll('.load-draft-sample').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sampleKey = e.target.dataset.sample;
                if (this.sampleContent.draftIdeas[sampleKey] && this.elements.draftInput) {
                    this.elements.draftInput.value = this.sampleContent.draftIdeas[sampleKey];
                    this.elements.draftInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        });

        document.querySelectorAll('.load-rewrite-sample').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sampleKey = e.target.dataset.sample;
                if (this.sampleContent.rewriteSamples[sampleKey] && this.elements.rewriteInput) {
                    this.elements.rewriteInput.value = this.sampleContent.rewriteSamples[sampleKey];
                    this.elements.rewriteInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        });

        document.querySelectorAll('.load-proofread-sample').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sampleKey = e.target.dataset.sample;
                if (this.sampleContent.proofreadSamples[sampleKey] && this.elements.proofreadInput) {
                    this.elements.proofreadInput.value = this.sampleContent.proofreadSamples[sampleKey];
                    this.elements.proofreadInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        });

        // Privacy Protection Demo
        this.elements.checkPrivacyBtn?.addEventListener('click', () => this.checkPrivacy());
        this.elements.loadPiiSampleBtn?.addEventListener('click', () => this.loadPiiSample());
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

        // Show skeleton loader
        this.showSkeletonLoader(this.elements.promptAnalysis, 'paragraph');

        try {
            // Check cache first
            const cacheKey = cacheStore.getCacheKey('analyzePrompt', { prompt });
            let analysis = cacheStore.get(cacheKey);

            if (!analysis) {
                // Priority: Chrome AI (bridge/direct) → Demo Mode
                if (this.useDemoMode) {
                    console.log('🎯 Using demo mode');
                    analysis = await demoAPI.analyzePrompt(prompt);
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
                            console.warn('Chrome AI failed, using demo mode:', directError);
                            analysis = await demoAPI.analyzePrompt(prompt);
                        }
                    }
                }

                if (analysis.success) {
                    // Cache the result
                    cacheStore.set(cacheKey, analysis);
                }
            }

            if (analysis.success) {
                this.hideSkeletonLoader(this.elements.promptAnalysis, this._formatOutput(analysis.analysis));
                this.showSuccess('Prompt analyzed successfully!');
            } else {
                this.elements.promptAnalysis.innerHTML = '';
                this.showError(`Error: ${analysis.error}`);
            }
        } catch (error) {
            console.error('Analysis error:', error);
            this.elements.promptAnalysis.innerHTML = '';
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

        // Show essay skeleton loader
        this.showSkeletonLoader(this.elements.draftOutput, 'essay');

        try {
            let draft;
            // Priority: Chrome AI → Demo Mode
            if (this.useDemoMode) {
                console.log('🎯 Using demo mode');
                draft = await demoAPI.generateDraft('Student Essay', ideas);
            } else {
                try {
                    draft = await contentScriptBridge.generateDraft('Student Essay', ideas);
                    console.log('✅ Used Chrome Built-in AI (content script)');
                } catch (bridgeError) {
                    try {
                        draft = await writerAPI.generateDraft('Student Essay', ideas, 'academic');
                        console.log('✅ Used Chrome Built-in AI (direct)');
                    } catch (directError) {
                        console.warn('Chrome AI failed, using demo mode:', directError);
                        draft = await demoAPI.generateDraft('Student Essay', ideas);
                    }
                }
            }

            if (draft.success) {
                this.hideSkeletonLoader(this.elements.draftOutput, this._formatOutput(draft.draft));

                // Save draft
                this.currentDraft = await sessionStore.saveDraft({
                    title: 'Generated Draft',
                    content: draft.draft,
                });

                // 🎉 Trigger celebration! (replaces success notification)
                this.celebrate(`🎉 Draft Complete! ${draft.wordCount} words written!`);
            } else {
                this.elements.draftOutput.innerHTML = '';
                this.showError(`Error: ${draft.error}`);
            }
        } catch (error) {
            console.error('Draft generation error:', error);
            this.elements.draftOutput.innerHTML = '';
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

            // Priority: Chrome AI → Demo Mode
            if (this.useDemoMode) {
                console.log('🎯 Using demo mode');
                result = await demoAPI.rewriteText(text, tone);
            } else {
                try {
                    result = await contentScriptBridge.rewriteText(text, tone);
                    console.log('✅ Used Chrome Built-in AI (content script)');
                } catch (bridgeError) {
                    try {
                        if (length !== 'maintain') {
                            result = await rewriterAPI.adjustLength(text, length);
                        } else {
                            result = await rewriterAPI.rewriteWithTone(text, tone);
                        }
                        console.log('✅ Used Chrome Built-in AI (direct)');
                    } catch (directError) {
                        console.warn('Chrome AI failed, using demo mode:', directError);
                        result = await demoAPI.rewriteText(text, tone);
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

            // Priority: Chrome AI → Demo Mode
            if (this.useDemoMode) {
                console.log('🎯 Using demo mode');
                result = await demoAPI.proofread(text);
            } else {
                try {
                    result = await proofreaderAPI.proofread(text);
                    console.log('✅ Used Chrome Built-in AI');
                } catch (error) {
                    console.warn('Chrome AI failed, using demo mode:', error);
                    result = await demoAPI.proofread(text);
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
        // Sanitize text to prevent XSS before inserting into HTML
        return `<div class="formatted-output">${this._escapeHtml(text).replace(/\n/g, '<br>')}</div>`;
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
            button.classList.add('loading');
            button.dataset.originalText = button.textContent;
            this.isProcessing = true;
        } else {
            button.disabled = false;
            button.classList.remove('loading');
            button.textContent = button.dataset.originalText || 'Process';
            delete button.dataset.originalText;
            this.isProcessing = false;
        }
    }

    showSkeletonLoader(element, type = 'paragraph') {
        if (!element) return;

        let skeletonHTML = '';

        if (type === 'paragraph') {
            skeletonHTML = `
                <div class="skeleton-paragraph">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line"></div>
                </div>
            `;
        } else if (type === 'essay') {
            skeletonHTML = `
                <div class="skeleton-essay">
                    <div class="skeleton-essay-title"></div>
                    <div class="skeleton-essay-body">
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line"></div>
                    </div>
                </div>
            `;
        } else if (type === 'loading-message') {
            skeletonHTML = `
                <div class="loading-message">
                    <div class="spinner"></div>
                    <div class="loading-overlay-title">Processing...</div>
                    <div class="loading-overlay-subtitle">This may take a few moments</div>
                    <div class="progress-bar">
                        <div class="progress-bar-indeterminate"></div>
                    </div>
                </div>
            `;
        }

        element.innerHTML = skeletonHTML;
        element.classList.add('animate-fadeIn');
    }

    hideSkeletonLoader(element, content) {
        if (!element) return;

        // Fade out skeleton, fade in content
        element.style.opacity = '0';
        element.style.transition = 'opacity 0.2s ease';

        setTimeout(() => {
            element.innerHTML = content;
            element.style.opacity = '1';
            element.classList.add('animate-fadeIn');
        }, 200);
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

    // ========================================
    // Privacy Protection / FERPA Demo
    // ========================================

    loadPiiSample() {
        const sampleWithPII = `Dear Professor Johnson,

I'm writing to request an extension for my final paper. I've been dealing with some health issues and have attached my medical documentation from Dr. Smith.

My student information:
- Name: Sarah Chen
- Student ID: SC894562
- Email: sarah.chen@university.edu
- Phone: (555) 123-4567
- DOB: 03/15/2003
- Social Security: 123-45-6789

I currently live at 1234 Oak Street, Apartment 5B, and would appreciate if you could send any materials there or to my parent's address.

Thank you for your understanding.
Sarah Chen`;

        if (this.elements.privacyTestInput) {
            this.elements.privacyTestInput.value = sampleWithPII;
            this.elements.privacyTestInput.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Automatically check after loading sample
            setTimeout(() => this.checkPrivacy(), 500);
        }
    }

    checkPrivacy() {
        const text = this.elements.privacyTestInput?.value;

        if (!text || text.trim() === '') {
            this.elements.privacyTestResult.innerHTML = `
                <div class="alert alert-info">
                    <span style="font-size: 20px; margin-right: 8px;">ℹ️</span>
                    <div>
                        <strong>No content to check</strong>
                        <p style="margin-top: 4px; font-size: 14px;">Enter some text or load a sample to test the privacy protection.</p>
                    </div>
                </div>
            `;
            return;
        }

        // Run FERPA compliance check
        const result = ferpaChecker.verifyCompliance(text);
        this.displayPrivacyResult(result);
    }

    displayPrivacyResult(result) {
        const { compliant, violations, score, hasCriticalViolations } = result;

        let alertClass = 'safe';
        let icon = '✅';
        let title = 'Privacy Protected - No PII Detected';
        let message = 'This content is safe to process. No personally identifiable information was found.';

        if (hasCriticalViolations) {
            alertClass = 'critical';
            icon = '🚫';
            title = 'Critical Privacy Risk - PII Detected';
            message = 'This content contains sensitive student information that must be removed before processing.';
        } else if (violations.length > 0) {
            alertClass = 'warning';
            icon = '⚠️';
            title = 'Privacy Warning - Potential PII';
            message = 'Some potentially sensitive information was detected. Review before processing.';
        }

        let scoreClass = 'safe';
        if (score < 70) scoreClass = 'critical';
        else if (score < 90) scoreClass = 'warning';

        let html = `
            <div class="privacy-alert ${alertClass}">
                <div class="privacy-alert-icon">${icon}</div>
                <div class="privacy-alert-content">
                    <div class="privacy-alert-title">${title}</div>
                    <div class="privacy-alert-message">${message}</div>

                    <div class="privacy-score-container">
                        <div class="privacy-score-label">
                            <span>Privacy Score</span>
                            <span style="font-weight: 600;">${score}/100</span>
                        </div>
                        <div class="privacy-score-bar">
                            <div class="privacy-score-fill ${scoreClass}" style="width: ${score}%;"></div>
                        </div>
                    </div>`;

        if (violations.length > 0) {
            const stats = ferpaChecker.getStats(violations);
            html += `
                    <div class="violation-list">
                        <div style="font-size: 12px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase;">
                            ${violations.length} Issue${violations.length > 1 ? 's' : ''} Found
                            ${stats.bySeverity.critical > 0 ? `• ${stats.bySeverity.critical} Critical` : ''}
                            ${stats.bySeverity.warning > 0 ? `• ${stats.bySeverity.warning} Warning${stats.bySeverity.warning > 1 ? 's' : ''}` : ''}
                        </div>`;

            // Show first 5 violations
            violations.slice(0, 5).forEach(v => {
                html += `
                        <div class="violation-item">
                            <span class="violation-badge ${v.severity}">${v.severity}</span>
                            <div style="flex: 1;">${v.message}</div>
                        </div>`;
            });

            if (violations.length > 5) {
                html += `
                        <div style="font-size: 12px; color: var(--dl-text-secondary); margin-top: 8px;">
                            + ${violations.length - 5} more issue${violations.length - 5 > 1 ? 's' : ''}
                        </div>`;
            }

            html += `</div>`;
        }

        html += `
                </div>
            </div>`;

        if (this.elements.privacyTestResult) {
            this.elements.privacyTestResult.innerHTML = html;
            this.elements.privacyTestResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    showPrivacyAlert(result) {
        const { hasCriticalViolations, violations, score } = result;

        if (violations.length === 0) {
            this.hidePrivacyAlert();
            return;
        }

        let alertClass = hasCriticalViolations ? 'critical' : 'warning';
        let icon = hasCriticalViolations ? '🚫' : '⚠️';
        let title = hasCriticalViolations ? 'Cannot Process - PII Detected' : 'Privacy Warning';
        let message = hasCriticalViolations
            ? 'Your content contains sensitive student information. Please remove it before processing.'
            : 'Potentially sensitive information detected. Review and remove if necessary.';

        const html = `
            <div class="privacy-alert ${alertClass}" style="margin: 12px 16px;">
                <div class="privacy-alert-icon">${icon}</div>
                <div class="privacy-alert-content">
                    <div class="privacy-alert-title">${title}</div>
                    <div class="privacy-alert-message">${message} (Score: ${score}/100)</div>
                </div>
            </div>`;

        if (this.elements.privacyAlertContainer) {
            this.elements.privacyAlertContainer.innerHTML = html;
            this.elements.privacyAlertContainer.style.display = 'block';
        }
    }

    hidePrivacyAlert() {
        if (this.elements.privacyAlertContainer) {
            this.elements.privacyAlertContainer.style.display = 'none';
            this.elements.privacyAlertContainer.innerHTML = '';
        }
    }

    // Helper method to verify content before AI processing
    verifyContentPrivacy(content) {
        const result = ferpaChecker.verifyCompliance(content);

        if (result.hasCriticalViolations) {
            this.showPrivacyAlert(result);
            return { allowed: false, result };
        }

        if (result.violations.length > 0) {
            this.showPrivacyAlert(result);
            // Show warning but allow processing
            return { allowed: true, result };
        }

        this.hidePrivacyAlert();
        return { allowed: true, result };
    }

    // ========================================
    // Success Celebration & Confetti
    // ========================================

    celebrate(message = '🎉 Success!') {
        // Create success toast
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.innerHTML = `
            <span class="success-icon-bounce">✨</span>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        // Remove toast after animation
        setTimeout(() => {
            toast.remove();
        }, 4000);

        // Create confetti container
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'success-celebration';
        document.body.appendChild(confettiContainer);

        // Generate 50 confetti pieces
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';

            // Random horizontal position
            confetti.style.left = Math.random() * 100 + '%';

            // Random animation delay
            confetti.style.animationDelay = Math.random() * 0.5 + 's';

            // Random animation duration (2-4 seconds)
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';

            // Random size variation
            const size = Math.random() * 8 + 6; // 6-14px
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';

            confettiContainer.appendChild(confetti);
        }

        // Remove confetti container after animation
        setTimeout(() => {
            confettiContainer.remove();
        }, 5000);

        // Add pulse effect to the output container
        if (this.elements.draftOutput) {
            this.elements.draftOutput.classList.add('success-pulse');
            setTimeout(() => {
                this.elements.draftOutput.classList.remove('success-pulse');
            }, 2000);
        }
    }

}

// Global error handlers to prevent [object Object] errors
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error?.message || event.message || 'Unknown error');
    event.preventDefault(); // Prevent Chrome from logging it
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason?.message || event.reason || 'Unknown rejection');
    event.preventDefault(); // Prevent Chrome from logging it
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            new SidebarController();
        } catch (error) {
            console.error('Failed to initialize sidebar:', error?.message || error);
        }
    });
} else {
    try {
        new SidebarController();
    } catch (error) {
        console.error('Failed to initialize sidebar:', error?.message || error);
    }
}

// Global utility
window.copyToClipboard = function(element) {
    if (element.tagName === 'TEXTAREA') {
        element.select();
        document.execCommand('copy');
        alert('✓ Copied to clipboard!');
    }
};