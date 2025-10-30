"use client";

import { useState, useEffect } from "react";

import { useRouter, useParams } from "next/navigation";

import { ArrowLeft, Edit, TestTube, Trash2, Save, X, Phone, Info } from "lucide-react";
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
        <Button onClick={() => router.push("/dashboard/ai-agents")}>
          <ArrowLeft />
          Back to Agents
        </Button>
      </div>
    );
  }

  const businessType = BUSINESS_TYPES.find((bt) => bt.value === agent.business_type);
  const language = LANGUAGES.find((l) => l.value === agent.language);
  const tone = TONES.find((t) => t.value === agent.tone);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/dashboard/ai-agents")}>
          <ArrowLeft />
          Back to Agents
        </Button>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit />
                Edit
              </Button>
              <Button onClick={handleDelete} variant="outline" className="text-destructive">
                <Trash2 />
              </Button>
            </>
          )}
          {isEditing && (
            <>
              <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
                <X />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <>
                    <Save />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-medium">{agent.name}</h1>
          <Badge variant={agent.is_active ? "default" : "outline"}>{agent.is_active ? "Active" : "Inactive"}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Created on {new Date(agent.created_at).toLocaleDateString()} • Last updated{" "}
          {new Date(agent.updated_at).toLocaleDateString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            {isEditing ? "Edit your assistant's configuration" : "View your assistant's configuration"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isEditing ? (
            <AgentConfigDisplay agent={agent} businessType={businessType} language={language} tone={tone} />
          ) : (
            <AgentConfigEdit editedData={editedData} setEditedData={setEditedData} />
          )}
        </CardContent>
      </Card>

      {/* Test Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            <TestTube className="mr-2 inline-block size-5" />
            Test Your Assistant
          </CardTitle>
          <CardDescription>Try out your AI assistant to see how it performs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Phone className="mr-2 inline-block size-5" />
                  Test via Phone Call
                </CardTitle>
                <CardDescription>Call your assistant using a phone number</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="size-4" />
                  <AlertTitle>Coming Soon</AlertTitle>
                  <AlertDescription>
                    Phone call testing will be available soon. For now, you can test your assistant using the web
                    interface.
                  </AlertDescription>
                </Alert>
                <Button className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <WebCall agent={agent} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Testing Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Test in a quiet environment to ensure clear audio quality</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Try different scenarios relevant to your business type</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Listen for natural conversation flow and appropriate responses</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Test edge cases like background noise or unclear speech</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Verify the greeting message plays correctly</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
