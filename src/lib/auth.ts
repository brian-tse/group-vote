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
 * Require the current user to be an admin.
 * Redirects to /dashboard if not admin.
 */
export async function requireAdmin(): Promise<Member> {
  const member = await getCurrentMember();

  if (member.role !== "admin") {
    redirect("/dashboard");
  }

  return member;
}
