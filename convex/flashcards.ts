import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Spaced repetition intervals (in days) based on difficulty
const INTERVALS = {
  easy: [1, 3, 7, 14, 30, 90, 180, 365],
  medium: [1, 2, 4, 8, 16, 32, 64, 128],
  hard: [1, 1, 2, 4, 8, 16, 32, 64]
};

// Create flashcards from a note
export const createFlashcards = mutation({
  args: {
    noteId: v.id("notes"),
    subject: v.string(),
    flashcards: v.array(v.object({
      question: v.string(),
      answer: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the note
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error("Note not found");
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the note content for flashcard generation
    const content = note.enhancedContent || note.originalContent;
    const subject = note.subject || 'General';
    
    // Note: Flashcard generation is now handled by the client calling the action directly
    // This mutation expects the flashcards to be passed in the args
    if (!args.flashcards || !Array.isArray(args.flashcards)) {
      throw new Error('Flashcards array is required');
    }
    
    const flashcards = args.flashcards;

    // Create flashcards in database
    const now = Date.now();
    const createdFlashcards = [];

    for (const flashcard of flashcards) {
      const flashcardId = await ctx.db.insert("flashcards", {
        userId: user._id,
        noteId: args.noteId,
        subject: args.subject,
        question: flashcard.question,
        answer: flashcard.answer,
        difficulty: "medium", // Default difficulty
        nextReview: now, // Review immediately
        interval: 1, // Start with 1 day
        reviewCount: 0,
        consecutiveCorrect: 0,
        lastReviewed: undefined,
        createdAt: now,
        updatedAt: now,
      });
      createdFlashcards.push(flashcardId);
    }

    return createdFlashcards;
  },
});

// Get flashcards due for review
export const getDueFlashcards = query({
  args: {
    subject: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    let query = ctx.db
      .query("flashcards")
      .withIndex("by_next_review", (q) => 
        q.eq("userId", user._id).lte("nextReview", now)
      );

    if (args.subject) {
      query = ctx.db
        .query("flashcards")
        .withIndex("by_subject", (q) => 
          q.eq("userId", user._id).eq("subject", args.subject)
        );
    }

    const flashcards = await query.collect();

    // When a subject is specified, return all flashcards in that subject (not just due ones)
    if (args.subject) {
      return flashcards;
    }

    // When no subject is specified, return only due flashcards
    return flashcards;
  },
});

// Get all flashcards for a user
export const getAllFlashcards = query({
  args: {
    subject: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    if (args.subject) {
      return await ctx.db
        .query("flashcards")
        .withIndex("by_subject", (q) => 
          q.eq("userId", user._id).eq("subject", args.subject)
        )
        .collect();
    }

    return await ctx.db
      .query("flashcards")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

// Review a flashcard
export const reviewFlashcard = mutation({
  args: {
    flashcardId: v.id("flashcards"),
    isCorrect: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const flashcard = await ctx.db.get(args.flashcardId);
    if (!flashcard) {
      throw new Error("Flashcard not found");
    }

    const now = Date.now();
    
    if (args.isCorrect) {
      // User got it correct - move to next interval
      const intervals = INTERVALS[flashcard.difficulty];
      const currentIntervalIndex = Math.min(flashcard.reviewCount, intervals.length - 1);
      const newInterval = intervals[currentIntervalIndex];
      const nextReview = now + (newInterval * 24 * 60 * 60 * 1000);
      
      // Update consecutive correct count
      const consecutiveCorrect = flashcard.consecutiveCorrect + 1;
      
      // If user has been getting it correct consistently, consider making it easier
      let newDifficulty = flashcard.difficulty;
      if (consecutiveCorrect >= 3 && flashcard.difficulty === "hard") {
        newDifficulty = "medium";
      } else if (consecutiveCorrect >= 5 && flashcard.difficulty === "medium") {
        newDifficulty = "easy";
      }

      await ctx.db.patch(args.flashcardId, {
        difficulty: newDifficulty,
        nextReview,
        interval: newInterval,
        reviewCount: flashcard.reviewCount + 1,
        consecutiveCorrect,
        lastReviewed: now,
        updatedAt: now,
      });
    } else {
      // User got it wrong - reset to immediate review and reset streak
      await ctx.db.patch(args.flashcardId, {
        difficulty: "hard", // Reset to hard difficulty
        nextReview: now, // Review immediately
        interval: 1, // Reset to 1 day interval
        reviewCount: flashcard.reviewCount + 1,
        consecutiveCorrect: 0, // Reset streak
        lastReviewed: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

// Get flashcard statistics
export const getFlashcardStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const flashcards = await ctx.db
      .query("flashcards")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const now = Date.now();
    const dueCards = flashcards.filter(card => card.nextReview <= now);
    const totalReviews = flashcards.reduce((sum, card) => sum + card.reviewCount, 0);
    const avgConsecutiveCorrect = flashcards.length > 0 
      ? flashcards.reduce((sum, card) => sum + card.consecutiveCorrect, 0) / flashcards.length 
      : 0;

    // Group by subject
    const subjectStats = flashcards.reduce((acc, card) => {
      if (!acc[card.subject]) {
        acc[card.subject] = {
          total: 0,
          due: 0,
          reviews: 0,
        };
      }
      acc[card.subject].total++;
      if (card.nextReview <= now) acc[card.subject].due++;
      acc[card.subject].reviews += card.reviewCount;
      return acc;
    }, {} as Record<string, any>);

    return {
      totalCards: flashcards.length,
      dueCards: dueCards.length,
      totalReviews,
      avgConsecutiveCorrect: Math.round(avgConsecutiveCorrect * 10) / 10,
      subjectStats,
    };
  },
});

// Delete a flashcard
export const deleteFlashcard = mutation({
  args: {
    flashcardId: v.id("flashcards"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.delete(args.flashcardId);
    return { success: true };
  },
});



// Delete all flashcards for a user
export const deleteAllFlashcards = mutation({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get all flashcards for the user
    const flashcards = await ctx.db
      .query("flashcards")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Delete all flashcards
    for (const flashcard of flashcards) {
      await ctx.db.delete(flashcard._id);
    }

    return { success: true, deletedCount: flashcards.length };
  },
});
