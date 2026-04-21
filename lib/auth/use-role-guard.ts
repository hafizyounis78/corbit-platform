"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-context";

/**
 * Redirects the user away from a page when their role isn't in the allowed list.
 * Call at the top of any page component to gate it by role.
 *
 * Example:
 *   useRoleGuard(["admin"]);              // admin-only
 *   useRoleGuard(["admin", "supervisor"]); // admin or supervisor
 */
export function useRoleGuard(allowed: Array<"admin" | "supervisor" | "agent">, fallback = "/dashboard") {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !user) return;
    if (!allowed.includes(user.role as any)) {
      router.replace(fallback);
    }
  }, [isLoading, user, allowed, fallback, router]);

  const allowedRoles = new Set<string>(allowed);
  return {
    authorized: !!user && allowedRoles.has(user.role),
    checking: isLoading,
  };
}
