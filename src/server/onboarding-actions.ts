"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { BusinessProfile, OnboardingFormData } from "@/types/onboarding";

async function getUserData(supabase: any) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { userEmail: "", userName: "User" };
  }

  const userEmail = user.email ?? "";
  const userName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "User";

  return { userEmail, userName };
}

async function checkExistingUser(supabase: any, authUserId: string) {
  const { data: existingUser } = await supabase.from("users").select("id").eq("id", authUserId).single();

  return existingUser;
}

async function checkUserByEmail(supabase: any, userEmail: string, authUserId: string) {
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

async function handleUserEmailCheck(supabase: any, authUserId: string, userEmail: string) {
  const existingUserByEmail = await checkUserByEmail(supabase, userEmail, authUserId);
  if (existingUserByEmail) {
    return existingUserByEmail;
  }
  return null;
}

async function createNewUser(supabase: any, authUserId: string, userEmail: string, userName: string) {
  const { error } = await supabase.from("users").insert({
    id: authUserId,
    email: userEmail,
    name: userName,
    auth_user_id: authUserId,
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

async function getOrCreateUserRecord(authUserId: string): Promise<string> {
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

export async function getBusinessProfile(authUserId: string): Promise<BusinessProfile | null> {
  const supabase = await createClient();

  // Get the correct user ID for database operations
  const userId = await getOrCreateUserRecord(authUserId);

  const { data, error } = await supabase.from("business_profiles").select("*").eq("user_id", userId).single();

  if (error) {
    console.error("Error fetching business profile:", error);
    return null;
  }

  return data;
}

export async function saveBusinessProfile(
  authUserId: string,
  data: Partial<OnboardingFormData>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get the correct user ID for database operations
  const userId = await getOrCreateUserRecord(authUserId);

  // Filter out fields that don't exist in the database schema
  const allowedFields = [
    "business_name",
    "business_category",
    "default_language",
    "timezone",
    "use_business_hours",
    "ai_phone_number",
    "phone_country_code",
    "phone_area_code",
    "voice_model",
    "voice_tone",
    "whatsapp_connected",
    "telegram_connected",
    "test_call_completed",
  ];

  const filteredData = Object.fromEntries(Object.entries(data).filter(([key]) => allowedFields.includes(key)));

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from("business_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existingProfile) {
    // Update existing profile
    const { error } = await supabase
      .from("business_profiles")
      .update({
        ...filteredData,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating business profile:", error);
      return { success: false, error: error.message };
    }
  } else {
    // Create new profile
    const { error } = await supabase.from("business_profiles").insert({
      user_id: userId,
      ...filteredData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error creating business profile:", error);
      return { success: false, error: error.message };
    }
  }

  return { success: true };
}

export async function completeOnboarding(authUserId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get the correct user ID for database operations
  const userId = await getOrCreateUserRecord(authUserId);

  const { error } = await supabase
    .from("users")
    .update({
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Error completing onboarding:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function checkOnboardingStatus(authUserId: string): Promise<boolean> {
  const supabase = await createClient();

  // Get the correct user ID for database operations
  const userId = await getOrCreateUserRecord(authUserId);

  const { data, error } = await supabase.from("users").select("onboarding_completed").eq("id", userId).single();

  if (error) {
    console.error("Error checking onboarding status:", error);
    return false;
  }

  return data?.onboarding_completed ?? false;
}

export async function requireOnboardingComplete() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const isCompleted = await checkOnboardingStatus(user.id);

  if (!isCompleted) {
    redirect("/onboarding");
  }

  return user;
}
