import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { checkOnboardingStatus } from "@/server/onboarding-actions";

async function handleCodeExchange(supabase: any, code: string) {
  console.log("Exchanging code for session...");
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("OAuth callback error:", error);
    redirect("/auth/login?error=callback_error");
  }

  console.log("Session exchange successful:", data);
}

async function handleExistingSession(supabase: any) {
  console.log("No code provided, checking existing session...");
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("No code provided and no existing session:", userError);
    redirect("/auth/login?error=no_code");
  }

  console.log("Existing user found:", user);
}

function getAuthCodeAndNextPath(params: { [key: string]: string | string[] | undefined }) {
  const code = Array.isArray(params.code) ? params.code[0] : params.code;
  const next = Array.isArray(params.next) ? params.next[0] : (params.next ?? "/dashboard");
  return { code, next };
}

async function validateUserAndOnboarding(supabase: any, next: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("User fetch error:", userError);
    redirect("/auth/login?error=session_missing");
  }

  const isOnboardingCompleted = await checkOnboardingStatus(user.id);

  if (!isOnboardingCompleted) {
    console.log("Onboarding not completed, redirecting to onboarding");
    redirect("/onboarding");
  }

  console.log("Redirecting to:", next);
  redirect(next);
}

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  console.log("OAuth callback received params:", params);

  const { code, next } = getAuthCodeAndNextPath(params);

  console.log("Code:", code, "Next:", next);

  if (code) {
    await handleCodeExchange(supabase, code);
  } else {
    await handleExistingSession(supabase);
  }

  await validateUserAndOnboarding(supabase, next);
}
