/**
 * Jest test setup file
 * Configures global test environment for Chrome extension
 */

// Mock Chrome API
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    getManifest: jest.fn(() => ({ version: '1.0.0' })),
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
  },
  ai: {
    languageModel: {
      capabilities: jest.fn(),
      create: jest.fn(),
    },
  },
};

// Mock window.ai (Chrome's built-in AI API)
global.window = global.window || {};
global.window.ai = {
  languageModel: {
    capabilities: jest.fn(),
    create: jest.fn(),
  },
  writer: {
    capabilities: jest.fn(),
    create: jest.fn(),
  },
  rewriter: {
    capabilities: jest.fn(),
    create: jest.fn(),
  },
  proofreader: {
    capabilities: jest.fn(),
    create: jest.fn(),
  },
  summarizer: {
    capabilities: jest.fn(),
    create: jest.fn(),
  },
  translator: {
    capabilities: jest.fn(),
    create: jest.fn(),
  },
};

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
