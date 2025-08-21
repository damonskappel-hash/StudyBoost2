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
      apiKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) + '...'
    });

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.');
    }

    // Check content length
    const estimatedTokens = Math.ceil(content.length / 4);
    if (estimatedTokens > 4000) {
      throw new Error('Content is too long. Please use shorter notes for flashcard generation.');
    }

    const prompt = `You are an expert educational content creator. Create ${numCards} high-quality, engaging flashcards based on the following ${subject} content.

CRITICAL REQUIREMENTS:
- Create exactly ${numCards} flashcards
- NEVER use fill-in-the-blank format (no ______ or ___)
- NEVER include the answer or key terms in the question
- Each question must be a complete sentence that ends with a question mark
- Questions should test deep understanding and application, not just memorization

ONLY USE THESE QUESTION FORMATS:
1. "What is [concept]?" - for definitions
2. "How does [process] work?" - for processes
3. "What is the difference between [concept A] and [concept B]?" - for comparisons
4. "What happens when [scenario] occurs?" - for applications
5. "Why does [phenomenon] happen?" - for analysis
6. "What would you use to [solve problem]?" - for problem-solving

EXAMPLES OF GOOD QUESTIONS:
✅ "What is the Arrhenius definition of an acid?"
✅ "How does acid-base neutralization work?"
✅ "What is the difference between strong and weak acids?"
✅ "What happens when HCl dissolves in water?"
✅ "Why do strong acids completely dissociate?"

EXAMPLES OF BAD QUESTIONS (NEVER USE THESE):
❌ "Arrhenius ______ - Acid: produces H+ ions in water?"
❌ "Bronsted-Lowry definition: ______ Acid"
❌ "Fill in the blank: ______ acids donate protons"
❌ "What is Arrhenius?" (when Arrhenius is mentioned in the question)

ANSWERS:
- Must be complete, meaningful responses (2-20 words)
- Should explain concepts, not just state terms
- Must NOT be terms that appear in the question
- Examples of good answers:
  ✅ "A substance that produces H+ ions when dissolved in water"
  ✅ "Complete transfer of protons from acid to base"
  ✅ "Strong acids fully dissociate, weak acids partially dissociate"
  ✅ "Forms H3O+ ions and Cl- ions in solution"
  ✅ "Due to their high tendency to donate protons"

Format your response as a JSON array with this structure:
[
  {
    "question": "What is the specific question here?",
    "answer": "The precise answer here"
  }
]

Content to create flashcards from:
${content}

Return only the JSON array, no additional text.`;

    try {
      console.log('Making OpenAI API call with model:', process.env.OPENAI_MODEL || 'gpt-3.5-turbo');
      
      const openai = getOpenAIClient();
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful study assistant that creates educational flashcards. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.4,
      });

      console.log('OpenAI API call successful, response received');

      const responseText = completion.choices[0]?.message?.content;

      if (!responseText) {
        throw new Error('No flashcards generated');
      }

      // Parse the JSON response
      let flashcards;
      try {
        console.log('Raw OpenAI response:', responseText);
        
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          console.log('Found JSON match:', jsonMatch[0]);
          flashcards = JSON.parse(jsonMatch[0]);
        } else {
          console.log('No JSON match found, trying to parse entire response');
          flashcards = JSON.parse(responseText);
        }
        
        console.log('Parsed flashcards:', flashcards);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw response:', responseText);
        throw new Error('Failed to parse flashcards');
      }

      // Validate the flashcard structure
      if (!Array.isArray(flashcards) || flashcards.length === 0) {
        throw new Error('Invalid flashcard format');
      }

      // Quality scoring function
      const scoreFlashcard = (flashcard: any) => {
        let score = 0;
        const question = flashcard.question.toLowerCase();
        const answer = flashcard.answer.toLowerCase();
        
        // IMMEDIATE REJECTION for bad formats
        if (question.includes('______') || question.includes('___') || question.includes('fill in') || question.includes('blank')) {
          console.log(`REJECTING: Fill-in-the-blank format - Q: "${flashcard.question}"`);
          return -100; // Immediate rejection
        }
        
        // Check if question ends with question mark
        if (!flashcard.question.trim().endsWith('?')) {
          console.log(`REJECTING: Question doesn't end with ? - Q: "${flashcard.question}"`);
          return -100;
        }
        
        // Check for obvious answers (any word from answer in question)
        const answerWords = answer.split(' ').filter(word => word.length > 2);
        const questionWords = question.split(' ').filter(word => word.length > 2);
        
        const hasOverlap = answerWords.some(answerWord => 
          questionWords.some(questionWord => 
            questionWord.includes(answerWord) || answerWord.includes(questionWord)
          )
        );
        
        if (hasOverlap && answerWords.length > 0) {
          console.log(`REJECTING: Answer appears in question - Q: "${flashcard.question}" A: "${flashcard.answer}"`);
          return -100;
        }
        
        // Bonus for good question types
        if (question.includes('what is') || question.includes('how does') || question.includes('why does')) score += 3;
        if (question.includes('difference between')) score += 4;
        if (question.includes('what happens when')) score += 3;
        if (question.includes('what would you use')) score += 3;
        
        // Bonus for meaningful answers
        if (answer.split(' ').length >= 3) score += 2;
        if (answer.length > 20) score += 2;
        if (answer.length > 40) score += 1;
        
        // Penalty for short answers
        if (answer.split(' ').length < 2) score -= 5;
        if (answer.length < 10) score -= 3;
        
        return score;
      };

      // For now, accept all flashcards to test the basic flow
      const validFlashcards = flashcards.map((flashcard, index) => ({ ...flashcard, score: index }));
      console.log(`Generated ${flashcards.length} flashcards, accepting all for testing`);

      // Sort flashcards by quality score (highest first)
      validFlashcards.sort((a, b) => (b.score || 0) - (a.score || 0));
      
      // Simplified for testing - no retry logic
      console.log(`Using ${validFlashcards.length} flashcards`);

      // Limit to the requested number and remove score from final output
      const finalFlashcards = validFlashcards.slice(0, numCards).map(({ score, ...flashcard }) => flashcard);

      return {
        success: true,
        data: {
          flashcards: finalFlashcards,
          totalCards: finalFlashcards.length,
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

      // Log the specific error for debugging
      console.error('Specific error details:', {
        errorType: typeof error,
        errorKeys: Object.keys(error),
        errorMessage: error.message,
        errorCode: error.code
      });

      throw new Error(`Failed to generate flashcards: ${error.message || 'Unknown error'}`);
    }
  },
});
