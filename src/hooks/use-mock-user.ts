/**
 * Backwards-compat re-export — all screens that import useMockUser
 * now transparently get the real Clerk-backed identity.
 */
export { useClerkUser as useMockUser } from './use-clerk-user';
export type { UserProfile } from './use-clerk-user';
