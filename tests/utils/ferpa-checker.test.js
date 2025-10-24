/**
 * FERPA Checker Tests
 * Critical security component - must have comprehensive test coverage
 */

import ferpaChecker from '../../src/utils/ferpa-checker.js';

describe('FerpaChecker - SSN Detection', () => {
    test('should detect SSN with dashes', () => {
        const result = ferpaChecker.verifyCompliance('My SSN is 123-45-6789');
        expect(result.compliant).toBe(false);
        expect(result.hasCriticalViolations).toBe(true);
        // May detect both 'ssn' and 'financialInfo' (keyword match)
        expect(result.violations.length).toBeGreaterThanOrEqual(1);
        expect(result.violations.some(v => v.type === 'ssn')).toBe(true);
        expect(result.violations.find(v => v.type === 'ssn').severity).toBe('critical');
    });

    test('should detect SSN with spaces', () => {
        const result = ferpaChecker.verifyCompliance('Contact info: 123 45 6789');
        expect(result.compliant).toBe(false);
        expect(result.hasCriticalViolations).toBe(true);
    });

    test('should detect SSN with dots', () => {
        const result = ferpaChecker.verifyCompliance('SSN: 123.45.6789');
        expect(result.compliant).toBe(false);
        expect(result.hasCriticalViolations).toBe(true);
    });

    test('should NOT detect regular phone numbers as SSN', () => {
        const result = ferpaChecker.verifyCompliance('Call me at 555-123-4567');
        // This might detect as phone, but not as SSN
        const ssnViolations = result.violations.filter(v => v.type === 'ssn');
        expect(ssnViolations).toHaveLength(0);
    });

    test('should NOT detect dates as SSN', () => {
        const result = ferpaChecker.verifyCompliance('Date: 12-25-2023');
        const ssnViolations = result.violations.filter(v => v.type === 'ssn');
        expect(ssnViolations).toHaveLength(0);
    });
});

describe('FerpaChecker - Email Detection', () => {
    test('should detect email addresses', () => {
        const result = ferpaChecker.verifyCompliance('Contact: student@university.edu');
        expect(result.violations.some(v => v.type === 'email')).toBe(true);
    });

    test('should detect multiple emails', () => {
        const result = ferpaChecker.verifyCompliance(
            'Email: john@test.com or jane@test.org'
        );
        const emailViolations = result.violations.filter(v => v.type === 'email');
        expect(emailViolations.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle complex email formats', () => {
        const result = ferpaChecker.verifyCompliance('Send to: first.last+tag@sub.domain.com');
        expect(result.violations.some(v => v.type === 'email')).toBe(true);
    });
});

describe('FerpaChecker - Phone Number Detection', () => {
    test('should detect phone with dashes', () => {
        const result = ferpaChecker.verifyCompliance('Phone: 555-123-4567');
        expect(result.violations.some(v => v.type === 'phone')).toBe(true);
    });

    test('should detect phone with parentheses', () => {
        const result = ferpaChecker.verifyCompliance('Call: (555) 123-4567');
        expect(result.violations.some(v => v.type === 'phone')).toBe(true);
    });

    test('should detect phone with dots', () => {
        const result = ferpaChecker.verifyCompliance('Phone: 555.123.4567');
        expect(result.violations.some(v => v.type === 'phone')).toBe(true);
    });
});

describe('FerpaChecker - Student ID Detection', () => {
    test('should detect student ID patterns', () => {
        const result = ferpaChecker.verifyCompliance('Student ID: ABC123456');
        expect(result.violations.some(v => v.type === 'studentId')).toBe(true);
    });

    test('should detect student number variants', () => {
        const result = ferpaChecker.verifyCompliance('Student Number: 12345678');
        expect(result.violations.some(v => v.type === 'studentId')).toBe(true);
    });

    test('should detect ID with colon separator', () => {
        const result = ferpaChecker.verifyCompliance('ID: XYZ987654');
        expect(result.violations.some(v => v.type === 'studentId')).toBe(true);
    });
});

describe('FerpaChecker - Date of Birth Detection', () => {
    test('should detect DOB with slash format', () => {
        const result = ferpaChecker.verifyCompliance('DOB: 01/15/1995');
        expect(result.violations.some(v => v.type === 'dob')).toBe(true);
    });

    test('should detect date of birth spelled out', () => {
        const result = ferpaChecker.verifyCompliance('Date of birth: 3-20-2000');
        expect(result.violations.some(v => v.type === 'dob')).toBe(true);
    });

    test('should detect birthday references', () => {
        const result = ferpaChecker.verifyCompliance('Birthday: 12/25/1998');
        expect(result.violations.some(v => v.type === 'dob')).toBe(true);
    });
});

describe('FerpaChecker - Address Detection', () => {
    test('should detect street addresses', () => {
        const result = ferpaChecker.verifyCompliance('Address: 123 Main Street');
        expect(result.violations.some(v => v.type === 'address')).toBe(true);
    });

    test('should detect avenue addresses', () => {
        const result = ferpaChecker.verifyCompliance('Lives at 456 Park Avenue');
        expect(result.violations.some(v => v.type === 'address')).toBe(true);
    });

    test('should detect abbreviated addresses', () => {
        const result = ferpaChecker.verifyCompliance('Address: 789 Oak Dr');
        expect(result.violations.some(v => v.type === 'address')).toBe(true);
    });
});

describe('FerpaChecker - Medical Information Detection', () => {
    test('should detect disability keywords', () => {
        const result = ferpaChecker.verifyCompliance('Student has a disability');
        expect(result.violations.some(v => v.type === 'medicalInfo')).toBe(true);
    });

    test('should detect IEP references', () => {
        const result = ferpaChecker.verifyCompliance('The student has an IEP');
        expect(result.violations.some(v => v.type === 'medicalInfo')).toBe(true);
    });

    test('should detect 504 plan references', () => {
        const result = ferpaChecker.verifyCompliance('Student is on a 504 plan');
        expect(result.violations.some(v => v.type === 'medicalInfo')).toBe(true);
    });

    test('should detect medical condition keywords', () => {
        const result = ferpaChecker.verifyCompliance('Medical condition: ADHD');
        expect(result.violations.some(v => v.type === 'medicalInfo')).toBe(true);
    });
});

describe('FerpaChecker - Financial Information Detection', () => {
    test('should detect financial aid keywords', () => {
        const result = ferpaChecker.verifyCompliance('Received financial aid');
        expect(result.violations.some(v => v.type === 'financialInfo')).toBe(true);
    });

    test('should detect income references', () => {
        const result = ferpaChecker.verifyCompliance('Family income is $50,000');
        expect(result.violations.some(v => v.type === 'financialInfo')).toBe(true);
    });

    test('should detect scholarship amount references', () => {
        const result = ferpaChecker.verifyCompliance('Scholarship amount: $10,000');
        expect(result.violations.some(v => v.type === 'financialInfo')).toBe(true);
    });
});

describe('FerpaChecker - Sensitive Keywords', () => {
    test('should detect social security keywords', () => {
        const result = ferpaChecker.verifyCompliance('Need your social security number');
        expect(result.violations.some(v => v.keyword === 'social security')).toBe(true);
    });

    test('should detect parent name keywords', () => {
        const result = ferpaChecker.verifyCompliance('Parent name: John Doe');
        expect(result.violations.some(v => v.keyword === 'parent name')).toBe(true);
    });

    test('should detect disciplinary action keywords', () => {
        const result = ferpaChecker.verifyCompliance('Student had a disciplinary action');
        expect(result.violations.some(v => v.keyword === 'disciplinary action')).toBe(true);
    });
});

describe('FerpaChecker - Compliance Logic', () => {
    test('should pass for clean content', () => {
        const result = ferpaChecker.verifyCompliance('Write an essay about climate change');
        expect(result.compliant).toBe(true);
        expect(result.violations).toHaveLength(0);
        expect(result.score).toBe(100);
    });

    test('should fail with critical violations', () => {
        const result = ferpaChecker.verifyCompliance('SSN: 123-45-6789, Student ID: ABC123456');
        expect(result.compliant).toBe(false);
        expect(result.hasCriticalViolations).toBe(true);
    });

    test('should require score >= 90 without critical violations', () => {
        // Email (15 points) = 85 score, should pass without critical
        const result = ferpaChecker.verifyCompliance('Contact: test@example.com');
        const hasCritical = result.violations.some(v => v.severity === 'critical');

        if (!hasCritical && result.score >= 90) {
            expect(result.compliant).toBe(true);
        } else {
            expect(result.compliant).toBe(false);
        }
    });

    test('should calculate correct compliance score', () => {
        const result = ferpaChecker.verifyCompliance('SSN: 123-45-6789');
        // Critical violation = 30 points deduction = score of 70
        expect(result.score).toBeLessThanOrEqual(70);
    });

    test('should include timestamp', () => {
        const result = ferpaChecker.verifyCompliance('Test content');
        expect(result.timestamp).toBeDefined();
        expect(typeof result.timestamp).toBe('number');
    });
});

describe('FerpaChecker - Sanitization', () => {
    test('should redact SSN', () => {
        const sanitized = ferpaChecker.sanitize('My SSN is 123-45-6789');
        expect(sanitized).toContain('[REDACTED-SSN]');
        expect(sanitized).not.toContain('123-45-6789');
    });

    test('should redact email', () => {
        const sanitized = ferpaChecker.sanitize('Email: student@university.edu');
        expect(sanitized).toContain('[REDACTED-EMAIL]');
        expect(sanitized).not.toContain('student@university.edu');
    });

    test('should redact phone', () => {
        const sanitized = ferpaChecker.sanitize('Phone: 555-123-4567');
        expect(sanitized).toContain('[REDACTED-PHONE]');
        expect(sanitized).not.toContain('555-123-4567');
    });

    test('should redact student ID', () => {
        const sanitized = ferpaChecker.sanitize('Student ID: ABC123456');
        expect(sanitized).toContain('[REDACTED-ID]');
        expect(sanitized).not.toContain('ABC123456');
    });

    test('should preserve non-sensitive content', () => {
        const content = 'Write an essay about education';
        const sanitized = ferpaChecker.sanitize(content);
        expect(sanitized).toBe(content);
    });

    test('should handle multiple redactions', () => {
        const sanitized = ferpaChecker.sanitize(
            'SSN: 123-45-6789, Email: test@test.com, Phone: 555-123-4567'
        );
        expect(sanitized).toContain('[REDACTED-SSN]');
        expect(sanitized).toContain('[REDACTED-EMAIL]');
        expect(sanitized).toContain('[REDACTED-PHONE]');
    });
});

describe('FerpaChecker - Statistics', () => {
    test('should provide violation statistics', () => {
        const result = ferpaChecker.verifyCompliance(
            'SSN: 123-45-6789, Email: test@test.com, Phone: 555-1234'
        );
        const stats = ferpaChecker.getStats(result.violations);

        expect(stats.total).toBeGreaterThan(0);
        expect(stats.bySeverity).toBeDefined();
        expect(stats.byType).toBeDefined();
    });

    test('should count critical violations', () => {
        const result = ferpaChecker.verifyCompliance('SSN: 123-45-6789');
        const stats = ferpaChecker.getStats(result.violations);

        expect(stats.bySeverity.critical).toBeGreaterThan(0);
    });

    test('should count warning violations', () => {
        const result = ferpaChecker.verifyCompliance('Email: test@test.com');
        const stats = ferpaChecker.getStats(result.violations);

        expect(stats.bySeverity.warning).toBeGreaterThan(0);
    });
});

describe('FerpaChecker - Edge Cases', () => {
    test('should handle empty string', () => {
        const result = ferpaChecker.verifyCompliance('');
        expect(result.compliant).toBe(true);
        expect(result.violations).toHaveLength(0);
    });

    test('should handle null input', () => {
        const result = ferpaChecker.verifyCompliance(null);
        expect(result.compliant).toBe(true);
        expect(result.violations).toHaveLength(0);
    });

    test('should handle undefined input', () => {
        const result = ferpaChecker.verifyCompliance(undefined);
        expect(result.compliant).toBe(true);
        expect(result.violations).toHaveLength(0);
    });

    test('should handle non-string input', () => {
        const result = ferpaChecker.verifyCompliance(12345);
        expect(result.compliant).toBe(true);
        expect(result.violations).toHaveLength(0);
    });

    test('should handle very long text', () => {
        const longText = 'This is a test. '.repeat(10000);
        const result = ferpaChecker.verifyCompliance(longText);
        expect(result).toBeDefined();
        expect(result.compliant).toBe(true);
    });

    test('should handle special characters', () => {
        const result = ferpaChecker.verifyCompliance('Test!@#$%^&*(){}[]|\\:;"<>?,./');
        expect(result).toBeDefined();
    });

    test('should handle unicode characters', () => {
        const result = ferpaChecker.verifyCompliance('Test 你好 мир 🎓');
        expect(result).toBeDefined();
    });
});

describe('FerpaChecker - Real-World Scenarios', () => {
    test('should pass for typical essay prompt', () => {
        const prompt = `Analyze the impact of climate change on coastal ecosystems.
        Include at least three specific examples and cite your sources.`;
        const result = ferpaChecker.verifyCompliance(prompt);
        expect(result.compliant).toBe(true);
    });

    test('should fail for prompt with student info', () => {
        const prompt = `Write about your experience. My name is John Doe,
        Student ID: ABC123456, Email: john.doe@university.edu`;
        const result = ferpaChecker.verifyCompliance(prompt);
        expect(result.compliant).toBe(false);
    });

    test('should flag medical disclosure', () => {
        const text = `I need extra time due to my ADHD diagnosis and 504 plan`;
        const result = ferpaChecker.verifyCompliance(text);
        expect(result.compliant).toBe(false);
        expect(result.violations.some(v => v.type === 'medicalInfo')).toBe(true);
    });

    test('should flag financial disclosure', () => {
        const text = `My family income is low, so I received financial aid`;
        const result = ferpaChecker.verifyCompliance(text);
        expect(result.compliant).toBe(false);
    });
});
