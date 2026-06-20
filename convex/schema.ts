import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    avatar: v.string(),
    role: v.string(), // "citizen" | "operator" | "supervisor" | "admin"
    reputation: v.number(),
    badges: v.array(v.string()),
    tenantId: v.optional(v.string()),
    phoneNumber: v.string(),
    clerkId: v.optional(v.string()), // Clerk user ID for real auth
  }).index("by_phoneNumber", ["phoneNumber"])
    .index("by_clerkId", ["clerkId"]),

  reports: defineTable({
    tenantId: v.string(), // Multi-tenant isolation ID (e.g., "luanda", "cazenga")
    userId: v.id("users"),
    category: v.string(), // "Lixo", "Buracos", "Água", "Energia", "Segurança", "Outro"
    title: v.string(),
    description: v.string(),
    image: v.string(),
    images: v.optional(v.array(v.string())),
    videos: v.optional(v.array(v.string())),
    location: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    status: v.string(), // "Aberto" | "Em Análise" | "Em Progresso" | "Resolvido"
    likes: v.number(),
    commentsCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_and_category", ["tenantId", "category"])
    .index("by_tenant_and_status", ["tenantId", "status"]),

  comments: defineTable({
    reportId: v.id("reports"),
    userId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_report", ["reportId"]),

  likes: defineTable({
    reportId: v.id("reports"),
    userId: v.id("users"),
  }).index("by_report_and_user", ["reportId", "userId"]),

  follows: defineTable({
    reportId: v.id("reports"),
    userId: v.id("users"),
  }).index("by_report_and_user", ["reportId", "userId"]),

  auditLogs: defineTable({
    reportId: v.id("reports"),
    userId: v.id("users"), // Author/actor of the change
    action: v.string(), // e.g., "Criado", "Em Análise", "Atribuído", "Em Progresso", "Resolvido", "Rejeitado"
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_report", ["reportId"]),

  cleanupJobs: defineTable({
    reportId: v.id("reports"),
    operatorId: v.optional(v.id("users")),
    status: v.string(), // "Pendente" | "Aceito" | "Concluído" | "Validado"
    beforeImage: v.optional(v.string()),
    afterImage: v.optional(v.string()),
    assignedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    validatedAt: v.optional(v.number()),
  }).index("by_report", ["reportId"])
    .index("by_operator", ["operatorId"]),
});
