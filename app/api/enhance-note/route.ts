import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { content, subject, enhancementSettings } = await request.json()

    if (!content || !subject) {
      return NextResponse.json(
        { success: false, error: 'Content and subject are required' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    const originalContent = content.trim()
    
    // Force basic settings for free users (server-side enforcement)
    const effectiveSettings = {
      includeDefinitions: enhancementSettings?.includeDefinitions ?? true,
      generateQuestions: enhancementSettings?.generateQuestions ?? false,
      createSummary: enhancementSettings?.createSummary ?? false,
      addExamples: enhancementSettings?.addExamples ?? false,
      structureLevel: enhancementSettings?.structureLevel ?? "basic",
      autoGenerateFlashcards: enhancementSettings?.autoGenerateFlashcards ?? false
    }

    // Mock enhancement for testing (remove this when API key is set)
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-api-key-here') {
      const mockEnhancedContent = "# Enhanced " + subject + " Notes\n\n## Key Terms\n- **Term**: Definition would appear here with real API\n- **Concept**: Explanation would appear here with real API\n\n---\n\n" + originalContent;

      return NextResponse.json({
        success: true,
        enhancedContent: mockEnhancedContent,
        processingTime: 1000,
        wordCount: mockEnhancedContent.split(/\s+/).length
      })
    }

    const startTime = Date.now()
    
    let prompt = "You are an expert educational assistant helping to enhance student notes. ";
    prompt += "The content is from a " + subject + " class. ";
    prompt += "Please enhance this content to make it more organized, clear, and study-friendly.\n\n";
    prompt += "Original content:\n" + originalContent + "\n\n";

    // Add enhancement instructions based on settings
    const enhancements = []
    
    if (effectiveSettings.structureLevel === "comprehensive") {
      enhancements.push("Organize this content with clear headings, bullet points, and logical flow.")
    } else if (effectiveSettings.structureLevel === "detailed") {
      enhancements.push("Organize this content with clear headings and bullet points.")
    }
    
    if (effectiveSettings.includeDefinitions) {
      enhancements.push("Add clear definitions for key terms and concepts.")
    }
    
    if (effectiveSettings.generateQuestions) {
      enhancements.push("Generate study questions to test understanding.")
    }
    
    if (effectiveSettings.createSummary) {
      enhancements.push("Create a concise summary of the main points.")
    }
    
    if (effectiveSettings.addExamples) {
      enhancements.push("Add relevant examples to illustrate concepts.")
    }

    prompt += "Enhancement instructions:\n" + enhancements.join('\n\n') + "\n\n"
    prompt += "Please provide the enhanced content in markdown format. ";
    prompt += "Make it well-structured, easy to read, and study-friendly. ";
    prompt += "If you add definitions, format them as **Term**: Definition. ";
    prompt += "If you add questions, format them as ### Study Questions followed by numbered questions. ";
    prompt += "If you add summaries, format them as ### Summary followed by bullet points.";

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: "system",
          content: "You are an expert educational assistant that helps students improve their notes. Always respond in markdown format and focus on clarity, organization, and educational value."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const enhancedContent = completion.choices[0]?.message?.content || ""
    const processingTime = Date.now() - startTime
    const wordCount = enhancedContent.split(/\s+/).length

    return NextResponse.json({
      success: true,
      enhancedContent,
      processingTime,
      wordCount
    })
  } catch (error) {
    console.error('Enhancement error:', error)
    
    return NextResponse.json(
      { success: false, error: 'Failed to enhance note. Please try again.' },
      { status: 500 }
    )
  }
}
