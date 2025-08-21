import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createUser = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (existingUser) {
      return existingUser._id; // Return existing user ID
    }

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      email: args.email,
      name: args.name,
      subscriptionTier: "free",
      subscriptionStatus: "active",
      monthlyNotesUsed: 0,
      resetDate: now,
      createdAt: now,
      updatedAt: now,
    });

    // Create default subscription
    await ctx.db.insert("subscriptions", {
      userId,
      tier: "free",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

export const getUserByClerkId = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
  },
});

export const updateSubscription = mutation({
  args: {
    clerkUserId: v.string(),
    tier: v.union(
      v.literal("free"),
      v.literal("student"),
      v.literal("premium")
    ),
    status: v.string(),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Update user subscription
    await ctx.db.patch(user._id, {
      subscriptionTier: args.tier,
      subscriptionStatus: args.status as any,
      updatedAt: Date.now(),
    });

    // Update or create subscription record
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (subscription) {
      await ctx.db.patch(subscription._id, {
        tier: args.tier,
        status: args.status,
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("subscriptions", {
        userId: user._id,
        tier: args.tier,
        status: args.status,
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

export const resetMonthlyUsage = mutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      monthlyNotesUsed: 0,
      resetDate: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const checkUsageLimit = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (!user) {
      return { canUse: false, reason: "User not found" };
    }

    const limits = {
      free: 5,
      student: 1000,
      premium: 10000,
    };

    const limit = limits[user.subscriptionTier];
    const canUse = user.monthlyNotesUsed < limit;

    return {
      canUse,
      currentUsage: user.monthlyNotesUsed,
      limit,
      tier: user.subscriptionTier,
    };
  },
});

export const incrementUserUsage = mutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      monthlyNotesUsed: user.monthlyNotesUsed + 1,
      updatedAt: Date.now(),
    });
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const cleanupDuplicateUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const clerkUserIds = new Set<string>();
    const usersToDelete: string[] = [];

    // Find duplicates
    for (const user of allUsers) {
      if (clerkUserIds.has(user.clerkUserId)) {
        usersToDelete.push(user._id);
      } else {
        clerkUserIds.add(user.clerkUserId);
      }
    }

    // Delete duplicates
    for (const userId of usersToDelete) {
      await ctx.db.delete(userId);
    }

    return { deleted: usersToDelete.length };
  },
});
