import { v } from "convex/values";
import { action } from "./_generated/server";
import OpenAI from "openai";

// Initialize OpenAI client (reads from environment)
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim().length < 20) {
    throw new Error("OPENAI_API_KEY is not set or invalid in the environment");
  }
  return new OpenAI({ apiKey });
};

// Test action to verify OpenAI setup
export const testOpenAI = action({
  args: {},
  handler: async (ctx, args) => {
    console.log('Testing OpenAI connection...');
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not found');
    }
    
    try {
      const openai = getOpenAIClient();
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Say "Hello, OpenAI is working!"'
          }
        ],
        max_tokens: 50,
      });
      
      const response = completion.choices[0]?.message?.content;
      console.log('OpenAI test successful:', response);
      
      return {
        success: true,
        message: response
      };
    } catch (error: any) {
      console.error('OpenAI test failed:', error);
      throw new Error(`OpenAI test failed: ${error.message}`);
    }
  },
});

export const generateFlashcardsAction = action({
  args: {
    content: v.string(),
    subject: v.string(),
    numCards: v.number(),
  },
  handler: async (ctx, args) => {
    const { content, subject, numCards } = args;

    console.log('Starting flashcard generation with args:', {
      contentLength: content.length,
      subject,
      numCards,
      hasApiKey: !!process.env.OPENAI_API_KEY,
    });

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is missing');
      throw new Error('OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.');
    }

    // Check content length
    const estimatedTokens = Math.ceil(content.length / 4);
    if (estimatedTokens > 4000) {
      console.error('Content too long:', estimatedTokens, 'tokens');
      throw new Error('Content is too long. Please use shorter notes for flashcard generation.');
    }

    const prompt = `Create ${numCards} high-quality flashcards based on this ${subject} content. 

Requirements:
- Create exactly ${numCards} flashcards
- Each question must be a complete sentence ending with "?"
- Questions should test understanding, not just memorization
- Answers should be 2-20 words and explain concepts
- Never use fill-in-the-blank format

Format as JSON array:
[
  {
    "question": "What is [concept]?",
    "answer": "The definition or explanation"
  }
]

Content: ${content.substring(0, 2000)}`;

    try {
      console.log('Making OpenAI API call...');
      
      const openai = getOpenAIClient();
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful study assistant. Create educational flashcards and respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      });

      console.log('OpenAI API call successful');

      const responseText = completion.choices[0]?.message?.content;

      if (!responseText) {
        console.error('No response from OpenAI');
        throw new Error('No response from OpenAI');
      }

      console.log('Raw response:', responseText);

      // Parse the JSON response
      let flashcards;
      try {
        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          flashcards = JSON.parse(jsonMatch[0]);
        } else {
          flashcards = JSON.parse(responseText);
        }
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw response:', responseText);
        throw new Error('Failed to parse flashcards from OpenAI response');
      }

      // Validate the flashcard structure
      if (!Array.isArray(flashcards) || flashcards.length === 0) {
        console.error('No valid flashcards generated');
        throw new Error('No valid flashcards generated');
      }

      // Basic validation and filtering
      const validFlashcards = flashcards
        .filter((card: any) => 
          card.question && 
          card.answer && 
          typeof card.question === 'string' && 
          typeof card.answer === 'string' &&
          card.question.trim().endsWith('?') &&
          !card.question.includes('______') &&
          !card.question.includes('___')
        )
        .slice(0, numCards)
        .map((card: any) => ({
          question: card.question.trim(),
          answer: card.answer.trim()
        }));

      console.log(`Generated ${validFlashcards.length} valid flashcards`);

      if (validFlashcards.length === 0) {
        console.error('No valid flashcards after filtering');
        throw new Error('No valid flashcards could be generated. Please try again.');
      }

      return {
        success: true,
        data: {
          flashcards: validFlashcards,
          totalCards: validFlashcards.length,
          estimatedTokens: completion.usage?.total_tokens || 0
        }
      };

    } catch (error: any) {
      console.error('Flashcard generation error:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        code: error.code,
        status: error.status
      });
      
      // Provide specific error messages
      if (error.message?.includes('rate limit')) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (error.message?.includes('token')) {
        throw new Error('Content is too long. Please use shorter notes.');
      }
      if (error.message?.includes('authentication')) {
        throw new Error('OpenAI API key is invalid. Please check your configuration.');
      }
      if (error.message?.includes('quota')) {
        throw new Error('OpenAI quota exceeded. Please try again later.');
      }

      throw new Error(`Failed to generate flashcards: ${error.message || 'Unknown error'}`);
    }
  },
});
