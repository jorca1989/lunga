import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Check if a user has liked a report
export const check = query({
  args: {
    reportId: v.id("reports"),
    userId: v.id("users"),
  },
  handler: async (ctx: any, args: any) => {
    const existing = await ctx.db
      .query("likes")
      .withIndex("by_report_and_user", (q: any) =>
        q.eq("reportId", args.reportId).eq("userId", args.userId)
      )
      .unique();
    return !!existing;
  },
});

// Toggle report like status
export const toggle = mutation({
  args: {
    reportId: v.id("reports"),
    userId: v.id("users"),
  },
  handler: async (ctx: any, args: any) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Ocorrência não encontrada.");

    const existing = await ctx.db
      .query("likes")
      .withIndex("by_report_and_user", (q: any) =>
        q.eq("reportId", args.reportId).eq("userId", args.userId)
      )
      .unique();

    if (existing) {
      // 1. Remove like record
      await ctx.db.delete(existing._id);
      // 2. Decrement likes count
      await ctx.db.patch(args.reportId, {
        likes: Math.max(0, report.likes - 1),
      });
      return { liked: false };
    } else {
      // 1. Add like record
      await ctx.db.insert("likes", {
        reportId: args.reportId,
        userId: args.userId,
      });
      // 2. Increment likes count
      await ctx.db.patch(args.reportId, {
        likes: report.likes + 1,
      });
      // 3. Award +1 reputation to the reporter for the upvote
      const reporter = await ctx.db.get(report.userId);
      if (reporter && reporter._id !== args.userId) {
        await ctx.db.patch(report.userId, {
          reputation: reporter.reputation + 1,
        });
      }
      return { liked: true };
    }
  },
});
