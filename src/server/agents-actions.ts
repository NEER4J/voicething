"use server";
/* eslint-disable max-lines */
/* eslint-disable max-depth */

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { SYSTEM_PROMPT_TEMPLATES, VOICE_OPTIONS, type Agent, type AgentFormData } from "@/types/agents";

import { getOrCreateUserRecord } from "./user-helpers";

// Helper function to create Vapi assistant configuration
const createAssistantConfig = (formData: AgentFormData) => {
  const voice = VOICE_OPTIONS.find((v) => v.id === formData.voice_id);
  if (!voice) {
    throw new Error("Invalid voice selection");
  }

  const systemPrompt = formData.system_prompt ?? SYSTEM_PROMPT_TEMPLATES[formData.business_type];
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
    endCallPhrases: [
      "goodbye",
      "bye",
      "see you later",
      "talk to you later",
      "end the call",
      "hang up",
      "that's all",
      "we're done",
      "you can end now",
    ],
    recordingEnabled: false,
    backgroundSound: "off",
    context: { enabled: true, maxLength: 50 },
  };
};

// Build a Vapi assistant update payload from partial agent updates
// eslint-disable-next-line complexity
const buildAssistantUpdatePayload = (formData: Partial<AgentFormData>) => {
  const payload: Record<string, unknown> = {};

  if (formData.name) payload.name = formData.name;

  if (formData.system_prompt || formData.business_type) {
    const systemPrompt =
      formData.system_prompt ?? (formData.business_type ? SYSTEM_PROMPT_TEMPLATES[formData.business_type] : undefined);
    payload.model = {
      provider: "openai",
      model: "gpt-3.5-turbo",
      ...(systemPrompt ? { messages: [{ role: "system", content: systemPrompt }] } : {}),
      temperature: 0.7,
    };
  }

  if (formData.language) {
    const languageConfig = formData.language === "arabic" ? { language: "ar-SA" } : { language: "en-US" };
    payload.transcriber = {
      provider: "deepgram",
      model: "nova-2",
      language: languageConfig.language,
    };
  }

  if (formData.greeting_message !== undefined) {
    payload.firstMessage = formData.greeting_message || "Hello! How can I help you today?";
  }

  // Map voice; keeping provider fixed as example
  if (formData.voice_id || formData.voice_name) {
    payload.voice = {
      provider: "11labs",
      // Note: project uses fixed voiceId in creation; if you want to map by id/name, adjust here
      voiceId: "cgSgspJ2msm6clMCkdW9",
    };
  }

  return payload;
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
        system_prompt: formData.system_prompt,
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
export async function getAgentById(authUserId: string, agentId: string): Promise<Agent | null> {
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
// eslint-disable-next-line complexity
export async function updateAgent(
  authUserId: string,
  agentId: string,
  formData: Partial<AgentFormData>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const userId = await getOrCreateUserRecord(authUserId);

    // Fetch current agent to get vapi assistant id
    const { data: existing, error: fetchError } = await supabase
      .from("ai_agents")
      .select("vapi_assistant_id")
      .eq("id", agentId)
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      console.error("Error fetching agent before update:", fetchError);
      return { success: false, error: fetchError.message };
    }

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

    // Propagate updates to Vapi assistant if available
    const vapiAssistantId: string | null = existing ? (existing.vapi_assistant_id ?? null) : null;
    const apiKey = process.env.VAPI_API_KEY;
    if (vapiAssistantId && apiKey) {
      try {
        const updatePayload = buildAssistantUpdatePayload(formData);
        if (Object.keys(updatePayload).length > 0) {
          const resp = await fetch(`https://api.vapi.ai/assistant/${vapiAssistantId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(updatePayload),
          });
          if (!resp.ok) {
            const errData = await resp.json().catch(() => ({}));
            console.error("Vapi assistant update failed:", errData);
            // Do not fail DB update if Vapi update fails, but report error
            return { success: false, error: "Updated locally, but failed to update voice assistant" };
          }
        }
      } catch (e) {
        console.error("Error updating Vapi assistant:", e);
        return { success: false, error: "Updated locally, but failed to update voice assistant" };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating agent:", error);
    return { success: false, error: "Failed to update agent" };
  }
}

// Delete agent (soft delete)
export async function deleteAgent(authUserId: string, agentId: string): Promise<{ success: boolean; error?: string }> {
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
  draftData: Partial<AgentFormData>,
) => {
  const { error } = await supabase
    .from("ai_agents")
    .update({
      ...draftData,
      system_prompt: draftData.system_prompt,
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
const createNewDraft = async (supabase: SupabaseClient, userId: string, draftData: Partial<AgentFormData>) => {
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
      system_prompt: draftData.system_prompt,
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
        system_prompt: formData.system_prompt,
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

// Save agent transcript
export async function saveAgentTranscript(
  authUserId: string,
  agentId: string,
  payload: {
    callId?: string;
    transcriptText: string;
    segments: Array<{
      role: "user" | "assistant";
      text: string;
      isFinal: boolean;
      startedAt?: string;
      endedAt?: string;
    }>;
    durationSeconds?: number;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const userId = await getOrCreateUserRecord(authUserId);

    // Ensure the agent belongs to the user
    const { data: agentRow, error: fetchError } = await supabase
      .from("ai_agents")
      .select("id, user_id")
      .eq("id", agentId)
      .single();

    if (fetchError || !agentRow || agentRow.user_id !== userId) {
      return { success: false, error: "Agent not found or access denied" };
    }

    const { error: insertError } = await supabase.from("ai_agent_transcripts").insert({
      agent_id: agentId,
      user_id: userId,
      call_id: payload.callId ?? null,
      transcript_text: payload.transcriptText,
      transcript_json: payload.segments as unknown as Record<string, unknown>,
      duration_seconds: payload.durationSeconds ?? null,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Error saving transcript:", insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving transcript:", error);
    return { success: false, error: "Failed to save transcript" };
  }
}

// eslint-disable-next-line complexity
export async function getVapiCallTranscript(
  authUserId: string,
  agentId: string,
  callId: string,
): Promise<{ success: boolean; transcript?: unknown[]; messages?: unknown[]; error?: string }> {
  try {
    const supabase = await createClient();
    const userId = await getOrCreateUserRecord(authUserId);

    // Verify user owns this agent
    const { data: agentRow, error: fetchError } = await supabase
      .from("ai_agents")
      .select("id, user_id")
      .eq("id", agentId)
      .single();

    if (fetchError || !agentRow || agentRow.user_id !== userId) {
      return { success: false, error: "Agent not found or access denied" };
    }

    const vapiToken = process.env.VAPI_API_KEY;
    if (!vapiToken) {
      return { success: false, error: "Vapi API key not configured" };
    }

    // Fetch call details from Vapi
    const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
      headers: {
        Authorization: `Bearer ${vapiToken}`,
      },
    });

    if (!response.ok) {
      return { success: false, error: `Failed to fetch call: ${response.statusText}` };
    }

    const call = (await response.json()) as {
      artifact?: { transcript?: unknown[]; messages?: unknown[] };
    };
    const transcript = call?.artifact?.transcript ?? [];
    const messages = call?.artifact?.messages ?? [];

    return { success: true, transcript, messages };
  } catch (error) {
    console.error("Error fetching Vapi transcript:", error);
    return { success: false, error: "Failed to fetch transcript from Vapi" };
  }
}

export async function getAgentCallHistory(
  authUserId: string,
  agentId: string,
): Promise<{
  success: boolean;
  calls?: Array<{
    id: string;
    call_id: string | null;
    transcript_text: string | null;
    transcript_json: unknown | null;
    duration_seconds: number | null;
    created_at: string;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const userId = await getOrCreateUserRecord(authUserId);

    // Ensure the agent belongs to the user
    const { data: agentRow, error: fetchError } = await supabase
      .from("ai_agents")
      .select("id, user_id")
      .eq("id", agentId)
      .single();

    if (fetchError || !agentRow || agentRow.user_id !== userId) {
      return { success: false, error: "Agent not found or access denied" };
    }

    const { data, error } = await supabase
      .from("ai_agent_transcripts")
      .select("id, call_id, transcript_text, transcript_json, duration_seconds, created_at")
      .eq("agent_id", agentId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, calls: data ?? [] };
  } catch (error) {
    console.error("Error fetching call history:", error);
    return { success: false, error: "Failed to fetch call history" };
  }
}

export async function getAllUserCalls(authUserId: string): Promise<{
  success: boolean;
  calls?: Array<{
    id: string;
    call_id: string | null;
    transcript_text: string | null;
    transcript_json: unknown | null;
    duration_seconds: number | null;
    created_at: string;
    agent_id: string;
    agent_name: string;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const userId = await getOrCreateUserRecord(authUserId);

    // Fetch all calls for the user
    const { data: calls, error: callsError } = await supabase
      .from("ai_agent_transcripts")
      .select("id, call_id, transcript_text, transcript_json, duration_seconds, created_at, agent_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (callsError) {
      return { success: false, error: callsError.message };
    }

    if (!calls || calls.length === 0) {
      return { success: true, calls: [] };
    }

    // Get unique agent IDs
    const agentIds = [...new Set(calls.map((call) => call.agent_id))];

    // Fetch agent names
    const { data: agents, error: agentsError } = await supabase
      .from("ai_agents")
      .select("id, name")
      .in("id", agentIds)
      .eq("user_id", userId);

    if (agentsError) {
      return { success: false, error: agentsError.message };
    }

    // Create a map of agent ID to name
    const agentMap = new Map<string, string>();
    (agents ?? []).forEach((agent) => {
      agentMap.set(agent.id, agent.name);
    });

    // Combine calls with agent names
    const callsWithAgentName = calls.map((call) => ({
      id: call.id,
      call_id: call.call_id,
      transcript_text: call.transcript_text,
      transcript_json: call.transcript_json,
      duration_seconds: call.duration_seconds,
      created_at: call.created_at,
      agent_id: call.agent_id,
      agent_name: agentMap.get(call.agent_id) ?? "Unknown Agent",
    }));

    return { success: true, calls: callsWithAgentName };
  } catch (error) {
    console.error("Error fetching all user calls:", error);
    return { success: false, error: "Failed to fetch call history" };
  }
}

export async function endVapiCall(
  authUserId: string,
  agentId: string,
  callId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const userId = await getOrCreateUserRecord(authUserId);

    // Verify agent ownership
    const { data: agentRow, error: fetchError } = await supabase
      .from("ai_agents")
      .select("id, user_id")
      .eq("id", agentId)
      .single();

    if (fetchError || !agentRow || agentRow.user_id !== userId) {
      return { success: false, error: "Agent not found or access denied" };
    }

    const vapiToken = process.env.VAPI_API_KEY;
    if (!vapiToken) {
      return { success: false, error: "Vapi API key not configured" };
    }

    const resp = await fetch(`https://api.vapi.ai/call/${callId}/end`, {
      method: "POST",
      headers: { Authorization: `Bearer ${vapiToken}` },
    });

    if (!resp.ok) {
      return { success: false, error: `Failed to end call: ${resp.status} ${resp.statusText}` };
    }

    return { success: true };
  } catch (error) {
    console.error("Error ending Vapi call:", error);
    return { success: false, error: "Failed to end call" };
  }
}
