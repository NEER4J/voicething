import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { checkOnboardingStatus } from "@/server/onboarding-actions";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const error = requestUrl.searchParams.get("error");

  console.log("OAuth callback received - code:", !!code, "error:", error);

  // Check for OAuth errors
  if (error) {
    const errorDescription = requestUrl.searchParams.get("error_description");
    console.error("OAuth error:", error, errorDescription);
    return NextResponse.redirect(new URL(`/auth/login?error=${error}`, requestUrl.origin));
  }

  if (!code) {
    console.error("No code provided in OAuth callback");
    return NextResponse.redirect(new URL("/auth/login?error=no_code", requestUrl.origin));
  }

  // Exchange code for session
  const supabase = await createClient();
  console.log("Exchanging code for session...");
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("OAuth callback error:", exchangeError);
    return NextResponse.redirect(new URL("/auth/login?error=callback_error", requestUrl.origin));
  }

  console.log("Session exchange successful");

  // Get the authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("User fetch error:", userError);
    return NextResponse.redirect(new URL("/auth/login?error=session_missing", requestUrl.origin));
  }

  console.log("User authenticated:", user.id);

  // Check onboarding status
  let isOnboardingCompleted = false;
  try {
    isOnboardingCompleted = await checkOnboardingStatus(user.id);
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    // If onboarding check fails, assume not completed to be safe
    isOnboardingCompleted = false;
  }

  // Redirect based on onboarding status
  if (!isOnboardingCompleted) {
    console.log("Onboarding not completed, redirecting to /onboarding");
    return NextResponse.redirect(new URL("/onboarding", requestUrl.origin));
  }

  // Onboarding is complete, redirect to dashboard
  console.log("Onboarding completed, redirecting to dashboard:", next);
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
