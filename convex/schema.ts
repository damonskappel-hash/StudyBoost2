import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    subscriptionTier: v.union(
      v.literal("free"),
      v.literal("student"),
      v.literal("premium")
    ),
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
    monthlyNotesUsed: v.number(),
    resetDate: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_clerk_user_id", ["clerkUserId"]),

  notes: defineTable({
    userId: v.id("users"),
    title: v.string(),
    originalContent: v.string(),
    enhancedContent: v.optional(v.string()),
    subject: v.optional(v.string()),
    fileId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    enhancementStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    enhancementSettings: v.object({
      includeDefinitions: v.boolean(),
      generateQuestions: v.boolean(),
      createSummary: v.boolean(),
      addExamples: v.boolean(),
      autoGenerateFlashcards: v.optional(v.boolean()),
      structureLevel: v.union(
        v.literal("basic"),
        v.literal("detailed"),
        v.literal("comprehensive")
      ),
    }),
    processingTime: v.optional(v.number()),
    wordCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_status", ["enhancementStatus"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    tier: v.union(
      v.literal("free"),
      v.literal("student"),
      v.literal("premium")
    ),
    status: v.string(),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_stripe_customer", ["stripeCustomerId"]),

  flashcards: defineTable({
    userId: v.id("users"),
    noteId: v.id("notes"),
    subject: v.string(),
    question: v.string(),
    answer: v.string(),
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard")
    ),
    nextReview: v.number(), // timestamp for next review
    interval: v.number(), // days until next review
    reviewCount: v.number(), // number of times reviewed
    consecutiveCorrect: v.number(), // streak of correct answers
    lastReviewed: v.optional(v.number()), // timestamp of last review
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_next_review", ["userId", "nextReview"])
    .index("by_subject", ["userId", "subject"]),

  // Activity tracking for streaks and goals
  activity: defineTable({
    userId: v.id("users"),
    kind: v.union(
      v.literal("enhance"),
      v.literal("review"),
      v.literal("quiz")
    ),
    count: v.number(),
    createdAt: v.number(),
    // Stored as YYYY-MM-DD for easier day grouping
    day: v.string(),
  })
    .index("by_user", ["userId"]) 
    .index("by_user_day", ["userId", "day"]) 
    .index("by_user_time", ["userId", "createdAt"]),
});
