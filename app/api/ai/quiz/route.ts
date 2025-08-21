import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { auth } from '@clerk/nextjs/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { userId, has } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const isStudent = has?.({ plan: 'student' }) ?? false
    const isPro = (has?.({ plan: 'pro' }) ?? false) || (has?.({ plan: 'premium' }) ?? false)
    const isPaid = isStudent || isPro

    if (!isPaid) {
      return NextResponse.json(
        { success: false, error: 'Quiz generation is available on Student and Pro plans. Please upgrade to use this feature.' },
        { status: 403 }
      )
    }

    const { content, subject, numQuestions = 5 } = await request.json()

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
        { success: false, error: 'Content is too long. Please use shorter notes for quiz generation.' },
        { status: 400 }
      )
    }

    const prompt = `You are a helpful study assistant. Create ${numQuestions} multiple-choice quiz questions based on the following ${subject} notes.

Requirements:
- Create exactly ${numQuestions} questions
- Each question should have 4 options (A, B, C, D)
- Include one correct answer and three plausible distractors
- Provide a brief explanation for the correct answer
- Questions should test understanding, not just memorization
- Vary the difficulty level

Format your response as a JSON array with this structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation of why this is correct"
  }
]

Notes to create questions from:
${content}

Return only the JSON array, no additional text.`

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful study assistant that creates educational quiz questions. Always respond with valid JSON.'
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
      throw new Error('No quiz generated')
    }

    // Parse the JSON response
    let quizQuestions
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        quizQuestions = JSON.parse(jsonMatch[0])
      } else {
        quizQuestions = JSON.parse(responseText)
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      throw new Error('Failed to parse quiz questions')
    }

    // Validate the quiz structure
    if (!Array.isArray(quizQuestions) || quizQuestions.length === 0) {
      throw new Error('Invalid quiz format')
    }

    // Validate each question
    for (const question of quizQuestions) {
      if (!question.question || !Array.isArray(question.options) || question.options.length !== 4) {
        throw new Error('Invalid question format')
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        questions: quizQuestions,
        totalQuestions: quizQuestions.length,
        estimatedTokens: completion.usage?.total_tokens || 0
      }
    })

  } catch (error: any) {
    console.error('Quiz generation error:', error)
    
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
      { success: false, error: 'Failed to generate quiz. Please try again.' },
      { status: 500 }
    )
  }
}
