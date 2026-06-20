/**
 * useClerkUser — replaces useMockUser with real Clerk + Convex identity.
 *
 * On every sign-in this hook:
 * 1. Reads the Clerk user object (id, name, imageUrl, email).
 * 2. Calls getOrCreateClerkUser to upsert the matching Convex `users` row.
 * 3. Fetches the full live Convex profile and returns it.
 *
 * Falls back to the DEFAULT_USER shape if Clerk is not yet loaded.
 */
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/expo";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";

export interface UserProfile {
  _id: any;
  name: string;
  avatar: string;
  reputation: number;
  badges: string[];
  phoneNumber: string;
  role: string;
  tenantId?: string;
  clerkId?: string;
  isLoading?: boolean;
}

const GUEST_USER: UserProfile = {
  _id: "dummy-user-id" as any,
  name: "Cidadão",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  reputation: 0,
  badges: [],
  phoneNumber: "",
  role: "citizen",
};

export function useClerkUser(): UserProfile {
  const { user, isLoaded } = useUser();
  const [convexUserId, setConvexUserId] = useState<any>(null);

  const getOrCreate = useMutation(api.users.getOrCreateClerkUser);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const primaryEmail = user.primaryEmailAddress?.emailAddress || "";
    const name = user.fullName || user.firstName || "Cidadão";
    const avatar = user.imageUrl || GUEST_USER.avatar;

    getOrCreate({
      clerkId: user.id,
      name,
      avatar,
      email: primaryEmail,
    })
      .then((id) => setConvexUserId(id))
      .catch((err) => console.error("Failed to sync Clerk user:", err));
  }, [isLoaded, user?.id, user?.imageUrl, user?.fullName, user?.primaryEmailAddress?.emailAddress]);

  const liveUser = useQuery(
    api.users.getUser,
    convexUserId ? { userId: convexUserId } : "skip"
  ) as any;

  if (liveUser) {
    return { ...liveUser, isLoading: false } as UserProfile;
  }

  if (!isLoaded || !user) {
    return { ...GUEST_USER, _id: convexUserId || GUEST_USER._id, isLoading: !isLoaded };
  }

  return {
    ...GUEST_USER,
    _id: convexUserId || GUEST_USER._id,
    name: user.fullName || user.firstName || "Cidadão",
    avatar: user.imageUrl || GUEST_USER.avatar,
    clerkId: user.id,
    isLoading: true,
  };
}
