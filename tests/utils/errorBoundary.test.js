/**
 * Tests for ErrorBoundary utility
 */

describe('ErrorBoundary', () => {
  let errorBoundary;

  beforeEach(() => {
    // Clear module cache to get fresh instance
    jest.resetModules();
    errorBoundary = require('../../src/utils/errorBoundary.js').default;
    errorBoundary.clearErrors();
  });

  describe('captureError', () => {
    it('should capture error with message and stack', () => {
      const error = new Error('Test error');
      const errorInfo = errorBoundary.captureError('test-error', error);

      expect(errorInfo).toMatchObject({
        type: 'test-error',
        message: 'Test error',
        stack: expect.any(String),
        timestamp: expect.any(String),
      });
    });

    it('should handle non-Error objects', () => {
      const errorInfo = errorBoundary.captureError('string-error', 'Simple error string');

      expect(errorInfo).toMatchObject({
        type: 'string-error',
        message: 'Simple error string',
        stack: '',
      });
    });

    it('should store errors in array', () => {
      errorBoundary.captureError('error-1', new Error('First'));
      errorBoundary.captureError('error-2', new Error('Second'));

      const errors = errorBoundary.getErrors();
      expect(errors).toHaveLength(2);
      expect(errors[0].message).toBe('First');
      expect(errors[1].message).toBe('Second');
    });

    it('should keep only last 10 errors', () => {
      // Add 15 errors
      for (let i = 0; i < 15; i++) {
        errorBoundary.captureError('test', new Error(`Error ${i}`));
      }

      const errors = errorBoundary.getErrors();
      expect(errors).toHaveLength(10);
      expect(errors[0].message).toBe('Error 5'); // First 5 should be removed
      expect(errors[9].message).toBe('Error 14');
    });
  });

  describe('getErrors', () => {
    it('should return empty array initially', () => {
      const errors = errorBoundary.getErrors();
      expect(errors).toEqual([]);
    });

    it('should return all captured errors', () => {
      errorBoundary.captureError('error-1', new Error('First'));
      errorBoundary.captureError('error-2', new Error('Second'));

      const errors = errorBoundary.getErrors();
      expect(errors).toHaveLength(2);
    });
  });

  describe('clearErrors', () => {
    it('should clear all errors', () => {
      errorBoundary.captureError('error-1', new Error('First'));
      errorBoundary.captureError('error-2', new Error('Second'));

      errorBoundary.clearErrors();

      const errors = errorBoundary.getErrors();
      expect(errors).toEqual([]);
    });
  });
});
