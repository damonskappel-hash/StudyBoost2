import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useToast } from "./use-toast";

export function useSubscription() {
  const toast = useToast();
  const usageLimit = useQuery(api.users.checkUsageLimit, { clerkUserId: "" }); // Will be set by component
  const createUser = useMutation(api.users.createUser);
  const updateSubscription = useMutation(api.users.updateSubscription);
  const incrementUsage = useMutation(api.users.incrementUserUsage);

  const createNewUser = async (
    clerkUserId: string,
    email: string,
    name?: string
  ) => {
    try {
      await createUser({
        clerkUserId,
        email,
        name,
      });
      toast.success("Account created successfully!");
    } catch (error) {
      toast.error("Failed to create account");
      throw error;
    }
  };

  const upgradeSubscription = async (
    clerkUserId: string,
    tier: "free" | "student" | "premium",
    status: string,
    stripeCustomerId?: string,
    stripeSubscriptionId?: string
  ) => {
    try {
      await updateSubscription({
        clerkUserId,
        tier,
        status,
        stripeCustomerId,
        stripeSubscriptionId,
      });
      toast.success("Subscription updated successfully!");
    } catch (error) {
      toast.error("Failed to update subscription");
      throw error;
    }
  };

  const incrementUserUsageCount = async (clerkUserId: string) => {
    try {
      await incrementUsage({ clerkUserId });
    } catch (error) {
      toast.error("Failed to update usage count");
      throw error;
    }
  };

  return {
    usageLimit,
    createNewUser,
    upgradeSubscription,
    incrementUserUsageCount,
  };
}
