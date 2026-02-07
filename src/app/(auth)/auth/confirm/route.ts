import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "magiclink" | "email" | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL environment variable is required");
  }

  console.log("[auth/confirm] Starting auth confirmation", {
    hasTokenHash: !!token_hash,
    hasCode: !!code,
    type,
    appUrl,
    requestUrl: request.url,
  });

  const redirectTo = new URL(next, appUrl);

  if (!token_hash && !code) {
    console.log("[auth/confirm] No token_hash or code provided");
    redirectTo.pathname = "/login";
    redirectTo.searchParams.set("error", "Invalid login link");
    return NextResponse.redirect(redirectTo);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  let data;
  let error;

  if (code) {
    // PKCE flow: exchange the code for a session
    const result = await supabase.auth.exchangeCodeForSession(code);
    data = result.data;
    error = result.error;
  } else if (token_hash) {
    // Token hash flow: verify the OTP directly
    const result = await supabase.auth.verifyOtp({
      token_hash,
      type: type === "magiclink" ? "magiclink" : "email",
    });
    data = result.data;
    error = result.error;
  }

  if (error || !data?.user) {
    console.error("[auth/confirm] Verification failed:", {
      error: error?.message,
      errorStatus: error?.status,
      hasUser: !!data?.user,
    });
    redirectTo.pathname = "/login";
    redirectTo.searchParams.set("error", error?.message || "Login link expired or invalid");
    return NextResponse.redirect(redirectTo);
  }

  console.log("[auth/confirm] Verification succeeded for user:", data.user.email);

  // Link the Supabase auth user to the members table
  // This runs on every login to ensure the link is established
  const adminClient = createAdminClient();
  const { error: linkError } = await adminClient
    .from("members")
    .update({ auth_user_id: data.user.id })
    .eq("email", data.user.email!.toLowerCase())
    .is("auth_user_id", null);

  // linkError is non-fatal (might already be linked)
  if (linkError) {
    console.warn("Member link warning (may already be linked):", linkError.message);
  }

  return response;
}
