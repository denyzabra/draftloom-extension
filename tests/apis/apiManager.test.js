/**
 * Tests for APIManager
 */

// Mock the API modules
jest.mock('../../src/apis/promptAPI.js', () => ({
  default: { name: 'promptAPI' },
}));
jest.mock('../../src/apis/writerAPI.js', () => ({
  default: { name: 'writerAPI' },
}));
jest.mock('../../src/apis/rewriterAPI.js', () => ({
  default: { name: 'rewriterAPI' },
}));
jest.mock('../../src/apis/proofreaderAPI.js', () => ({
  default: { name: 'proofreaderAPI' },
}));
jest.mock('../../src/apis/summarizerAPI.js', () => ({
  default: { name: 'summarizerAPI' },
}));
jest.mock('../../src/apis/translatorAPI.js', () => ({
  default: { name: 'translatorAPI' },
}));
jest.mock('../../src/apis/capabilities.js', () => ({
  checkAICapabilities: jest.fn(),
}));

describe('APIManager', () => {
  let apiManager;
  let checkAICapabilities;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    checkAICapabilities = require('../../src/apis/capabilities.js').checkAICapabilities;
    apiManager = require('../../src/apis/apiManager.js').default;

    // Reset the apiManager state
    apiManager.capabilities = null;
    apiManager.requestQueue = [];
    apiManager.isProcessing = false;
  });

  describe('initialize', () => {
    it('should initialize and fetch capabilities', async () => {
      const mockCapabilities = {
        promptAPI: { available: true },
        writerAPI: { available: true },
        proofreaderAPI: { available: true },
      };

      checkAICapabilities.mockResolvedValue(mockCapabilities);

      const result = await apiManager.initialize();

      expect(checkAICapabilities).toHaveBeenCalled();
      expect(result).toEqual(mockCapabilities);
      expect(apiManager.capabilities).toEqual(mockCapabilities);
    });

    it('should throw error if initialization fails', async () => {
      const error = new Error('Initialization failed');
      checkAICapabilities.mockRejectedValue(error);

      await expect(apiManager.initialize()).rejects.toThrow('Initialization failed');
    });
  });

  describe('isCriticalReady', () => {
    it('should return true when critical APIs are ready', () => {
      apiManager.capabilities = {
        promptAPI: { available: true },
        writerAPI: { available: true },
        proofreaderAPI: { available: true },
      };

      expect(apiManager.isCriticalReady()).toBe(true);
    });

    it('should return false when capabilities are null', () => {
      apiManager.capabilities = null;
      expect(apiManager.isCriticalReady()).toBe(false);
    });

    it('should return false when promptAPI is not available', () => {
      apiManager.capabilities = {
        promptAPI: { available: false },
        writerAPI: { available: true },
        proofreaderAPI: { available: true },
      };

      expect(apiManager.isCriticalReady()).toBe(false);
    });

    it('should return false when any critical API is missing', () => {
      apiManager.capabilities = {
        promptAPI: { available: true },
        writerAPI: { available: true },
        // proofreaderAPI missing
      };

      expect(apiManager.isCriticalReady()).toBe(false);
    });
  });

  describe('getCapabilities', () => {
    it('should return stored capabilities', () => {
      const mockCapabilities = {
        promptAPI: { available: true },
      };

      apiManager.capabilities = mockCapabilities;

      expect(apiManager.getCapabilities()).toEqual(mockCapabilities);
    });

    it('should return null if not initialized', () => {
      expect(apiManager.getCapabilities()).toBeNull();
    });
  });

  describe('queueRequest', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should queue and execute API requests', async () => {
      const mockMethod = jest.fn().mockResolvedValue('result');
      apiManager.apis.prompt = { testMethod: mockMethod };

      const promise = apiManager.queueRequest('prompt', 'testMethod', 'arg1', 'arg2');

      // Let the queue process
      await jest.runAllTimersAsync();

      const result = await promise;

      expect(mockMethod).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result).toBe('result');
    });

    it('should throw error for non-existent API', async () => {
      const promise = apiManager.queueRequest('nonexistent', 'method');

      // Run timers and wait for promise rejection
      const [, rejection] = await Promise.allSettled([
        jest.runAllTimersAsync(),
        promise
      ]);

      expect(rejection.status).toBe('rejected');
      expect(rejection.reason.message).toBe('API not found: nonexistent');
    });

    it('should throw error for non-existent method', async () => {
      apiManager.apis.prompt = {};

      const promise = apiManager.queueRequest('prompt', 'nonexistent');

      // Run timers and wait for promise rejection
      const [, rejection] = await Promise.allSettled([
        jest.runAllTimersAsync(),
        promise
      ]);

      expect(rejection.status).toBe('rejected');
      expect(rejection.reason.message).toBe('Method not found: nonexistent');
    });

    it('should process requests sequentially with delay', async () => {
      const mockMethod = jest.fn()
        .mockResolvedValueOnce('result1')
        .mockResolvedValueOnce('result2');

      apiManager.apis.prompt = { testMethod: mockMethod };

      const promise1 = apiManager.queueRequest('prompt', 'testMethod');
      const promise2 = apiManager.queueRequest('prompt', 'testMethod');

      await jest.runAllTimersAsync();

      const results = await Promise.all([promise1, promise2]);

      expect(results).toEqual(['result1', 'result2']);
      expect(mockMethod).toHaveBeenCalledTimes(2);
    });
  });

  describe('cleanup', () => {
    it('should call destroy on all APIs that have it', async () => {
      const mockDestroy1 = jest.fn().mockResolvedValue(undefined);
      const mockDestroy2 = jest.fn().mockResolvedValue(undefined);

      apiManager.apis = {
        api1: { destroy: mockDestroy1 },
        api2: { destroy: mockDestroy2 },
        api3: {}, // No destroy method
      };

      await apiManager.cleanup();

      expect(mockDestroy1).toHaveBeenCalled();
      expect(mockDestroy2).toHaveBeenCalled();
    });

    it('should continue cleanup even if one API fails', async () => {
      const mockDestroy1 = jest.fn().mockRejectedValue(new Error('Cleanup failed'));
      const mockDestroy2 = jest.fn().mockResolvedValue(undefined);

      apiManager.apis = {
        api1: { destroy: mockDestroy1 },
        api2: { destroy: mockDestroy2 },
      };

      await apiManager.cleanup();

      expect(mockDestroy1).toHaveBeenCalled();
      expect(mockDestroy2).toHaveBeenCalled();
    });
  });
});
