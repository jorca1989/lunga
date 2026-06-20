import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getSystemStats = query({
  args: { tenantId: v.optional(v.string()) },
  handler: async (ctx: any, args: any) => {
    let reportsQuery = ctx.db.query("reports");
    if (args.tenantId) {
      reportsQuery = reportsQuery.withIndex("by_tenant", (q: any) => q.eq("tenantId", args.tenantId!));
    }
    const reports = await reportsQuery.collect();

    let open = 0;
    let analysis = 0;
    let progress = 0;
    let resolved = 0;

    reports.forEach((r: any) => {
      if (r.status === "Aberto") open++;
      else if (r.status === "Em Análise") analysis++;
      else if (r.status === "Em Progresso") progress++;
      else if (r.status === "Resolvido") resolved++;
    });

    // Calculate average resolution time (in hours)
    const resolvedReports = reports.filter((r: any) => r.status === "Resolvido");
    
    const resolutionTimes = await Promise.all(
      resolvedReports.slice(0, 50).map(async (r: any) => {
        const logs = await ctx.db
          .query("auditLogs")
          .withIndex("by_report", (q: any) => q.eq("reportId", r._id))
          .collect();
        const resolveLog = logs.find((l: any) => l.action === "Resolvido");
        if (resolveLog) {
          return (resolveLog.createdAt - r.createdAt) / (1000 * 60 * 60); // hours
        }
        return 24; // fallback 24 hours
      })
    );

    const avgResolutionTime =
      resolutionTimes.length > 0
        ? resolutionTimes.reduce((a: any, b: any) => a + b, 0) / resolutionTimes.length
        : 18.5; // fallback avg 18.5 hours

    const users = await ctx.db.query("users").collect();
    const citizens = users.filter((u: any) => u.role === "citizen").length;
    const operators = users.filter((u: any) => u.role === "operator").length;
    const supervisors = users.filter((u: any) => u.role === "supervisor").length;

    return {
      totalReports: reports.length,
      statusCounts: {
        open,
        analysis,
        progress,
        resolved,
      },
      avgResolutionTime: parseFloat(avgResolutionTime.toFixed(1)),
      responseTime: 1.2, // mock response time: 1.2 hours
      userCounts: {
        total: users.length,
        citizens,
        operators,
        supervisors,
      },
    };
  },
});

export const listAllUsers = query({
  args: {},
  handler: async (ctx: any) => {
    return await ctx.db.query("users").collect();
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.string(),
    tenantId: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    await ctx.db.patch(args.userId, {
      role: args.role,
      tenantId: args.tenantId,
    });
  },
});
