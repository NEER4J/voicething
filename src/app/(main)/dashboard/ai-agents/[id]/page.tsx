"use client";

import { useState, useEffect } from "react";

import { useRouter, useParams } from "next/navigation";

import { Edit, Trash2, Save, X, Phone, Info } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/use-auth";
import { getAgentById, updateAgent, deleteAgent } from "@/server/agents-actions";
import { BUSINESS_TYPES, LANGUAGES, TONES, type Agent } from "@/types/agents";

import { AgentConfigDisplay } from "./_components/agent-config-display";
import { AgentConfigEdit } from "./_components/agent-config-edit";
import { CallHistory } from "./_components/call-history";
import { WebCall } from "./_components/web-call";

// eslint-disable-next-line complexity
export default function AgentDetailPage() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState<Partial<Agent>>({});
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  const agentId = params.id as string;

  useEffect(() => {
    const loadAgent = async () => {
      if (!user?.id || !agentId) return;

      setIsLoading(true);
      try {
        const data = await getAgentById(user.id, agentId);
        setAgent(data);
        if (data) {
          setEditedData({
            name: data.name,
            business_type: data.business_type,
            language: data.language,
            tone: data.tone,
            voice_id: data.voice_id,
            voice_name: data.voice_name,
            greeting_message: data.greeting_message,
            system_prompt: data.system_prompt,
          });
        }
      } catch (error) {
        console.error("Error loading agent:", error);
        toast.error("Failed to load agent");
      } finally {
        setIsLoading(false);
      }
    };

    loadAgent();
  }, [user?.id, agentId]);

  const handleSave = async () => {
    if (!user?.id || !agentId) return;

    setIsSaving(true);
    try {
      const result = await updateAgent(user.id, agentId, editedData);
      if (result.success) {
        toast.success("Agent updated successfully");
        setIsEditing(false);
        // Reload agent data
        const updatedAgent = await getAgentById(user.id, agentId);
        setAgent(updatedAgent);
      } else {
        toast.error(result.error ?? "Failed to update agent");
      }
    } catch (error) {
      console.error("Error updating agent:", error);
      toast.error("Failed to update agent");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user?.id || !agentId || !agent) return;

    const confirmed = confirm(`Are you sure you want to delete "${agent.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      const result = await deleteAgent(user.id, agentId);
      if (result.success) {
        toast.success("Agent deleted successfully");
        router.push("/dashboard/ai-agents");
      } else {
        toast.error(result.error ?? "Failed to delete agent");
      }
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast.error("Failed to delete agent");
    }
  };

  const handleCancel = () => {
    if (agent) {
      setEditedData({
        name: agent.name,
        business_type: agent.business_type,
        language: agent.language,
        tone: agent.tone,
        voice_id: agent.voice_id,
        voice_name: agent.voice_name,
        greeting_message: agent.greeting_message,
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex size-full items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex size-full flex-col items-center justify-center space-y-6 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-medium">Agent Not Found</h1>
          <p className="text-muted-foreground mt-2 text-sm">The agent you&apos;re looking for doesn&apos;t exist.</p>
        </div>
        <Button onClick={() => router.push("/dashboard/ai-agents")}>Go to Agents</Button>
      </div>
    );
  }

  const businessType = BUSINESS_TYPES.find((bt) => bt.value === agent.business_type);
  const language = LANGUAGES.find((l) => l.value === agent.language);
  const tone = TONES.find((t) => t.value === agent.tone);

  return (
    <div className="size-full space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold sm:text-3xl">{agent.name}</h1>
            <Badge variant={agent.is_active ? "default" : "outline"} className="shrink-0">
              {agent.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Created {new Date(agent.created_at).toLocaleDateString()} • Updated{" "}
            {new Date(agent.updated_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Edit className="size-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button onClick={handleDelete} variant="outline" size="sm" className="text-destructive">
                <Trash2 className="size-4" />
              </Button>
            </>
          )}
          {isEditing && (
            <>
              <Button onClick={handleCancel} variant="outline" size="sm" disabled={isSaving}>
                <X className="size-4" />
                <span className="hidden sm:inline">Cancel</span>
              </Button>
              <Button onClick={handleSave} size="sm" disabled={isSaving}>
                {isSaving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <>
                    <Save className="size-4" />
                    <span className="hidden sm:inline">Save Changes</span>
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration Section - Takes 1 column on mobile, 1 column on lg */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Configuration</CardTitle>
              <CardDescription className="text-xs">
                {isEditing ? "Edit your assistant's configuration" : "View your assistant's configuration"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isEditing ? (
                <AgentConfigDisplay agent={agent} businessType={businessType} language={language} tone={tone} />
              ) : (
                <AgentConfigEdit editedData={editedData} setEditedData={setEditedData} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Testing Section - Takes full width on mobile, 2 columns on lg */}
        <div className="space-y-6 lg:col-span-2">
          {/* Test Cards Grid */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Phone Call Card */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Phone className="size-4" />
                  Phone Call
                </CardTitle>
                <CardDescription className="text-xs">Call your assistant using a phone number</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between space-y-4">
                <Alert className="border-muted">
                  <Info className="size-4" />
                  <AlertTitle className="text-sm">Coming Soon</AlertTitle>
                  <AlertDescription className="text-xs">
                    Phone call testing will be available soon. For now, you can test your assistant using the web
                    interface.
                  </AlertDescription>
                </Alert>
                <Button className="w-full" size="sm" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            {/* Web Call Card */}
            <WebCall agent={agent} />
          </div>

          {/* Call History Card */}
          <CallHistory agent={agent} />
        </div>
      </div>
    </div>
  );
}
