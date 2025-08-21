export const OPENAI_CONFIG = {
  // Default model for cost-effective testing
  DEFAULT_MODEL: "gpt-3.5-turbo",
  
  // Alternative models
  MODELS: {
    "gpt-3.5-turbo": {
      name: "GPT-3.5 Turbo",
      maxInputTokens: 12000,
      maxOutputTokens: 3000,
      costPer1kTokens: 0.0015, // Input tokens
      costPer1kOutputTokens: 0.002, // Output tokens
      description: "Fast and cost-effective for testing"
    },
    "gpt-4": {
      name: "GPT-4",
      maxInputTokens: 8000,
      maxOutputTokens: 2000,
      costPer1kTokens: 0.03, // Input tokens
      costPer1kOutputTokens: 0.06, // Output tokens
      description: "Higher quality but more expensive"
    },
    "gpt-4-turbo": {
      name: "GPT-4 Turbo",
      maxInputTokens: 128000,
      maxOutputTokens: 4000,
      costPer1kTokens: 0.01, // Input tokens
      costPer1kOutputTokens: 0.03, // Output tokens
      description: "Best balance of quality and cost"
    }
  }
}

export function getModelConfig(modelName?: string) {
  const model = modelName || process.env.OPENAI_MODEL || OPENAI_CONFIG.DEFAULT_MODEL
  return OPENAI_CONFIG.MODELS[model as keyof typeof OPENAI_CONFIG.MODELS] || OPENAI_CONFIG.MODELS["gpt-3.5-turbo"]
}
