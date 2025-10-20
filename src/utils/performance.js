/**
 * performance monitoring & optimization
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {};
    }

    startMeasure(label) {
        performance.mark(`${label}-start`);
    }

    endMeasure(label) {
        performance.mark(`${label}-end`);
        
        try {
            performance.measure(label, `${label}-start`, `${label}-end`);
            const measure = performance.getEntriesByName(label)[0];
            this.metrics[label] = measure.duration;
            console.log(`  ${label}: ${measure.duration.toFixed(2)}ms`);
        } catch (error) {
            console.warn('Performance measurement error:', error);
        }
    }

    getMetrics() {
        return this.metrics;
    }

    clearMetrics() {
        this.metrics = {};
        performance.clearMarks();
        performance.clearMeasures();
    }
}

export default new PerformanceMonitor();