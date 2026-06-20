import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// List all comments for a report
export const list = query({
  args: { reportId: v.id("reports") },
  handler: async (ctx: any, args: any) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_report", (q: any) => q.eq("reportId", args.reportId))
      .order("asc")
      .collect();

    // Fetch details of each comment's author
    return await Promise.all(
      comments.map(async (comment: any) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          user: user
            ? {
                name: user.name,
                avatar: user.avatar,
                role: user.role,
              }
            : {
                name: "Anónimo",
                avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
                role: "citizen",
              },
        };
      })
    );
  },
});

// Add a comment to a report
export const add = mutation({
  args: {
    reportId: v.id("reports"),
    userId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    // 1. Get the report
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Ocorrência não encontrada.");

    // 2. Add the comment
    await ctx.db.insert("comments", {
      reportId: args.reportId,
      userId: args.userId,
      content: args.content,
      createdAt: Date.now(),
    });

    // 3. Update the comments counter on the report
    await ctx.db.patch(args.reportId, {
      commentsCount: report.commentsCount + 1,
    });

    // 4. Award a small amount of reputation points for discussion (+2 points)
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        reputation: user.reputation + 2,
      });
    }
  },
});
