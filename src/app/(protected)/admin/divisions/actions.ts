"use server";

import { requireSuperAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface AddDivisionState {
  error: string | null;
  success: boolean;
}

export async function addDivision(
  _prevState: AddDivisionState,
  formData: FormData
): Promise<AddDivisionState> {
  await requireSuperAdmin();

  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim().toLowerCase();

  if (!name) {
    return { error: "Division name is required.", success: false };
  }

  if (!slug) {
    return { error: "Division slug is required.", success: false };
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { error: "Slug must contain only lowercase letters, numbers, and hyphens.", success: false };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("divisions")
    .insert({ name, slug });

  if (error) {
    if (error.code === "23505") {
      return { error: "A division with this name or slug already exists.", success: false };
    }
    return { error: `Failed to create division: ${error.message}`, success: false };
  }

  revalidatePath("/admin/divisions");
  return { error: null, success: true };
}
