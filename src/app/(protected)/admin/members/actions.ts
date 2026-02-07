"use server";

import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface AddMemberState {
  error: string | null;
  success: boolean;
}

export async function addMember(
  _prevState: AddMemberState,
  formData: FormData
): Promise<AddMemberState> {
  await requireAdmin();

  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const name = (formData.get("name") as string)?.trim() || null;

  if (!email) {
    return { error: "Email is required.", success: false };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Please enter a valid email address.", success: false };
  }

  const adminClient = createAdminClient();

  // Check if email already exists
  const { data: existing } = await adminClient
    .from("members")
    .select("id, active")
    .eq("email", email)
    .single();

  if (existing) {
    if (!existing.active) {
      // Reactivate the member
      const { error } = await adminClient
        .from("members")
        .update({ active: true, name: name ?? undefined })
        .eq("id", existing.id);

      if (error) {
        return { error: `Failed to reactivate member: ${error.message}`, success: false };
      }

      revalidatePath("/admin/members");
      return { error: null, success: true };
    }
    return { error: "This email is already on the member list.", success: false };
  }

  // Insert new member
  const { error } = await adminClient
    .from("members")
    .insert({ email, name });

  if (error) {
    return { error: `Failed to add member: ${error.message}`, success: false };
  }

  revalidatePath("/admin/members");
  return { error: null, success: true };
}

export async function toggleMemberActive(memberId: string, active: boolean) {
  await requireAdmin();

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("members")
    .update({ active })
    .eq("id", memberId);

  if (error) {
    throw new Error(`Failed to update member: ${error.message}`);
  }

  revalidatePath("/admin/members");
}

export async function toggleMemberRole(memberId: string, role: "admin" | "member") {
  await requireAdmin();

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("members")
    .update({ role })
    .eq("id", memberId);

  if (error) {
    throw new Error(`Failed to update role: ${error.message}`);
  }

  revalidatePath("/admin/members");
}

export async function toggleVotingMember(memberId: string, votingMember: boolean) {
  await requireAdmin();

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("members")
    .update({ voting_member: votingMember })
    .eq("id", memberId);

  if (error) {
    throw new Error(`Failed to update voting status: ${error.message}`);
  }

  revalidatePath("/admin/members");
}

export async function removeMember(memberId: string) {
  await requireAdmin();

  const adminClient = createAdminClient();

  // Check if member has any participation records — if so, deactivate instead of delete
  const { count } = await adminClient
    .from("participation_records")
    .select("*", { count: "exact", head: true })
    .eq("member_id", memberId);

  if (count && count > 0) {
    // Has voting history — deactivate to preserve records
    const { error } = await adminClient
      .from("members")
      .update({ active: false })
      .eq("id", memberId);

    if (error) {
      throw new Error(`Failed to deactivate member: ${error.message}`);
    }
  } else {
    // No history — safe to delete entirely
    const { error } = await adminClient
      .from("members")
      .delete()
      .eq("id", memberId);

    if (error) {
      throw new Error(`Failed to remove member: ${error.message}`);
    }
  }

  revalidatePath("/admin/members");
}
