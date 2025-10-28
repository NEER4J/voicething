"use server";

import { createClient } from "@/lib/supabase/server";
import { SYSTEM_PROMPT_TEMPLATES, VOICE_OPTIONS, type Agent, type AgentFormData } from "@/types/agents";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getOrCreateUserRecord } from "./user-helpers";

// Helper function to create Vapi assistant configuration
const createAssistantConfig = (formData: AgentFormData) => {
  const voice = VOICE_OPTIONS.find((v) => v.id === formData.voice_id);
  if (!voice) {
    throw new Error("Invalid voice selection");
  }

  const systemPrompt = SYSTEM_PROMPT_TEMPLATES[formData.business_type];
  const languageConfig = formData.language === "arabic" ? { language: "ar-SA" } : { language: "en-US" };

  return {
    name: formData.name,
    model: {
      provider: "openai",
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.7,
    },
    voice: {
      provider: "11labs",
      voiceId: "cgSgspJ2msm6clMCkdW9",
    },
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: languageConfig.language,
    },
    firstMessage: formData.greeting_message || "Hello! How can I help you today?",
    maxDurationSeconds: 180,
    endCallMessage: "Thank you for talking with me today. Have a great day!",
    endCallPhrases: ["goodbye", "bye", "see you later", "talk to you later"],
    recordingEnabled: false,
    backgroundSound: "off",
    context: { enabled: true, maxLength: 50 },
  };
};

// Create Vapi Assistant
async function createVapiAssistant(
  formData: AgentFormData,
): Promise<{ success: boolean; assistantId?: string; error?: string }> {
  const apiKey = process.env.VAPI_API_KEY;

  if (!apiKey) {
    console.error("VAPI_API_KEY not configured");
    return { success: false, error: "Vapi API key not configured" };
  }

  try {
    const assistantConfig = createAssistantConfig(formData);

    const response = await fetch("https://api.vapi.ai/assistant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(assistantConfig),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Vapi API error:", errorData);
      return {
        success: false,
        error: `Failed to create assistant: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return { success: true, assistantId: data.id };
  } catch (error) {
    console.error("Error creating Vapi assistant:", error);
    return { success: false, error: "Failed to create assistant" };
  }
}

// Create Agent
export async function createAgent(
  authUserId: string,
  formData: AgentFormData,
): Promise<{ success: boolean; agentId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const userId = await getOrCreateUserRecord(authUserId);

    // Create assistant in Vapi first
    const vapiResult = await createVapiAssistant(formData);
    if (!vapiResult.success) {
      return { success: false, error: vapiResult.error };
    }

    // Create agent in database
    const { data, error } = await supabase
      .from("ai_agents")
      .insert({
        user_id: userId,
        name: formData.name,
        business_type: formData.business_type,
        language: formData.language,
        tone: formData.tone,
        voice_id: formData.voice_id,
        voice_name: formData.voice_name,
        greeting_message: formData.greeting_message,
        vapi_assistant_id: vapiResult.assistantId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating agent in database:", error);
      return { success: false, error: error.message };
    }

    return { success: true, agentId: data.id };
  } catch (error) {
    console.error("Error creating agent:", error);
    return { success: false, error: "Failed to create agent" };
  }
}

// Get all agents for user
export async function getAgents(authUserId: string): Promise<Agent[]> {
  try {
    const supabase = await createClient();
    const userId = await getOrCreateUserRecord(authUserId);

    const { data, error } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching agents:", error);
      return [];
    }

    return data;
  } catch (error) {
    console.error("Error fetching agents:", error);
    return [];
  }
}

// Get agent by ID
export async function getAgentById(
  authUserId: string,
  agentId: string,
): Promise<Agent | null> {
  try {
    const supabase = await createClient();
    const userId = await getOrCreateUserRecord(authUserId);

    const { data, error } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("id", agentId)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching agent:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching agent:", error);
    return null;
  }
}

// Update agent
export async function updateAgent(
  authUserId: string,
  agentId: string,
  formData: Partial<AgentFormData>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const userId = await getOrCreateUserRecord(authUserId);

    const { error } = await supabase
      .from("ai_agents")
      .update({
        ...formData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating agent:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating agent:", error);
    return { success: false, error: "Failed to update agent" };
  }
}

// Delete agent (soft delete)
export async function deleteAgent(
  authUserId: string,
  agentId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const userId = await getOrCreateUserRecord(authUserId);

    const { error } = await supabase
      .from("ai_agents")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting agent:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting agent:", error);
    return { success: false, error: "Failed to delete agent" };
  }
}

// Get most recent agent
export async function getMostRecentAgent(authUserId: string): Promise<Agent | null> {
  try {
    const supabase = await createClient();
    const userId = await getOrCreateUserRecord(authUserId);

    const { data, error } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching recent agent:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching recent agent:", error);
    return null;
  }
}

// Helper function to update existing draft
const updateExistingDraft = async (
  supabase: SupabaseClient,
  draftId: string,
  userId: string,
  draftData: Partial<AgentFormData>
) => {
  const { error } = await supabase
    .from("ai_agents")
    .update({
      ...draftData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating draft:", error);
    return { success: false, error: error.message };
  }

  return { success: true, draftId };
};

// Helper function to create new draft
const createNewDraft = async (
  supabase: SupabaseClient,
  userId: string,
  draftData: Partial<AgentFormData>
) => {
  const { data, error } = await supabase
    .from("ai_agents")
    .insert({
      user_id: userId,
      name: draftData.name ?? "Draft Assistant",
      business_type: draftData.business_type ?? "general",
      language: draftData.language ?? "english",
      tone: draftData.tone ?? "friendly",
      voice_id: draftData.voice_id ?? "elliot",
      voice_name: draftData.voice_name ?? "Elliot",
      greeting_message: draftData.greeting_message,
      is_active: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating draft:", error);
    return { success: false, error: error.message };
  }

  return { success: true, draftId: data.id };
};

// Save draft agent (for multi-step wizard)
export async function saveDraftAgent(
  authUserId: string,
  draftData: Partial<AgentFormData>,
  draftId?: string,
): Promise<{ success: boolean; draftId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const userId = await getOrCreateUserRecord(authUserId);

    if (draftId) {
      return await updateExistingDraft(supabase, draftId, userId, draftData);
    } else {
      return await createNewDraft(supabase, userId, draftData);
    }
  } catch (error) {
    console.error("Error saving draft:", error);
    return { success: false, error: "Failed to save draft" };
  }
}

// Complete draft agent (create Vapi assistant and activate)
export async function completeDraftAgent(
  authUserId: string,
  draftId: string,
  formData: AgentFormData,
): Promise<{ success: boolean; agentId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const userId = await getOrCreateUserRecord(authUserId);

    // Create assistant in Vapi
    const vapiResult = await createVapiAssistant(formData);
    if (!vapiResult.success) {
      return { success: false, error: vapiResult.error };
    }

    // Update draft with Vapi ID and activate
    const { error } = await supabase
      .from("ai_agents")
      .update({
        name: formData.name,
        business_type: formData.business_type,
        language: formData.language,
        tone: formData.tone,
        voice_id: formData.voice_id,
        voice_name: formData.voice_name,
        greeting_message: formData.greeting_message,
        vapi_assistant_id: vapiResult.assistantId,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", draftId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error completing draft:", error);
      return { success: false, error: error.message };
    }

    return { success: true, agentId: draftId };
  } catch (error) {
    console.error("Error completing draft:", error);
    return { success: false, error: "Failed to complete agent setup" };
  }
}

