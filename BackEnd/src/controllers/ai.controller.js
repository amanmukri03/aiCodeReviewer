// controllers/ai.controller.js
const { generateContent } = require('../services/ai.service');

module.exports.getReview = async (req, res) => {
  try {
    const { code, language = 'javascript' } = req.body;

    // Input validation
    if (!code) {
      return res.status(400).json({ 
        success: false,
        error: 'Code is required.' 
      });
    }

    if (typeof code !== 'string' || code.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Code must be a non-empty string.' 
      });
    }

    if (code.length > 50000) {
      return res.status(400).json({ 
        success: false,
        error: 'Code exceeds maximum length of 50,000 characters.' 
      });
    }

    // Create a structured prompt for better code review
    const prompt = `Please review the following ${language} code and provide detailed feedback:

\`\`\`${language}
${code}
\`\`\`

Please analyze and provide:
1. Overall code quality assessment
2. Specific issues or bugs found
3. Performance improvements
4. Security considerations
5. Best practices recommendations
6. Code refactoring suggestions

Format your response with clear sections and actionable recommendations.`;

    console.log('Generating code review for:', {
      codeLength: code.length,
      language,
      timestamp: new Date().toISOString()
    });

    const response = await generateContent(prompt);

    res.status(200).json({ 
      success: true,
      review: response,
      metadata: {
        language,
        codeLength: code.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Error in getReview:", error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate code review.',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};