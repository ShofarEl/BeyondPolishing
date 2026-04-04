import dotenv from "dotenv"
dotenv.config()

import OpenAI from 'openai';

class AIService {
  constructor() {
    console.log('Initializing AI Service...');
    console.log('OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
    console.log('OpenAI API Key length:', process.env.OPENAI_API_KEY?.length);
    
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OPENAI_API_KEY environment variable is not set - AI features will be disabled');
      this.openai = null;
    } else {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      console.log('OpenAI client initialized successfully');
    }
    
    // Initialize prompt templates
    this.initializePromptTemplates();
    console.log('AI Service initialization complete');
  }

  initializePromptTemplates() {
    this.prompts = {
      editor: {
        system: `You are an expert data science editor and mentor specializing in network infrastructure and WiFi optimization problems. Your role is to help students refine and polish their WiFi infrastructure problem statements to make them more precise, measurable, and actionable.

Your task is to provide constructive feedback and specific suggestions to improve the problem statement. Focus on:

1. **Clarity and Specificity**: Make the problem statement clear and unambiguous in the context of network infrastructure
2. **Metrics and Evaluation**: Suggest specific, measurable success criteria relevant to WiFi performance, user satisfaction, or network efficiency
3. **Data Requirements**: Identify what network data, usage patterns, or infrastructure data would be needed and how to obtain it
4. **Scope and Constraints**: Help define realistic boundaries considering network topology, user privacy, and technical limitations
5. **Stakeholder Alignment**: Consider IT administrators, end users, facility managers, and budget decision-makers
6. **Technical Feasibility**: Suggest approaches that are technically sound for network infrastructure contexts

Provide 2-3 specific, actionable suggestions. Be encouraging but direct. Use a supportive, mentor-like tone. Format your response using markdown with **bold** headings and clear numbered points.`,

        user: `Please review and refine this data science problem statement about WiFi infrastructure:

"{problemStatement}"

Consider the specific context of WiFi infrastructure optimization, network performance, and user experience. Provide specific suggestions to make this problem more precise, measurable, and actionable. Focus on clarity, metrics, data requirements, and technical feasibility in the context of network infrastructure.`
      },

      challenger: {
        system: `You are a creative challenger and innovation catalyst specializing in network infrastructure and WiFi optimization. Your role is to help students explore alternative perspectives and reframe their WiFi infrastructure problems in novel, creative ways.

Your task is to challenge conventional thinking and propose radically different approaches to the problem. Focus on:

1. **Alternative Stakeholders**: Consider dormitory residents, facility managers, IT support staff, budget administrators, accessibility advocates, or environmental sustainability teams
2. **Different Objectives**: Explore goals like equity in access, user satisfaction, cost optimization, energy efficiency, security, or social connectivity
3. **Novel Approaches**: Consider predictive maintenance, user behavior analysis, fairness algorithms, or community-driven solutions
4. **Broader Context**: Connect to issues like digital equity, campus sustainability, student success, or organizational efficiency
5. **Creative Constraints**: Add interesting requirements like privacy protection, budget limitations, or environmental considerations
6. **Cross-Domain Insights**: Apply concepts from urban planning, social networks, resource allocation, or service design

Propose 2-3 alternative problem framings that are creative but still feasible. Challenge assumptions and encourage innovative thinking. Use an inspiring, thought-provoking tone. Format your response using markdown with **bold** headings and clear numbered alternatives.`,

        user: `Challenge and reframe this WiFi infrastructure data science problem from a completely different angle:

"{problemStatement}"

Consider alternative perspectives such as: equity in network access, user experience optimization, cost-effectiveness, environmental impact, security concerns, or social implications of connectivity. Propose alternative problem framings that explore different stakeholders, objectives, or approaches. Be creative and innovative while maintaining feasibility in the context of network infrastructure.`
      }
    };
  }

  async generateResponse(promptType, problemStatement, userInput = '') {
    try {
      console.log('generateResponse called with:', {
        promptType,
        problemStatementLength: problemStatement?.length,
        hasUserInput: !!userInput
      });

      if (!this.openai) {
        throw new Error('AI service is not available - OPENAI_API_KEY not configured');
      }

      const promptTemplate = this.prompts[promptType];
      if (!promptTemplate) {
        throw new Error(`Unknown prompt type: ${promptType}`);
      }

      // Combine system and user prompts
      const systemPrompt = promptTemplate.system;
      const userPrompt = promptTemplate.user.replace('{problemStatement}', problemStatement);
      
      // If user provided additional input, incorporate it
      const fullUserPrompt = userInput 
        ? `${userPrompt}\n\nAdditional context from user: ${userInput}`
        : userPrompt;

      console.log('Making OpenAI API call...');
      console.log('System prompt length:', systemPrompt.length);
      console.log('User prompt length:', fullUserPrompt.length);

      // Generate response using OpenAI
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: fullUserPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      console.log('OpenAI API response received');
      console.log('Choices length:', completion.choices?.length);
      console.log('Response length:', completion.choices?.[0]?.message?.content?.length);

      const response = completion.choices[0].message.content;

      const result = {
        success: true,
        response: response.trim(),
        promptType,
        timestamp: new Date(),
        model: 'gpt-3.5-turbo'
      };

      console.log('Returning successful result:', {
        success: result.success,
        responseLength: result.response.length,
        promptType: result.promptType
      });

      return result;

    } catch (error) {
      console.error('AI Service Error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        type: error.type,
        status: error.status
      });
      
      return {
        success: false,
        error: error.message,
        promptType,
        timestamp: new Date()
      };
    }
  }

  async generateEditorResponse(problemStatement, userInput = '') {
    return await this.generateResponse('editor', problemStatement, userInput);
  }

  async generateChallengerResponse(problemStatement, userInput = '') {
    return await this.generateResponse('challenger', problemStatement, userInput);
  }

  // Method to get prompt statistics for research analysis
  getPromptStatistics() {
    return {
      availableTypes: Object.keys(this.prompts),
      promptCounts: {
        editor: 1,
        challenger: 1
      }
    };
  }

  // Method to validate prompt type
  isValidPromptType(promptType) {
    return Object.keys(this.prompts).includes(promptType);
  }
}

// Singleton instance
const aiService = new AIService();

export default aiService;
