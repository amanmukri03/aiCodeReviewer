const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require('./logger'); 

class AICodeReviewer {
    constructor() {
        this.initializeAI();
    }

    initializeAI() {
        const apiKey = process.env.GOOGLE_AI_API_KEY;
        
        if (!apiKey) {
            throw new Error('GOOGLE_AI_API_KEY environment variable is required');
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: this.getSystemInstruction()
        });
    }

    getSystemInstruction() {
        return `
           
            🎯 AI System Instruction: Elite Code Reviewer & Software Architect (10+ Years Experience)

            🚀 ROLE & MISSION:
            You are a world-class senior software engineer and code reviewer with 10+ years of experience across multiple domains (web, mobile, cloud, AI/ML, DevOps). Your mission is to transform good code into exceptional code through comprehensive analysis and actionable insights.

            🔍 CORE RESPONSIBILITIES:
            • Code Quality & Architecture: Ensure clean, maintainable, scalable, and well-structured code
            • Performance Optimization: Identify bottlenecks, memory leaks, and inefficient algorithms
            • Security Assessment: Detect vulnerabilities, secure coding practices, and compliance issues
            • Best Practices Enforcement: Apply industry standards, design patterns, and modern conventions
            • Technical Debt Management: Identify and suggest solutions for code smells and technical debt
            • Scalability Planning: Advise on future-proof architecture and horizontal/vertical scaling
            • Developer Experience: Improve code readability, maintainability, and team collaboration

            📋 COMPREHENSIVE REVIEW FRAMEWORK:

            🏗️ ARCHITECTURE & DESIGN:
            • Evaluate overall code structure and design patterns
            • Assess adherence to SOLID, DRY, KISS, and YAGNI principles
            • Review separation of concerns and modular design
            • Identify coupling issues and suggest decoupling strategies

            ⚡ PERFORMANCE & EFFICIENCY:
            • Analyze time/space complexity and algorithmic efficiency
            • Identify redundant operations, unnecessary loops, and memory leaks
            • Suggest caching strategies and lazy loading where applicable
            • Review database queries and API calls for optimization

            🔐 SECURITY & COMPLIANCE:
            • Scan for OWASP Top 10 vulnerabilities
            • Check input validation, sanitization, and authentication
            • Review data encryption, secure communication, and access controls
            • Ensure compliance with security standards (GDPR, HIPAA, etc.)

            🧪 TESTING & RELIABILITY:
            • Assess test coverage and quality of unit/integration tests
            • Identify edge cases and error scenarios
            • Suggest mocking strategies and test automation improvements
            • Review error handling and graceful degradation

            📚 DOCUMENTATION & MAINTAINABILITY:
            • Evaluate code comments, docstrings, and README quality
            • Suggest API documentation and architectural decision records
            • Review naming conventions and code self-documentation
            • Assess onboarding experience for new developers

            🔄 MODERN PRACTICES & TOOLING:
            • Recommend latest frameworks, libraries, and tools
            • Suggest CI/CD improvements and deployment strategies
            • Review code formatting, linting, and static analysis setup
            • Advise on monitoring, logging, and observability

            💬 COMMUNICATION STYLE:
            • Start with positive observations and strengths
            • Provide specific, actionable feedback with clear reasoning
            • Include code examples and before/after comparisons
            • Use emojis and structured formatting for clarity
            • Balance technical depth with accessibility
            • Encourage learning and professional growth

            📊 STRUCTURED OUTPUT FORMAT:

            ## 📈 Code Quality Score: [X/10]

            ### 🎯 Strengths:
            • ✅ [Highlight positive aspects]
            • ✅ [Good practices identified]

            ### 🔍 Issues Found:
            • ❌ **[Severity]** [Issue description]
            • ⚠️ **[Severity]** [Issue description]

            ### 🚀 Recommended Improvements:

            #### 1. [Category] - Priority: [High/Medium/Low]
            **Current Code:**
            \`\`\`[language]
            [problematic code]
            \`\`\`

            **Improved Code:**
            \`\`\`[language]
            [optimized code]
            \`\`\`

            **Benefits:**
            • ✅ [Specific improvement]
            • ✅ [Performance/security/readability gain]

            ### 🏗️ Architecture Suggestions:
            • [Structural improvements]
            • [Design pattern recommendations]

            ### 🔐 Security Considerations:
            • [Security issues and fixes]
            • [Best practices recommendations] 

            ### 🎯 Next Steps:
            1. [Immediate action items]
            2. [Medium-term improvements]
            3. [Long-term architectural considerations]

            ---

            🚀 CONTINUOUS IMPROVEMENT:
            Your code review should inspire developers to write better code, learn new techniques, and contribute to a culture of excellence. Focus on teaching principles, not just fixing issues.
        `;
    }

    /**
     * Generates content using Google's Generative AI
     * @param {string} prompt - The prompt to generate content for
     * @param {Object} options - Additional options for generation
     * @returns {Promise<string>} Generated content
     * @throws {Error} If generation fails
     */
    async generateContent(prompt, options = {}) {
        try {
            // Input validation
            if (!prompt || typeof prompt !== 'string') {
                throw new Error('Prompt must be a non-empty string');
            }

            if (prompt.length > 30000) { // Reasonable limit
                throw new Error('Prompt exceeds maximum length of 30,000 characters');
            }

            // Rate limiting could be added here
            const startTime = Date.now();
            
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();
            
            const endTime = Date.now();
            const duration = endTime - startTime;

            // Log the operation
            logger.info('Content generation completed', {
                promptLength: prompt.length,
                responseLength: responseText.length,
                duration: `${duration}ms`,
                timestamp: new Date().toISOString()
            });

            return responseText;

        } catch (error) {
            logger.error('Content generation failed', {
                error: error.message,
                stack: error.stack,
                promptLength: prompt?.length || 0,
                timestamp: new Date().toISOString()
            });

            // Re-throw with more context
            throw new Error(`AI content generation failed: ${error.message}`);
        }
    }

    /**
     * Batch process multiple prompts
     * @param {string[]} prompts - Array of prompts to process
     * @param {Object} options - Processing options
     * @returns {Promise<Array>} Array of results
     */
    async batchGenerateContent(prompts, options = {}) {
        const { concurrency = 3, retryAttempts = 2 } = options;
        
        if (!Array.isArray(prompts) || prompts.length === 0) {
            throw new Error('Prompts must be a non-empty array');
        }

        const results = [];
        const semaphore = new Array(concurrency).fill(null);

        const processPrompt = async (prompt, index) => {
            let attempts = 0;
            
            while (attempts <= retryAttempts) {
                try {
                    const result = await this.generateContent(prompt);
                    return { index, result, success: true };
                } catch (error) {
                    attempts++;
                    if (attempts > retryAttempts) {
                        logger.error(`Failed to process prompt at index ${index} after ${retryAttempts} retries`);
                        return { index, error: error.message, success: false };
                    }
                    // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
                }
            }
        };

        // Process prompts with concurrency control
        for (let i = 0; i < prompts.length; i += concurrency) {
            const batch = prompts.slice(i, i + concurrency);
            const batchPromises = batch.map((prompt, batchIndex) => 
                processPrompt(prompt, i + batchIndex)
            );
            
            const batchResults = await Promise.allSettled(batchPromises);
            results.push(...batchResults.map(r => r.value || r.reason));
        }

        return results;
    }

    /**
     * Health check method
     * @returns {Promise<boolean>} True if service is healthy
     */
    async healthCheck() {
        try {
            const testPrompt = "Hello, this is a health check.";
            const result = await this.generateContent(testPrompt);
            return result && result.length > 0;
        } catch (error) {
            logger.error('Health check failed', { error: error.message });
            return false;
        }
    }
}

// Create singleton instance
const aiReviewer = new AICodeReviewer();


module.exports = {
    generateContent: (prompt, options) => aiReviewer.generateContent(prompt, options),
    batchGenerateContent: (prompts, options) => aiReviewer.batchGenerateContent(prompts, options),
    healthCheck: () => aiReviewer.healthCheck(),
    AICodeReviewer 
};