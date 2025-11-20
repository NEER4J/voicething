"use client";

import { useState, useEffect, useCallback } from "react";

import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/use-auth";
import { getAgentCallHistory } from "@/server/agents-actions";
import type { Agent } from "@/types/agents";

interface CallHistoryItem {
  id: string;
  call_id: string | null;
  transcript_text: string | null;
  transcript_json: unknown | null;
  duration_seconds: number | null;
  created_at: string;
}

type TranscriptMessage = {
  role: "assistant" | "user";
  message: string;
  time?: number;
};

interface CallHistoryProps {
  agent: Agent;
}

export function CallHistory({ agent }: CallHistoryProps) {
  const { user } = useAuth();
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([]);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const loadCallHistory = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingHistory(true);
    try {
      const result = await getAgentCallHistory(user.id, agent.id);
      if (result.success && result.calls) {
        setCallHistory(result.calls);
      }
    } catch (err) {
      console.error("Error loading call history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user?.id, agent.id]);

  useEffect(() => {
    loadCallHistory();
  }, [loadCallHistory]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="size-4" />
              Call History
            </CardTitle>
            <CardDescription className="text-xs">View past conversations with your assistant</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadCallHistory} disabled={isLoadingHistory}>
            {isLoadingHistory ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingHistory ? (
          <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Loading call history...
          </div>
        ) : callHistory.length === 0 ? (
          <div className="bg-muted/40 rounded-md p-6 text-center">
            <p className="text-muted-foreground text-sm">No calls yet. Start a call to see history here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {callHistory.map((call) => {
              const isExpanded = expandedCallId === call.id;
              // Parse transcript_json - it's stored as segments array
              let transcriptMessages: TranscriptMessage[] = [];
              try {
                if (call.transcript_json) {
                  const segments = call.transcript_json as Array<{
                    role: "user" | "assistant";
                    text: string;
                    isFinal?: boolean;
                    startedAt?: string;
                  }>;
                  transcriptMessages = segments
                    .filter((s) => s.text)
                    .map((s) => ({
                      role: s.role,
                      message: s.text,
                    }));
                }
              } catch (e) {
                console.error("Error parsing transcript JSON:", e);
              }
              const date = new Date(call.created_at);

              return (
                <div key={call.id} className="overflow-hidden rounded-md border">
                  <button
                    onClick={() => setExpandedCallId(isExpanded ? null : call.id)}
                    className="bg-muted/30 hover:bg-muted/50 w-full px-4 py-3 text-left transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span>
                          {date.toLocaleDateString()} {date.toLocaleTimeString()}
                        </span>
                        {call.duration_seconds && (
                          <span className="text-muted-foreground text-xs">
                            {Math.floor(call.duration_seconds / 60)}m {call.duration_seconds % 60}s
                          </span>
                        )}
                        {call.call_id && <span className="font-mono text-xs">{call.call_id.substring(0, 12)}...</span>}
                        <span className="text-muted-foreground text-xs">{transcriptMessages.length} messages</span>
                      </div>
                      <span className="text-muted-foreground text-xs">{isExpanded ? "Hide" : "Show"}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="bg-background p-4">
                      <div className="space-y-3">
                        {transcriptMessages.length > 0 ? (
                          transcriptMessages.map((msg, idx) => {
                            const msgHash = `${call.id}-${msg.role}-${msg.message.substring(0, 30)}-${idx}`;
                            return (
                              <div key={msgHash} className="text-sm">
                                <div className="text-muted-foreground mb-1 text-xs font-medium">
                                  {msg.role === "assistant" ? "Assistant" : "You"}
                                  {msg.time && <span className="ml-2">({msg.time.toFixed(1)}s)</span>}
                                </div>
                                <div className="bg-muted/40 rounded-md p-2">{msg.message}</div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-muted-foreground text-sm">
                            {call.transcript_text ?? "No transcript available"}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
