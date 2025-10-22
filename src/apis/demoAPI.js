/**
 * Demo/Mock AI API for hackathon presentation
 * Provides realistic simulated responses when Chrome AI APIs are unavailable
 */

class DemoAPI {
    constructor() {
        this.enabled = true;
    }

    // Simulate processing delay
    async delay(ms = 1500) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async analyzePrompt(prompt) {
        await this.delay(2000);

        return {
            success: true,
            analysis: `**Main Topic/Question**:
The assignment focuses on analyzing "${prompt.substring(0, 50)}..."

**Key Requirements**:
1. Demonstrate critical thinking and analytical skills
2. Support arguments with relevant evidence and examples
3. Maintain proper academic structure (introduction, body, conclusion)
4. Use formal academic tone throughout
5. Cite sources appropriately

**Essay Structure**:
- **Introduction**: Hook, background context, thesis statement
- **Body Paragraph 1**: First main argument with supporting evidence
- **Body Paragraph 2**: Second main argument with analysis
- **Body Paragraph 3**: Counterargument and rebuttal
- **Conclusion**: Synthesis of ideas and final thoughts

**Recommended Length**: 800-1200 words (approximately 4-5 pages double-spaced)

**Writing Tips**:
1. Start by creating a detailed outline before writing
2. Use topic sentences to clearly introduce each paragraph's main idea
3. Include specific examples and evidence to support your claims`,
            timestamp: new Date().toISOString()
        };
    }

    async generateDraft(title, outline) {
        await this.delay(3000);

        const draft = `Introduction

In today's rapidly evolving world, understanding the complexities of ${title.toLowerCase()} has become increasingly important. This essay explores the key aspects and implications of this topic, examining how it influences our society and individual lives.

${outline.split('\n').slice(0, 3).map((point, i) => `

Body Paragraph ${i + 1}

${point}. This aspect is particularly significant because it demonstrates how ${title.toLowerCase()} affects various dimensions of our experience. Research has shown that when we consider these factors, we gain a deeper appreciation for the nuances involved. Furthermore, examining this through multiple perspectives reveals that the issue is more complex than initially apparent.

For instance, recent studies have indicated that the relationship between these elements creates a dynamic that influences outcomes in measurable ways. This evidence supports the argument that we must carefully consider all angles when evaluating ${title.toLowerCase()}. The implications of this finding extend beyond the immediate context and suggest broader applications.

`).join('')}

Conclusion

In conclusion, the analysis of ${title.toLowerCase()} reveals several important insights. By examining the evidence and considering multiple perspectives, we can better understand the complexities involved. Moving forward, it is essential that we continue to explore these themes and remain open to new information that may further illuminate this important topic. The implications of this discussion extend beyond academic inquiry and have real-world applications that merit continued attention.`;

        return {
            success: true,
            draft: draft,
            wordCount: draft.split(/\s+/).length,
            timestamp: new Date().toISOString()
        };
    }

    async rewriteText(text, tone) {
        await this.delay(1500);

        const toneTransforms = {
            academic: (t) => t
                .replace(/I think/g, 'This analysis suggests')
                .replace(/really/g, 'significantly')
                .replace(/a lot of/g, 'numerous')
                .replace(/good/g, 'beneficial')
                .replace(/bad/g, 'detrimental'),
            professional: (t) => t
                .replace(/I think/g, 'In my professional opinion')
                .replace(/really/g, 'particularly')
                .replace(/a lot of/g, 'multiple')
                .replace(/good/g, 'effective')
                .replace(/bad/g, 'ineffective'),
            casual: (t) => t
                .replace(/therefore/g, 'so')
                .replace(/consequently/g, 'as a result')
                .replace(/furthermore/g, 'also')
                .replace(/nevertheless/g, 'however')
        };

        const transform = toneTransforms[tone] || toneTransforms.academic;
        const rewritten = transform(text);

        return {
            success: true,
            rewritten: rewritten,
            tone: tone,
            timestamp: new Date().toISOString()
        };
    }

    async proofread(text) {
        await this.delay(2000);

        // Simulate finding some issues
        const mockCorrections = [
            {
                type: 'grammar',
                severity: 'warning',
                original: 'was',
                suggestion: 'were',
                explanation: 'Subject-verb agreement: Use "were" with plural subjects or in subjunctive mood.'
            }
        ];

        // Only add corrections if text is long enough
        if (text.length > 100) {
            mockCorrections.push({
                type: 'style',
                severity: 'info',
                original: 'very',
                suggestion: 'significantly',
                explanation: 'Style improvement: "significantly" is more precise in academic writing.'
            });
        }

        return {
            success: true,
            corrections: mockCorrections,
            totalErrors: mockCorrections.length,
            correctedText: text,
            stats: {
                totalErrors: mockCorrections.length,
                byType: { grammar: 1, style: mockCorrections.length > 1 ? 1 : 0 },
                bySeverity: { critical: 0, warning: 1, info: mockCorrections.length > 1 ? 1 : 0 },
                errorRate: ((mockCorrections.length / text.split(/\s+/).length) * 100).toFixed(2)
            },
            timestamp: new Date().toISOString()
        };
    }
}

export default new DemoAPI();
