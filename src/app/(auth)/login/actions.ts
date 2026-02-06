"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface LoginState {
  error: string | null;
  success: boolean;
}

export async function loginWithMagicLink(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email") as string;

  if (!email || typeof email !== "string") {
    return { error: "Please enter your email address.", success: false };
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check the allowlist: is this email in the members table and active?
  const adminClient = createAdminClient();
  const { data: member, error: memberError } = await adminClient
    .from("members")
    .select("id, active")
    .eq("email", normalizedEmail)
    .single();

  if (memberError || !member) {
    return {
      error: "This email is not authorized. Contact your group admin.",
      success: false,
    };
  }

  if (!member.active) {
    return {
      error: "Your account is inactive. Contact your group admin.",
      success: false,
    };
  }

  // Send the magic link
  const supabase = await createClient();
  const { error: authError } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
    },
  });

  if (authError) {
    return {
      error: "Failed to send login link. Please try again.",
      success: false,
    };
  }

  return { error: null, success: true };
}
