"use client";

import { Separator } from "@/components/ui/separator";
import type { Agent } from "@/types/agents";

interface AgentConfigDisplayProps {
  agent: Agent;
  businessType: { label: string } | undefined;
  language: { label: string } | undefined;
  tone: { label: string } | undefined;
}

export function AgentConfigDisplay({ agent, businessType, language, tone }: AgentConfigDisplayProps) {
  return (
    <>
      <div className="flex justify-between">
        <span className="text-muted-foreground text-sm">Name</span>
        <span className="text-sm font-medium">{agent.name}</span>
      </div>
      <Separator />
      <div className="flex justify-between">
        <span className="text-muted-foreground text-sm">Business Type</span>
        <span className="text-sm font-medium">{businessType?.label}</span>
      </div>
      <Separator />
      <div className="flex justify-between">
        <span className="text-muted-foreground text-sm">Language</span>
        <span className="text-sm font-medium">{language?.label}</span>
      </div>
      <Separator />
      <div className="flex justify-between">
        <span className="text-muted-foreground text-sm">Voice</span>
        <span className="text-sm font-medium">{agent.voice_name}</span>
      </div>
      <Separator />
      <div className="flex justify-between">
        <span className="text-muted-foreground text-sm">Tone</span>
        <span className="text-sm font-medium">{tone?.label}</span>
      </div>
      {agent.greeting_message && (
        <>
          <Separator />
          <div className="space-y-2">
            <span className="text-muted-foreground text-sm">Greeting Message</span>
            <p className="bg-muted rounded-md p-3 text-sm italic">&quot;{agent.greeting_message}&quot;</p>
          </div>
        </>
      )}
      {agent.system_prompt && (
        <>
          <Separator />
          <div className="space-y-2">
            <span className="text-muted-foreground text-sm">System Prompt</span>
            <p className="bg-muted rounded-md p-3 text-sm whitespace-pre-wrap">{agent.system_prompt}</p>
          </div>
        </>
      )}
    </>
  );
}
