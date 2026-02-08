import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { Member } from "@/lib/types";

/**
 * Get the currently authenticated member.
 * Must be called from a Server Component or Server Action.
 * Redirects to /login if not authenticated.
 * Wrapped with React.cache() to deduplicate within a single request.
 */
export const getCurrentMember = cache(async (): Promise<Member> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();
  const { data: member, error } = await adminClient
    .from("members")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !member) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  if (!member.active) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  return member as Member;
});

/**
 * Check if a role has admin-level access (admin or super_admin).
 */
export function isAdminRole(role: string): boolean {
  return role === "admin" || role === "super_admin";
}

/**
 * Require the current user to be an admin (admin or super_admin).
 * Redirects to /dashboard if not admin.
 */
export async function requireAdmin(): Promise<Member> {
  const member = await getCurrentMember();

  if (!isAdminRole(member.role)) {
    redirect("/dashboard");
  }

  return member;
}

/**
 * Require the current user to be a super_admin.
 * Redirects to /dashboard if not super_admin.
 */
export async function requireSuperAdmin(): Promise<Member> {
  const member = await getCurrentMember();

  if (member.role !== "super_admin") {
    redirect("/dashboard");
  }

  return member;
}

/**
 * Check whether a member can admin a specific vote based on the vote's division.
 * - super_admins can admin any vote (division or corp-wide)
 * - division admins can only admin votes in their own division
 * - corp-wide votes (division_id = null) require super_admin
 */
export function canAdminVote(member: Member, voteDivisionId: string | null): boolean {
  if (member.role === "super_admin") return true;
  if (member.role !== "admin") return false;
  // Division admins cannot manage corp-wide votes
  if (voteDivisionId === null) return false;
  // Division admins can only manage their own division's votes
  return member.division_id === voteDivisionId;
}
