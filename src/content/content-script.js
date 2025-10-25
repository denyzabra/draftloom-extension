// Content Script for DraftLoom Extension

console.log('DraftLoom content script loaded');

// AI Sessions cache
const aiSessions = {
  promptAPI: null,
  writer: null,
  rewriter: null,
};

// Initialize the content script
function init() {
  console.log('DraftLoom: Initializing content script');

  try {
    // Check if window.ai is available
    if ('ai' in window) {
      console.log('✅ window.ai is available in content script!');
      initializeAISessions();
    } else {
      console.warn('⚠️ window.ai not available in content script');
    }

    // Add event listeners for text input areas (only if querySelectorAll exists)
    if (document.querySelectorAll) {
      const textAreas = document.querySelectorAll('textarea, [contenteditable="true"]');

      if (textAreas && textAreas.length > 0) {
        textAreas.forEach((element) => {
          element.addEventListener('focus', handleTextAreaFocus);
        });
      }
    }
  } catch (error) {
    console.error('DraftLoom init error:', error);
  }
}

// Initialize AI sessions
async function initializeAISessions() {
  try {
    // Check capabilities first
    if (window.ai.languageModel) {
      const caps = await window.ai.languageModel.capabilities();
      console.log('Prompt API capabilities:', caps.available);
    }
  } catch (error) {
    console.error('Error checking AI capabilities:', error);
  }
}

// Handle text area focus
function handleTextAreaFocus(event) {
  console.log('Text area focused:', event.target);
  // Future: Show AI writing assistance UI
}

// Listen for messages from background script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);

  switch (request.type) {
    case 'getSelection':
      sendResponse({ text: window.getSelection().toString() });
      break;

    case 'analyze-page':
      const pageData = analyzePage();
      sendResponse({
        status: 'success',
        data: pageData
      });
      break;

    case 'check-ai-availability':
      checkAIAvailability().then(sendResponse);
      return true; // Async response

    case 'ai-analyze-prompt':
      handleAnalyzePrompt(request.data).then(sendResponse);
      return true; // Async response

    case 'ai-generate-draft':
      handleGenerateDraft(request.data).then(sendResponse);
      return true; // Async response

    case 'ai-rewrite-text':
      handleRewriteText(request.data).then(sendResponse);
      return true; // Async response

    case 'ai-proofread':
      handleProofread(request.data).then(sendResponse);
      return true; // Async response

    default:
      sendResponse({ status: 'error', message: 'Unknown message type' });
  }

  return true;
});

// Analyze page content
function analyzePage() {
  const textContent = document.body.innerText || '';
  const wordCount = textContent.trim().split(/\s+/).length;
  const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent.trim());
  const textAreas = document.querySelectorAll('textarea, [contenteditable="true"]').length;

  return {
    title: document.title,
    url: window.location.href,
    wordCount: wordCount,
    headings: headings.slice(0, 5), // First 5 headings
    hasTextAreas: textAreas > 0,
    textAreasCount: textAreas,
    timestamp: new Date().toISOString()
  };
}

// AI Handler Functions

async function checkAIAvailability() {
  if (!('ai' in window)) {
    return { available: false, message: 'window.ai not available' };
  }

  const capabilities = {};

  try {
    if (window.ai.languageModel) {
      const caps = await window.ai.languageModel.capabilities();
      capabilities.promptAPI = caps.available !== 'no';
    }
    if (window.ai.writer) {
      const caps = await window.ai.writer.capabilities();
      capabilities.writer = caps.available !== 'no';
    }
    if (window.ai.rewriter) {
      const caps = await window.ai.rewriter.capabilities();
      capabilities.rewriter = caps.available !== 'no';
    }

    return {
      available: true,
      capabilities,
      message: 'AI APIs available in content script'
    };
  } catch (error) {
    return { available: false, message: error.message };
  }
}

async function handleAnalyzePrompt(data) {
  try {
    if (!window.ai || !window.ai.languageModel) {
      return { success: false, error: 'Prompt API not available' };
    }

    const session = await window.ai.languageModel.create();
    const prompt = `
You are an experienced educator analyzing a student's assignment prompt.

ASSIGNMENT PROMPT:
"${data.prompt}"

Please provide a structured analysis with:

1. **Main Topic/Question**: What is the core subject?
2. **Key Requirements**: List 3-5 specific requirements mentioned
3. **Essay Structure**: Suggest a clear outline (intro, body sections, conclusion)
4. **Recommended Length**: Estimate appropriate word count
5. **Writing Tips**: 2-3 tips for approaching this essay

Format your response clearly and concisely focus on practical guidance.
    `;

    const result = await session.prompt(prompt);

    return {
      success: true,
      analysis: result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Analyze prompt error:', error);
    return { success: false, error: error.message };
  }
}

async function handleGenerateDraft(data) {
  try {
    if (!window.ai || !window.ai.writer) {
      return { success: false, error: 'Writer API not available' };
    }

    const session = await window.ai.writer.create();
    const prompt = `
Write a well-structured academic essay draft on: "${data.title}"

Follow this outline:
${data.outline}

Requirements:
- Include a clear introduction with thesis statement
- Develop each outline point into a full paragraph
- Include a strong conclusion
- Use formal academic tone
- Maintain coherent flow between paragraphs
- Aim for 500-800 words

Generate the essay now:
    `;

    const result = await session.write(prompt);
    const wordCount = result.split(/\s+/).length;

    return {
      success: true,
      draft: result,
      wordCount: wordCount,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Generate draft error:', error);
    return { success: false, error: error.message };
  }
}

async function handleRewriteText(data) {
  try {
    if (!window.ai || !window.ai.rewriter) {
      return { success: false, error: 'Rewriter API not available' };
    }

    const session = await window.ai.rewriter.create();
    const toneDescriptions = {
      academic: 'formal academic tone with sophisticated vocabulary',
      professional: 'professional business tone that is clear and concise',
      casual: 'friendly, conversational tone'
    };

    const prompt = `
Rewrite the following text in a ${toneDescriptions[data.tone] || toneDescriptions.academic}.

Original text:
"${data.text}"

Requirements:
- Maintain the same meaning
- Keep similar length
- Use ${data.tone} style

Rewritten text:
    `;

    const result = await session.rewrite(prompt);

    return {
      success: true,
      rewritten: result,
      tone: data.tone,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Rewrite error:', error);
    return { success: false, error: error.message };
  }
}

async function handleProofread(data) {
  try {
    // Note: Proofreader API might not be available yet
    // Fallback to using Prompt API for grammar checking
    if (!window.ai || !window.ai.languageModel) {
      return { success: false, error: 'AI not available for proofreading' };
    }

    const session = await window.ai.languageModel.create();
    const prompt = `
Proofread the following text and identify any grammar, spelling, or style issues:

"${data.text}"

For each issue found, provide:
- The error type (grammar, spelling, punctuation, etc.)
- The original text with the error
- A suggested correction
- A brief explanation

Format as a simple list.
    `;

    const result = await session.prompt(prompt);

    return {
      success: true,
      analysis: result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Proofread error:', error);
    return { success: false, error: error.message };
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
