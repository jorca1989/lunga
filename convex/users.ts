import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get user profile details
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.get(args.userId);
  },
});

// Mock Auth: Get or create default citizen user for testing
export const getOrCreateMockUser = mutation({
  args: {
    phoneNumber: v.string(),
    name: v.string(),
    avatar: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_phoneNumber", (q: any) => q.eq("phoneNumber", args.phoneNumber))
      .unique();

    if (existing) {
      return existing._id;
    }

    // Create a new citizen user
    const newUserId = await ctx.db.insert("users", {
      name: args.name,
      avatar: args.avatar,
      role: "citizen",
      reputation: 120, // default starting reputation
      badges: ["Primeiro Alerta", "Caçador de Lixo"],
      phoneNumber: args.phoneNumber,
    });

    return newUserId;
  },
});

// Clerk Auth: Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

// Clerk Auth: Get or create user from Clerk identity (call on every sign-in)
export const getOrCreateClerkUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    avatar: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { name: args.name, avatar: args.avatar });
      return existing._id;
    }

    const newUserId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      avatar: args.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      role: "citizen",
      reputation: 0,
      badges: ["Primeiro Alerta"],
      phoneNumber: args.email || args.clerkId,
    });

    return newUserId;
  },
});

// Update reputation score
export const addReputationPoints = mutation({
  args: {
    userId: v.id("users"),
    points: v.number(),
  },
  handler: async (ctx: any, args: any) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Usuário não encontrado.");

    await ctx.db.patch(args.userId, {
      reputation: Math.max(0, user.reputation + args.points),
    });
  },
});

// Unlock a badge
export const unlockBadge = mutation({
  args: {
    userId: v.id("users"),
    badgeName: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Usuário não encontrado.");

    if (user.badges.includes(args.badgeName)) return;

    await ctx.db.patch(args.userId, {
      badges: [...user.badges, args.badgeName],
    });
  },
});

// Update user role (useful for testing different user experiences)
export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.string(), // "citizen" | "operator" | "supervisor" | "admin"
  },
  handler: async (ctx: any, args: any) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Usuário não encontrado.");

    await ctx.db.patch(args.userId, {
      role: args.role,
    });
  },
});
