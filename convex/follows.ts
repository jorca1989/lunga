import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Check if a user is following a report
export const check = query({
  args: {
    reportId: v.id("reports"),
    userId: v.id("users"),
  },
  handler: async (ctx: any, args: any) => {
    const existing = await ctx.db
      .query("follows")
      .withIndex("by_report_and_user", (q: any) =>
        q.eq("reportId", args.reportId).eq("userId", args.userId)
      )
      .unique();
    return !!existing;
  },
});

// Toggle report follow status
export const toggle = mutation({
  args: {
    reportId: v.id("reports"),
    userId: v.id("users"),
  },
  handler: async (ctx: any, args: any) => {
    const existing = await ctx.db
      .query("follows")
      .withIndex("by_report_and_user", (q: any) =>
        q.eq("reportId", args.reportId).eq("userId", args.userId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { followed: false };
    } else {
      await ctx.db.insert("follows", {
        reportId: args.reportId,
        userId: args.userId,
      });
      return { followed: true };
    }
  },
});
