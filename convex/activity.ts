import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function toDay(ts: number): string {
  const d = new Date(ts);
  // Use UTC date to avoid TZ edge cases for daily streaks
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const logActivity = mutation({
  args: {
    kind: v.union(v.literal("enhance"), v.literal("review"), v.literal("quiz")),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const now = Date.now();
    await ctx.db.insert("activity", {
      userId: user._id,
      kind: args.kind,
      count: args.count ?? 1,
      createdAt: now,
      day: toDay(now),
    });
  },
});

export const getStreakAndGoals = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { streak: 0, goalsMet: 0, goalsTotal: 0 };

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();
    if (!user) return { streak: 0, goalsMet: 0, goalsTotal: 0 };

    // Fetch last 30 days of activity
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const recent = await ctx.db
      .query("activity")
      .withIndex("by_user_time", (q) => q.eq("userId", user._id))
      .filter((q) => q.gte(q.field("createdAt"), thirtyDaysAgo))
      .order("desc")
      .collect();

    // Group by day
    const days = new Map<string, { enhance: number; review: number; quiz: number }>();
    for (const ev of recent) {
      const bucket = days.get(ev.day) ?? { enhance: 0, review: 0, quiz: 0 };
      if (ev.kind === "enhance") bucket.enhance += ev.count;
      if (ev.kind === "review") bucket.review += ev.count;
      if (ev.kind === "quiz") bucket.quiz += ev.count;
      days.set(ev.day, bucket);
    }

    // Compute streak: consecutive days from today backwards with any activity
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const t = now - i * 24 * 60 * 60 * 1000;
      const d = toDay(t);
      if (days.has(d)) streak++;
      else break;
    }

    // Goals (simple defaults):
    // - Daily goal: at least 1 review or 1 enhance
    // - Weekly goal: at least 3 study days in the last 7 days
    // We return a single "goalsMet" count out of total goals for the dashboard.
    const today = toDay(now);
    const todayHasActivity = days.has(today);

    // Last 7 days active count
    let activeDays7 = 0;
    for (let i = 0; i < 7; i++) {
      const t = now - i * 24 * 60 * 60 * 1000;
      const d = toDay(t);
      if (days.has(d)) activeDays7++;
    }

    const goals = [
      { met: todayHasActivity },
      { met: activeDays7 >= 3 },
    ];
    const goalsMet = goals.filter((g) => g.met).length;
    const goalsTotal = goals.length;

    return { streak, goalsMet, goalsTotal };
  },
});


