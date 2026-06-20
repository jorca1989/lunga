import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// List all reports, filtered by tenant ID and optionally category
export const list = query({
  args: {
    tenantId: v.string(),
    category: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx: any, args: any) => {
    const q = ctx.db
      .query("reports")
      .withIndex("by_tenant", (dbQ: any) => dbQ.eq("tenantId", args.tenantId));

    let reports = await q.order("desc").collect();

    if (args.category && args.category !== "Tudo") {
      reports = reports.filter((r: any) => {
        if (!r.category) return false;
        const cats = r.category.split(",").map((c: string) => c.trim());
        return cats.includes(args.category!);
      });
    }

    // Fetch the user information for each report
    const reportsWithUsers = await Promise.all(
      reports.map(async (report: any) => {
        const user = await ctx.db.get(report.userId);

        // Check if liked by the current user
        let liked = false;
        if (args.userId) {
          const likeRecord = await ctx.db
            .query("likes")
            .withIndex("by_report_and_user", (q: any) =>
              q.eq("reportId", report._id).eq("userId", args.userId!)
            )
            .unique();
          liked = !!likeRecord;
        }

        // Check if followed by the current user
        let followed = false;
        if (args.userId) {
          const followRecord = await ctx.db
            .query("follows")
            .withIndex("by_report_and_user", (q: any) =>
              q.eq("reportId", report._id).eq("userId", args.userId!)
            )
            .unique();
          followed = !!followRecord;
        }

        return {
          ...report,
          liked,
          followed,
          user: user
            ? {
                name: user.name,
                avatar: user.avatar,
                reputation: user.reputation,
              }
            : {
                name: "Anónimo",
                avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
                reputation: 0,
              },
        };
      })
    );

    return reportsWithUsers;
  },
});

// Get detailed information of a single report
export const get = query({
  args: { reportId: v.id("reports") },
  handler: async (ctx: any, args: any) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) return null;

    const user = await ctx.db.get(report.userId);
    return {
      ...report,
      user: user
        ? {
            name: user.name,
            avatar: user.avatar,
            reputation: user.reputation,
          }
        : {
            name: "Anónimo",
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
            reputation: 0,
          },
    };
  },
});

// Create a new citizen report
export const create = mutation({
  args: {
    tenantId: v.string(),
    userId: v.id("users"),
    category: v.string(),
    title: v.string(),
    description: v.string(),
    image: v.string(),
    images: v.optional(v.array(v.string())),
    videos: v.optional(v.array(v.string())),
    location: v.string(),
    latitude: v.number(),
    longitude: v.number(),
  },
  handler: async (ctx: any, args: any) => {
    // 1. Insert the report
    const reportId = await ctx.db.insert("reports", {
      tenantId: args.tenantId,
      userId: args.userId,
      category: args.category,
      title: args.title,
      description: args.description,
      image: args.image,
      images: args.images,
      videos: args.videos,
      location: args.location,
      latitude: args.latitude,
      longitude: args.longitude,
      status: "Aberto",
      likes: 0,
      commentsCount: 0,
      createdAt: Date.now(),
    });

    // 2. Insert initial audit log
    await ctx.db.insert("auditLogs", {
      reportId: reportId,
      userId: args.userId,
      action: "Criado",
      notes: "Ocorrência registada pelo cidadão.",
      createdAt: Date.now(),
    });

    // 3. Award reputation points to the reporting citizen
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        reputation: user.reputation + 15, // +15 points for submitting a verified report
      });
    }

    return reportId;
  },
});

// Update the status of a report (for Operators, Supervisors, and Admins)
export const updateStatus = mutation({
  args: {
    reportId: v.id("reports"),
    status: v.string(), // "Aberto" | "Em Análise" | "Em Progresso" | "Resolvido" | "Rejeitado"
    userId: v.id("users"), // The actor changing the status
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Ocorrência não encontrada.");

    await ctx.db.patch(args.reportId, {
      status: args.status,
    });

    // Log in the audit trail
    await ctx.db.insert("auditLogs", {
      reportId: args.reportId,
      userId: args.userId,
      action: args.status,
      notes: args.notes || `Estado da ocorrência alterado para ${args.status}.`,
      createdAt: Date.now(),
    });

    // If resolved, award further points to the reporter
    if (args.status === "Resolvido") {
      const reporter = await ctx.db.get(report.userId);
      if (reporter) {
        await ctx.db.patch(report.userId, {
          reputation: reporter.reputation + 50, // +50 points for a successfully resolved ticket
        });
      }
    }
  },
});

// Get audit log history of a report
export const history = query({
  args: { reportId: v.id("reports") },
  handler: async (ctx: any, args: any) => {
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_report", (q: any) => q.eq("reportId", args.reportId))
      .collect();

    // Populate user names for the audit logs
    const logsWithUser = await Promise.all(
      logs.map(async (log: any) => {
        const user = await ctx.db.get(log.userId);
        return {
          ...log,
          userName: user ? user.name : "Sistema / Anónimo",
          userRole: user ? user.role : "system",
        };
      })
    );

    return logsWithUser.sort((a: any, b: any) => b.createdAt - a.createdAt); // Newest first
  },
});

// Edit a report's title and description
export const edit = mutation({
  args: {
    reportId: v.id("reports"),
    userId: v.id("users"),
    category: v.string(),
    description: v.string(),
    location: v.string(),
    latitude: v.number(),
    longitude: v.number(),
  },
  handler: async (ctx: any, args: any) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Ocorrência não encontrada.");

    const actor = await ctx.db.get(args.userId);
    if (report.userId !== args.userId && actor?.role !== "supervisor" && actor?.role !== "admin") {
      throw new Error("Não tem permissão para editar esta ocorrência.");
    }

    await ctx.db.patch(args.reportId, {
      category: args.category,
      description: args.description,
      location: args.location,
      latitude: args.latitude,
      longitude: args.longitude,
    });

    await ctx.db.insert("auditLogs", {
      reportId: args.reportId,
      userId: args.userId,
      action: "Editado",
      notes: "Ocorrência editada pelo cidadão (categoria, descrição ou localização alteradas).",
      createdAt: Date.now(),
    });
  },
});

// Delete a report and all its associated data
export const remove = mutation({
  args: {
    reportId: v.id("reports"),
    userId: v.id("users"),
  },
  handler: async (ctx: any, args: any) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Ocorrência não encontrada.");

    const actor = await ctx.db.get(args.userId);
    if (report.userId !== args.userId && actor?.role !== "supervisor" && actor?.role !== "admin") {
      throw new Error("Não tem permissão para eliminar esta ocorrência.");
    }

    // Delete the report itself
    await ctx.db.delete(args.reportId);

    // Delete audit logs
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_report", (q: any) => q.eq("reportId", args.reportId))
      .collect();
    for (const log of logs) {
      await ctx.db.delete(log._id);
    }

    // Delete likes
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_report", (q: any) => q.eq("reportId", args.reportId))
      .collect();
    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // Delete follows
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_report", (q: any) => q.eq("reportId", args.reportId))
      .collect();
    for (const follow of follows) {
      await ctx.db.delete(follow._id);
    }
  },
});
