// AI Features for StudyBoost
export interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export interface AIResponse {
  success: boolean
  data?: any
  error?: string
}

// Generate a summary of the note content
export async function generateSummary(content: string, subject: string): Promise<AIResponse> {
  try {
    const response = await fetch('/api/ai/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        subject,
      }),
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Summary generation error:', error)
    return {
      success: false,
      error: 'Failed to generate summary. Please try again.'
    }
  }
}

// Generate quiz questions from the note content
export async function generateQuiz(content: string, subject: string, numQuestions: number = 5): Promise<AIResponse> {
  try {
    const response = await fetch('/api/ai/quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        subject,
        numQuestions,
      }),
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Quiz generation error:', error)
    return {
      success: false,
      error: 'Failed to generate quiz. Please try again.'
    }
  }
}

// Ask a question about the note content
export async function askQuestion(content: string, subject: string, question: string): Promise<AIResponse> {
  try {
    const response = await fetch('/api/ai/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        subject,
        question,
      }),
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Q&A error:', error)
    return {
      success: false,
      error: 'Failed to get answer. Please try again.'
    }
  }
}
