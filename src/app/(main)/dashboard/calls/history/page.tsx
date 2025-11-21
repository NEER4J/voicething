"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

import { History, Search, Filter, Clock, MessageSquare, User, Bot, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/use-auth";
import { getAllUserCalls } from "@/server/agents-actions";

interface CallHistoryItem {
  id: string;
  call_id: string | null;
  transcript_text: string | null;
  transcript_json: unknown | null;
  duration_seconds: number | null;
  created_at: string;
  agent_id: string;
  agent_name: string;
}

type TranscriptMessage = {
  role: "assistant" | "user";
  message: string;
  time?: number;
};

export default function CallHistoryPage() {
  const { user } = useAuth();
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([]);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string>("all");

  const loadCallHistory = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingHistory(true);
    try {
      const result = await getAllUserCalls(user.id);
      if (result.success && result.calls) {
        setCallHistory(result.calls);
      } else {
        toast.error(result.error ?? "Failed to load call history");
      }
    } catch (err) {
      console.error("Error loading call history:", err);
      toast.error("Failed to load call history");
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadCallHistory();
  }, [loadCallHistory]);

  // Get unique agents for filter
  const uniqueAgents = useMemo(() => {
    const agents = new Map<string, string>();
    callHistory.forEach((call) => {
      if (!agents.has(call.agent_id)) {
        agents.set(call.agent_id, call.agent_name);
      }
    });
    return Array.from(agents.entries()).map(([id, name]) => ({ id, name }));
  }, [callHistory]);

  // Filter calls based on search and agent filter
  const filteredCalls = useMemo(() => {
    if (searchQuery === "" && selectedAgent === "all") return callHistory;

    const queryLower = searchQuery.toLowerCase();
    return callHistory.filter((call) => {
      const matchesSearch =
        searchQuery === "" ||
        call.agent_name.toLowerCase().includes(queryLower) ||
        (call.transcript_text?.toLowerCase().includes(queryLower) ?? false) ||
        (call.call_id?.toLowerCase().includes(queryLower) ?? false);

      const matchesAgent = selectedAgent === "all" || call.agent_id === selectedAgent;

      return matchesSearch && matchesAgent;
    });
  }, [callHistory, searchQuery, selectedAgent]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const parseTranscript = (transcriptJson: unknown): TranscriptMessage[] => {
    if (!transcriptJson) return [];
    try {
      const segments = transcriptJson as Array<{
        role: "user" | "assistant";
        text: string;
      }>;
      return segments.filter((s) => s.text).map((s) => ({ role: s.role, message: s.text }));
    } catch (e) {
      console.error("Error parsing transcript JSON:", e);
      return [];
    }
  };

  return (
    <div className="size-full space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <History className="text-muted-foreground size-6" />
            <h1 className="text-2xl font-semibold sm:text-3xl">Call History</h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            View and manage all your call conversations across all agents
          </p>
        </div>
        <Button onClick={loadCallHistory} variant="outline" size="sm" disabled={isLoadingHistory}>
          <RefreshCw className={`size-4 ${isLoadingHistory ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="size-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search by agent name, transcript, or call ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              <Button
                variant={selectedAgent === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedAgent("all")}
                className="shrink-0"
              >
                All Agents
              </Button>
              {uniqueAgents.map((agent) => (
                <Button
                  key={agent.id}
                  variant={selectedAgent === agent.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedAgent(agent.id)}
                  className="shrink-0"
                >
                  {agent.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-base">All Calls</CardTitle>
            <CardDescription className="text-xs">
              {filteredCalls.length} {filteredCalls.length === 1 ? "call" : "calls"} found
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
              <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Loading call history...
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="bg-muted/40 rounded-md p-8 text-center">
              <History className="text-muted-foreground mx-auto mb-3 size-8" />
              <p className="text-muted-foreground text-sm">
                {callHistory.length === 0
                  ? "No calls yet. Start a call to see history here."
                  : "No calls match your filters. Try adjusting your search or filter criteria."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCalls.map((call) => {
                const isExpanded = expandedCallId === call.id;
                const transcriptMessages = parseTranscript(call.transcript_json);
                const date = new Date(call.created_at);

                return (
                  <div
                    key={call.id}
                    className="bg-card overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
                  >
                    <button
                      onClick={() => setExpandedCallId(isExpanded ? null : call.id)}
                      className="bg-muted/30 hover:bg-muted/50 w-full px-4 py-4 text-left transition-colors"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-1 flex-wrap items-center gap-3">
                          <Badge variant="secondary" className="shrink-0 font-medium">
                            {call.agent_name}
                          </Badge>
                          <div className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Clock className="size-3" />
                            <span>
                              {date.toLocaleDateString()} {date.toLocaleTimeString()}
                            </span>
                          </div>
                          {call.duration_seconds && (
                            <div className="text-muted-foreground flex items-center gap-1 text-xs">
                              <span>{formatDuration(call.duration_seconds)}</span>
                            </div>
                          )}
                          {call.call_id && (
                            <div className="text-muted-foreground font-mono text-xs">
                              {call.call_id.substring(0, 12)}...
                            </div>
                          )}
                          <div className="text-muted-foreground flex items-center gap-1 text-xs">
                            <MessageSquare className="size-3" />
                            <span>{transcriptMessages.length} messages</span>
                          </div>
                        </div>
                        <div className="text-muted-foreground text-xs">{isExpanded ? "Hide" : "Show"} Details</div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="bg-background border-t p-4">
                        <div className="space-y-4">
                          <div className="grid gap-3 text-sm sm:grid-cols-2">
                            <div>
                              <span className="text-muted-foreground text-xs">Agent:</span>
                              <p className="font-medium">{call.agent_name}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs">Date & Time:</span>
                              <p className="font-medium">
                                {date.toLocaleDateString()} {date.toLocaleTimeString()}
                              </p>
                            </div>
                            {call.duration_seconds && (
                              <div>
                                <span className="text-muted-foreground text-xs">Duration:</span>
                                <p className="font-medium">{formatDuration(call.duration_seconds)}</p>
                              </div>
                            )}
                            {call.call_id && (
                              <div>
                                <span className="text-muted-foreground text-xs">Call ID:</span>
                                <p className="font-mono text-xs">{call.call_id}</p>
                              </div>
                            )}
                          </div>

                          <div>
                            <h4 className="text-muted-foreground mb-3 text-xs font-medium uppercase">Transcript</h4>
                            <div className="space-y-3">
                              {transcriptMessages.length > 0 ? (
                                transcriptMessages.map((msg, idx) => {
                                  const msgHash = `${call.id}-${msg.role}-${idx}`;
                                  const isAssistant = msg.role === "assistant";
                                  return (
                                    <div key={msgHash} className="flex gap-3">
                                      <div className="shrink-0">
                                        {isAssistant ? (
                                          <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full">
                                            <Bot className="size-4" />
                                          </div>
                                        ) : (
                                          <div className="bg-muted flex size-8 items-center justify-center rounded-full">
                                            <User className="size-4" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="text-muted-foreground mb-1 text-xs font-medium">
                                          {isAssistant ? "Assistant" : "You"}
                                          {msg.time && <span className="ml-2">({msg.time.toFixed(1)}s)</span>}
                                        </div>
                                        <div className="bg-muted/40 rounded-md p-3 text-sm">{msg.message}</div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-muted-foreground bg-muted/40 rounded-md p-3 text-sm">
                                  {call.transcript_text ?? "No transcript available"}
                                </div>
                              )}
                            </div>
                          </div>
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
    </div>
  );
}
