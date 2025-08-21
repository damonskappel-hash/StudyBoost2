import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createNote = mutation({
  args: {
    title: v.string(),
    originalContent: v.string(),
    subject: v.optional(v.string()),
    fileId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
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
    const noteId = await ctx.db.insert("notes", {
      userId: user._id,
      title: args.title,
      originalContent: args.originalContent,
      subject: args.subject,
      fileId: args.fileId,
      fileName: args.fileName,
      fileType: args.fileType,
      enhancementStatus: "pending",
      enhancementSettings: args.enhancementSettings,
      wordCount: args.originalContent.split(/\s+/).length,
      createdAt: now,
      updatedAt: now,
    });

    return noteId;
  },
});

export const updateNoteContent = mutation({
  args: {
    noteId: v.id("notes"),
    enhancedContent: v.string(),
    processingTime: v.optional(v.number()),
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

    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== user._id) {
      throw new Error("Note not found or access denied");
    }

    await ctx.db.patch(args.noteId, {
      enhancedContent: args.enhancedContent,
      enhancementStatus: "completed",
      processingTime: args.processingTime,
      updatedAt: Date.now(),
    });
  },
});

export const updateEnhancementStatus = mutation({
  args: {
    noteId: v.id("notes"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
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

    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== user._id) {
      throw new Error("Note not found or access denied");
    }

    await ctx.db.patch(args.noteId, {
      enhancementStatus: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const getNotesByUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const getNoteById = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!user) {
      return null;
    }

    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== user._id) {
      return null;
    }

    return note;
  },
});

export const deleteNote = mutation({
  args: { noteId: v.id("notes") },
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

    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== user._id) {
      throw new Error("Note not found or access denied");
    }

    await ctx.db.delete(args.noteId);
  },
});

export const getNotesByStatus = query({
  args: { status: v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("completed"),
    v.literal("failed")
  ) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("notes")
      .withIndex("by_status", (q) => q.eq("enhancementStatus", args.status))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .order("desc")
      .collect();
  },
});
