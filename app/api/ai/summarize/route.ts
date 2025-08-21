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
        { success: false, error: 'Summaries are available on Student and Pro plans. Please upgrade to use this feature.' },
        { status: 403 }
      )
    }

    const { content, subject } = await request.json()

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
        { success: false, error: 'Content is too long. Please use shorter notes for summarization.' },
        { status: 400 }
      )
    }

    const prompt = `You are a helpful study assistant. Create a comprehensive but concise summary of the following ${subject} notes. 

Focus on:
- Key concepts and main ideas
- Important definitions and terms
- Key relationships and connections
- Practical applications or examples

Format the summary with clear sections and bullet points where appropriate.

Notes to summarize:
${content}

Please provide a well-structured summary that captures the essential information while being easy to read and understand.`

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful study assistant that creates clear, concise summaries of academic notes.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    })

    const summary = completion.choices[0]?.message?.content

    if (!summary) {
      throw new Error('No summary generated')
    }

    return NextResponse.json({
      success: true,
      data: {
        summary,
        wordCount: summary.split(' ').length,
        estimatedTokens: completion.usage?.total_tokens || 0
      }
    })

  } catch (error: any) {
    console.error('Summary generation error:', error)
    
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
      { success: false, error: 'Failed to generate summary. Please try again.' },
      { status: 500 }
    )
  }
}
