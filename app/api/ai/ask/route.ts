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
        { success: false, error: 'Q&A is available on Student and Pro plans. Please upgrade to use this feature.' },
        { status: 403 }
      )
    }

    const { content, subject, question } = await request.json()

    if (!content || !subject || !question) {
      return NextResponse.json(
        { success: false, error: 'Content, subject, and question are required' },
        { status: 400 }
      )
    }

    // Check content length
    const estimatedTokens = Math.ceil(content.length / 4)
    if (estimatedTokens > 4000) {
      return NextResponse.json(
        { success: false, error: 'Content is too long. Please use shorter notes for Q&A.' },
        { status: 400 }
      )
    }

    const prompt = `You are a helpful study assistant. Answer the following question based on the provided ${subject} notes.

Notes:
${content}

Question: ${question}

Please provide a clear, accurate answer based on the notes provided. If the answer cannot be found in the notes, say so. Include relevant details and explanations to help with understanding.`

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful study assistant that answers questions based on provided notes. Be accurate and helpful.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.3,
    })

    const answer = completion.choices[0]?.message?.content

    if (!answer) {
      throw new Error('No answer generated')
    }

    return NextResponse.json({
      success: true,
      data: {
        answer,
        question,
        wordCount: answer.split(' ').length,
        estimatedTokens: completion.usage?.total_tokens || 0
      }
    })

  } catch (error: any) {
    console.error('Q&A error:', error)
    
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
      { success: false, error: 'Failed to get answer. Please try again.' },
      { status: 500 }
    )
  }
}
