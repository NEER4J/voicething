"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// Helper functions to get user ID from auth (copied from onboarding-actions.ts)
export async function getUserData(supabase: SupabaseClient) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { userEmail: "", userName: "User" };
  }

  const userEmail = user.email ?? "";
  const userName =
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? (userEmail ? userEmail.split("@")[0] : "User");

  return { userEmail, userName };
}

export async function checkExistingUser(supabase: SupabaseClient, authUserId: string) {
  const { data: existingUser } = await supabase.from("users").select("id").eq("id", authUserId).single();

  return existingUser;
}

export async function checkUserByEmail(supabase: SupabaseClient, userEmail: string, authUserId: string) {
  const { data: existingUserByEmail } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", userEmail)
    .single();

  if (existingUserByEmail) {
    const { error: updateError } = await supabase
      .from("users")
      .update({
        auth_user_id: authUserId,
        updated_at: new Date().toISOString(),
      })
      .eq("email", userEmail);

    if (updateError) {
      console.error("Error updating user record:", updateError);
      throw new Error("Failed to update user record");
    }

    return existingUserByEmail.id;
  }

  return null;
}

export async function handleUserEmailCheck(supabase: SupabaseClient, authUserId: string, userEmail: string) {
  const existingUserByEmail = await checkUserByEmail(supabase, userEmail, authUserId);
  if (existingUserByEmail) {
    return existingUserByEmail;
  }
  return null;
}

export async function createNewUser(supabase: SupabaseClient, authUserId: string, userEmail: string, userName: string) {
  const { error } = await supabase.from("users").insert({
    id: authUserId,
    name: userName || "User", // name is required in schema
    email: userEmail,
    phone: null,
    call_count: 0,
    auth_user_id: authUserId,
    preferred_mode: null,
    onboarding_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error creating user record:", error);
    throw new Error("Failed to create user record");
  }

  return authUserId;
}

export async function getOrCreateUserRecord(authUserId: string): Promise<string> {
  const supabase = await createClient();

  const { userEmail, userName } = await getUserData(supabase);

  const existingUser = await checkExistingUser(supabase, authUserId);
  if (existingUser) {
    return authUserId;
  }

  if (userEmail) {
    const emailCheckResult = await handleUserEmailCheck(supabase, authUserId, userEmail);
    if (emailCheckResult) {
      return emailCheckResult;
    }
  }

  return await createNewUser(supabase, authUserId, userEmail, userName);
}
