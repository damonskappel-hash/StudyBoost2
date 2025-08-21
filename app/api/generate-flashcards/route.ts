import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { content, subject, numCards = 5 } = await request.json()

    if (!content || !subject) {
      return NextResponse.json(
        { success: false, error: 'Content and subject are required' },
        { status: 400 }
      )
    }

    // Check content length
    const estimatedTokens = Math.ceil(content.length / 4)
    if (estimatedTokens > 4000) {
      return NextResponse.json(
        { success: false, error: 'Content is too long. Please use shorter notes for flashcard generation.' },
        { status: 400 }
      )
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

Return only the JSON array, no additional text.`

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
    })

    const responseText = completion.choices[0]?.message?.content

    if (!responseText) {
      throw new Error('No flashcards generated')
    }

    // Parse the JSON response
    let flashcards
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        flashcards = JSON.parse(jsonMatch[0])
      } else {
        flashcards = JSON.parse(responseText)
      }
      
      console.log('Generated flashcards:', JSON.stringify(flashcards, null, 2))
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      console.error('Raw response:', responseText)
      throw new Error('Failed to parse flashcards')
    }

    // Validate the flashcard structure
    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      throw new Error('Invalid flashcard format')
    }

    // Validate each flashcard and filter out poor ones
    const validFlashcards = []
    const genericWords = ['have', 'is', 'are', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'down', 'out', 'off', 'over', 'under', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'within', 'without', 'against', 'toward', 'towards', 'upon', 'about', 'like', 'as', 'since', 'until', 'while', 'where', 'when', 'why', 'how', 'what', 'which', 'who', 'whom', 'whose', 'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'we', 'us', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'hers', 'i', 'me', 'my', 'mine']
    
    // Quality scoring function
    const scoreFlashcard = (flashcard: any) => {
      let score = 0
      const question = flashcard.question.toLowerCase()
      const answer = flashcard.answer.toLowerCase()
      
      // IMMEDIATE REJECTION for bad formats
      if (question.includes('______') || question.includes('___') || question.includes('fill in') || question.includes('blank')) {
        console.log(`REJECTING: Fill-in-the-blank format - Q: "${flashcard.question}"`)
        return -100 // Immediate rejection
      }
      
      // Check if question ends with question mark
      if (!flashcard.question.trim().endsWith('?')) {
        console.log(`REJECTING: Question doesn't end with ? - Q: "${flashcard.question}"`)
        return -100
      }
      
      // Check for obvious answers (any word from answer in question)
      const answerWords = answer.split(' ').filter(word => word.length > 2)
      const questionWords = question.split(' ').filter(word => word.length > 2)
      
      const hasOverlap = answerWords.some(answerWord => 
        questionWords.some(questionWord => 
          questionWord.includes(answerWord) || answerWord.includes(questionWord)
        )
      )
      
      if (hasOverlap && answerWords.length > 0) {
        console.log(`REJECTING: Answer appears in question - Q: "${flashcard.question}" A: "${flashcard.answer}"`)
        return -100
      }
      
      // Bonus for good question types
      if (question.includes('what is') || question.includes('how does') || question.includes('why does')) score += 3
      if (question.includes('difference between')) score += 4
      if (question.includes('what happens when')) score += 3
      if (question.includes('what would you use')) score += 3
      
      // Bonus for meaningful answers
      if (answer.split(' ').length >= 3) score += 2
      if (answer.length > 20) score += 2
      if (answer.length > 40) score += 1
      
      // Penalty for short answers
      if (answer.split(' ').length < 2) score -= 5
      if (answer.length < 10) score -= 3
      
      return score
    }

    for (const flashcard of flashcards) {
      if (!flashcard.question || !flashcard.answer) {
        continue // Skip invalid flashcards
      }

      const answer = flashcard.answer.toLowerCase().trim()
      
      // Skip flashcards with empty answers
      if (!answer || answer.length === 0) {
        continue
      }

      // Skip flashcards with only generic word answers (but allow compound answers)
      if (genericWords.includes(answer) && answer.split(' ').length === 1) {
        continue
      }

      // Skip flashcards with very short answers (less than 2 chars) or very long answers (more than 150 chars)
      if (answer.length < 2 || answer.length > 150) {
        continue
      }

      // Skip flashcards that are too obvious (answer appears directly in question)
      const questionLower = flashcard.question.toLowerCase()
      const answerLower = answer.toLowerCase()
      
      // Check if answer appears in question (more comprehensive check)
      const answerWords = answerLower.split(' ').filter(word => word.length > 2)
      const questionWords = questionLower.split(' ').filter(word => word.length > 2)
      
      // Skip if any significant word from the answer appears in the question
      const hasOverlap = answerWords.some(answerWord => 
        questionWords.some(questionWord => 
          questionWord.includes(answerWord) || answerWord.includes(questionWord)
        )
      )
      
      if (hasOverlap && answerWords.length > 0) {
        console.log(`Skipping flashcard with overlap: Q: "${flashcard.question}" A: "${flashcard.answer}"`)
        continue
      }
      
      // Additional check for fill-in-the-blank with obvious answers
      if (flashcard.question.includes('______') || flashcard.question.includes('___')) {
        const blankPattern = /_{3,}/
        if (blankPattern.test(flashcard.question)) {
          // For fill-in-the-blank, be extra strict about answer appearing in question
          if (questionLower.includes(answerLower) && answerLower.length > 2) {
            console.log(`Skipping fill-in-the-blank with obvious answer: Q: "${flashcard.question}" A: "${flashcard.answer}"`)
            continue
          }
        }
      }

      // Score the flashcard and only include high-quality ones
      const score = scoreFlashcard(flashcard)
      if (score >= 1) { // Require at least score of 1 to be included
        validFlashcards.push({ ...flashcard, score })
        console.log(`ACCEPTED (score: ${score}): Q: "${flashcard.question}" A: "${flashcard.answer}"`)
      } else {
        console.log(`REJECTED (score: ${score}): Q: "${flashcard.question}" A: "${flashcard.answer}"`)
      }
    }

    // Sort flashcards by quality score (highest first)
    validFlashcards.sort((a, b) => (b.score || 0) - (a.score || 0))
    
    // If we don't have enough valid flashcards, try to regenerate with a stricter prompt
    if (validFlashcards.length < Math.ceil(numCards * 0.7)) {
      console.warn(`Only ${validFlashcards.length} high-quality flashcards generated. Attempting regeneration with stricter prompt...`)
      
      // Try one more time with an even stricter prompt
      const strictPrompt = `Create ${numCards} flashcards. CRITICAL: Use ONLY complete questions ending with "?". NEVER use blanks or fill-in-the-blank. NEVER include answer terms in questions. Focus on: "What is [concept]?", "How does [process] work?", "What is the difference between [A] and [B]?", "What happens when [scenario]?", "Why does [phenomenon] happen?". Content: ${content}`
      
      try {
        const retryCompletion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a strict educational content creator. Only create high-quality flashcards with complete questions.'
            },
            {
              role: 'user',
              content: strictPrompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.2, // Lower temperature for more consistent output
        })
        
        const retryResponseText = retryCompletion.choices[0]?.message?.content
        if (retryResponseText) {
          const jsonMatch = retryResponseText.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            const retryFlashcards = JSON.parse(jsonMatch[0])
            const retryValidFlashcards = []
            
            for (const flashcard of retryFlashcards) {
              if (flashcard.question && flashcard.answer) {
                const score = scoreFlashcard(flashcard)
                if (score >= 1) {
                  retryValidFlashcards.push({ ...flashcard, score })
                }
              }
            }
            
            // Combine with original valid flashcards
            validFlashcards.push(...retryValidFlashcards)
            validFlashcards.sort((a, b) => (b.score || 0) - (a.score || 0))
            console.log(`After retry: ${validFlashcards.length} total valid flashcards`)
          }
        }
      } catch (retryError) {
        console.error('Retry generation failed:', retryError)
      }
    }

    // Limit to the requested number and remove score from final output
    const finalFlashcards = validFlashcards.slice(0, numCards).map(({ score, ...flashcard }) => flashcard)

    return NextResponse.json({
      success: true,
      data: {
        flashcards: finalFlashcards,
        totalCards: finalFlashcards.length,
        estimatedTokens: completion.usage?.total_tokens || 0
      }
    })

  } catch (error: any) {
    console.error('Flashcard generation error:', error)

    if (error.message?.includes('rate limit')) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again in a moment.' },
        { status: 429 }
      )
    }

    if (error.message?.includes('token')) {
      return NextResponse.json(
        { success: false, error: 'Content is too long. Please use shorter notes.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate flashcards. Please try again.' },
      { status: 500 }
    )
  }
}
