/**
 * FERPA Checker - Detects sensitive student information to ensure FERPA compliance
 * FERPA (Family Educational Rights and Privacy Act) protects student education records
 */

class FerpaChecker {
    constructor() {
        // Patterns for detecting PII (Personally Identifiable Information)
        this.patterns = {
            // Social Security Numbers
            ssn: /\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b/,

            // Student ID patterns (common formats)
            studentId: /\b(?:student\s*(?:id|number|#)|id\s*(?:number|#)?)[:\s]*[A-Z0-9]{6,12}\b/i,

            // Email addresses
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,

            // Phone numbers
            phone: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/,

            // Dates of birth (various formats)
            dob: /\b(?:dob|date\s*of\s*birth|birthday|born)[:\s]*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/i,

            // Addresses (simplified pattern)
            address: /\b\d{1,5}\s+[\w\s]{1,30}(?:street|st|avenue|ave|road|rd|highway|hwy|square|sq|trail|trl|drive|dr|court|ct|parkway|pkwy|circle|cir|boulevard|blvd)\b/i,

            // Grade/GPA with student name context
            gradeWithName: /\b(?:grade|gpa|score)[:\s]*[A-F0-4]\.[0-9]{1,2}\b/i,

            // Medical/disability information indicators
            medicalInfo: /\b(?:disability|iep|504\s*plan|adhd|autism|medical\s*condition|diagnosis|prescribed|medication)\b/i,

            // Financial information
            financialInfo: /\b(?:income|salary|financial\s*aid|loan|scholarship\s*amount|ssn|social\s*security)\b/i,
        };

        // Sensitive keywords that might indicate FERPA-protected information
        this.sensitiveKeywords = [
            'social security',
            'student id',
            'date of birth',
            'home address',
            'phone number',
            'parent name',
            'guardian name',
            'disability',
            'medical condition',
            'disciplinary action',
            'suspension',
            'expulsion',
        ];
    }

    /**
     * Verify if content complies with FERPA regulations
     * @param {string} content - The content to check
     * @returns {Object} - { compliant: boolean, violations: Array, score: number }
     */
    verifyCompliance(content) {
        if (!content || typeof content !== 'string') {
            return { compliant: true, violations: [], score: 100 };
        }

        const violations = [];
        const contentLower = content.toLowerCase();

        // Check against patterns
        for (const [type, pattern] of Object.entries(this.patterns)) {
            if (pattern.test(content)) {
                violations.push({
                    type,
                    severity: this._getSeverity(type),
                    message: this._getViolationMessage(type),
                });
            }
        }

        // Check for sensitive keywords
        for (const keyword of this.sensitiveKeywords) {
            if (contentLower.includes(keyword)) {
                violations.push({
                    type: 'sensitive_keyword',
                    keyword,
                    severity: 'warning',
                    message: `Contains potentially sensitive keyword: "${keyword}"`,
                });
            }
        }

        // Calculate compliance score (0-100)
        const score = this._calculateComplianceScore(violations);

        return {
            compliant: violations.length === 0 || score >= 80,
            violations,
            score,
            timestamp: Date.now(),
        };
    }

    /**
     * Sanitize content by removing or redacting sensitive information
     * @param {string} content - The content to sanitize
     * @returns {string} - Sanitized content
     */
    sanitize(content) {
        let sanitized = content;

        // Redact SSNs
        sanitized = sanitized.replace(this.patterns.ssn, '[REDACTED-SSN]');

        // Redact emails
        sanitized = sanitized.replace(this.patterns.email, '[REDACTED-EMAIL]');

        // Redact phone numbers
        sanitized = sanitized.replace(this.patterns.phone, '[REDACTED-PHONE]');

        // Redact student IDs
        sanitized = sanitized.replace(this.patterns.studentId, '[REDACTED-ID]');

        return sanitized;
    }

    /**
     * Get severity level for violation type
     * @private
     */
    _getSeverity(type) {
        const criticalTypes = ['ssn', 'studentId', 'dob', 'medicalInfo', 'financialInfo'];
        const warningTypes = ['email', 'phone', 'address'];

        if (criticalTypes.includes(type)) return 'critical';
        if (warningTypes.includes(type)) return 'warning';
        return 'info';
    }

    /**
     * Get human-readable message for violation
     * @private
     */
    _getViolationMessage(type) {
        const messages = {
            ssn: 'Social Security Number detected - this is highly sensitive PII',
            studentId: 'Student ID number detected - this identifies individual students',
            email: 'Email address detected - consider removing if it identifies a student',
            phone: 'Phone number detected - this is personal contact information',
            dob: 'Date of birth detected - this is protected student information',
            address: 'Physical address detected - this is personal location information',
            gradeWithName: 'Grade information that may identify a student detected',
            medicalInfo: 'Medical or disability information detected - this is highly protected',
            financialInfo: 'Financial information detected - this is protected under FERPA',
        };

        return messages[type] || 'Potentially sensitive information detected';
    }

    /**
     * Calculate compliance score based on violations
     * @private
     */
    _calculateComplianceScore(violations) {
        if (violations.length === 0) return 100;

        let deductions = 0;
        for (const violation of violations) {
            switch (violation.severity) {
                case 'critical':
                    deductions += 30;
                    break;
                case 'warning':
                    deductions += 15;
                    break;
                case 'info':
                    deductions += 5;
                    break;
            }
        }

        return Math.max(0, 100 - deductions);
    }

    /**
     * Get statistics about the check
     */
    getStats(violations) {
        const stats = {
            total: violations.length,
            bySeverity: {
                critical: 0,
                warning: 0,
                info: 0,
            },
            byType: {},
        };

        for (const violation of violations) {
            stats.bySeverity[violation.severity]++;
            stats.byType[violation.type] = (stats.byType[violation.type] || 0) + 1;
        }

        return stats;
    }
}

export default new FerpaChecker();
