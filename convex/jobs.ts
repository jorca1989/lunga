import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new cleanup job linked to a report (triggered by Supervisor/Admin approval)
export const create = mutation({
  args: {
    reportId: v.id("reports"),
    userId: v.id("users"), // Supervisor who approved it
  },
  handler: async (ctx: any, args: any) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Ocorrência não encontrada.");

    // Update report status to "Em Análise"
    await ctx.db.patch(args.reportId, {
      status: "Em Análise",
    });

    // Log the action in the audit trail
    await ctx.db.insert("auditLogs", {
      reportId: args.reportId,
      userId: args.userId,
      action: "Em Análise",
      notes: "Ocorrência aprovada e adicionada ao mercado de limpeza.",
      createdAt: Date.now(),
    });

    // Insert cleanup job
    const jobId = await ctx.db.insert("cleanupJobs", {
      reportId: args.reportId,
      status: "Pendente",
    });

    return jobId;
  },
});

// List cleanup jobs
export const list = query({
  args: {
    operatorId: v.optional(v.id("users")),
    status: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    let jobs = [];
    if (args.operatorId) {
      jobs = await ctx.db
        .query("cleanupJobs")
        .withIndex("by_operator", (q: any) => q.eq("operatorId", args.operatorId))
        .collect();
    } else {
      jobs = await ctx.db.query("cleanupJobs").collect();
    }

    // Filter by status if requested
    if (args.status) {
      jobs = jobs.filter((j: any) => j.status === args.status);
    }

    // Populate report details for each job
    const jobsWithDetails = await Promise.all(
      jobs.map(async (job: any) => {
        const report = await ctx.db.get(job.reportId);
        let reporterName = "Cidadão";
        if (report) {
          const reporter = await ctx.db.get(report.userId);
          if (reporter) {
            reporterName = reporter.name;
          }
        }
        return {
          ...job,
          report: report ? {
            ...report,
            reporterName,
          } : null,
        };
      })
    );

    return jobsWithDetails;
  },
});

// Operator accepts a cleanup job
export const accept = mutation({
  args: {
    jobId: v.id("cleanupJobs"),
    operatorId: v.id("users"),
  },
  handler: async (ctx: any, args: any) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Trabalho não encontrado.");

    const operator = await ctx.db.get(args.operatorId);
    if (!operator || operator.role !== "operator") {
      throw new Error("Apenas operadores podem aceitar trabalhos.");
    }

    // Update job status
    await ctx.db.patch(args.jobId, {
      operatorId: args.operatorId,
      status: "Aceito",
      assignedAt: Date.now(),
      beforeImage: job.beforeImage || "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600",
    });

    // Update report status
    await ctx.db.patch(job.reportId, {
      status: "Em Progresso",
    });

    // Log audit action
    await ctx.db.insert("auditLogs", {
      reportId: job.reportId,
      userId: args.operatorId,
      action: "Em Progresso",
      notes: `Trabalho de limpeza aceite pelo operador ${operator.name}.`,
      createdAt: Date.now(),
    });
  },
});

// Operator completes a cleanup job (submitting evidence)
export const complete = mutation({
  args: {
    jobId: v.id("cleanupJobs"),
    operatorId: v.id("users"),
    afterImage: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Trabalho não encontrado.");

    if (job.operatorId !== args.operatorId) {
      throw new Error("Apenas o operador designado pode concluir este trabalho.");
    }

    // Update job status
    await ctx.db.patch(args.jobId, {
      status: "Concluído",
      afterImage: args.afterImage,
      completedAt: Date.now(),
    });

    // Log audit action
    await ctx.db.insert("auditLogs", {
      reportId: job.reportId,
      userId: args.operatorId,
      action: "Concluído",
      notes: "Trabalho concluído pelo operador. Evidência enviada para validação.",
      createdAt: Date.now(),
    });
  },
});

// Supervisor validates cleanup job completion
export const validate = mutation({
  args: {
    jobId: v.id("cleanupJobs"),
    supervisorId: v.id("users"),
    approved: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Trabalho não encontrado.");

    const supervisor = await ctx.db.get(args.supervisorId);
    if (!supervisor || (supervisor.role !== "supervisor" && supervisor.role !== "admin")) {
      throw new Error("Apenas supervisores ou administradores podem validar trabalhos.");
    }

    if (args.approved) {
      // Update job
      await ctx.db.patch(args.jobId, {
        status: "Validado",
        validatedAt: Date.now(),
      });

      // Update report status to Resolved
      await ctx.db.patch(job.reportId, {
        status: "Resolvido",
      });

      // Award reputation to citizen (original reporter)
      const report = await ctx.db.get(job.reportId);
      if (report) {
        const reporter = await ctx.db.get(report.userId);
        if (reporter) {
          await ctx.db.patch(report.userId, {
            reputation: reporter.reputation + 50, // Citizen gets 50 points
          });
        }
      }

      // Award reputation to operator
      if (job.operatorId) {
        const operator = await ctx.db.get(job.operatorId);
        if (operator) {
          await ctx.db.patch(job.operatorId, {
            reputation: operator.reputation + 30, // Operator gets 30 points
          });
        }
      }

      // Log audit action
      await ctx.db.insert("auditLogs", {
        reportId: job.reportId,
        userId: args.supervisorId,
        action: "Resolvido",
        notes: args.notes || "Limpeza validada pelo supervisor. Ocorrência resolvida com sucesso.",
        createdAt: Date.now(),
      });
    } else {
      // Rejected work goes back to Em Progresso (Aceito status for operator)
      await ctx.db.patch(args.jobId, {
        status: "Aceito",
      });

      await ctx.db.patch(job.reportId, {
        status: "Em Progresso",
      });

      // Log audit action
      await ctx.db.insert("auditLogs", {
        reportId: job.reportId,
        userId: args.supervisorId,
        action: "Em Progresso",
        notes: `Evidência rejeitada pelo supervisor: ${args.notes || "Sem comentários"}`,
        createdAt: Date.now(),
      });
    }
  },
});
