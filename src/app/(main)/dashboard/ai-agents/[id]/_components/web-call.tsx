"use client";

import { useState, useEffect, useRef } from "react";

import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Agent } from "@/types/agents";
import { useAuth } from "@/lib/auth/use-auth";
import { getVapiCallTranscript, saveAgentTranscript, getAgentCallHistory, endVapiCall } from "@/server/agents-actions";

interface WebCallProps {
  agent: Agent;
}

interface VapiInstance {
  on: (event: string, callback: (data?: unknown) => void) => void;
  start: (assistantId: string, options?: unknown) => Promise<unknown>;
  stop: () => void;
  setMuted: (muted: boolean) => void;
  // Some SDK versions may not expose speaker mute; treat as optional
  setSpeakerMuted?: (muted: boolean) => void;
}

// Best-effort safe stringify for unknown errors
const safeStringify = (value: unknown): string => {
  try {
    return JSON.stringify(value, (_key, val) => {
      if (val instanceof Error) {
        return { name: val.name, message: val.message, stack: val.stack };
      }
      return val;
    });
  } catch {
    try {
      return String(value);
    } catch {
      return "[unserializable error]";
    }
  }
};

const extractErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message || err.name;
  const asObj = err as { message?: string; error?: string; reason?: string } | undefined;
  return asObj?.message || asObj?.error || asObj?.reason || String(err ?? "Unknown error");
};

// Helper function to setup event listeners
const setupEventListeners = (
  vapi: VapiInstance,
  setIsCallActive: (active: boolean) => void,
  setCallStatus: (status: string) => void,
  setError: (error: string | null) => void,
  onTranscript?: (data: { role: string; message: string; isFinal: boolean }) => void,
  onCallStart?: (info?: unknown) => void,
  onCallEnd?: () => void,
  _finalizeDraft?: (role: "user" | "assistant") => void,
  isTerminatingRef?: { current: boolean },
) => {
  vapi.on("call-start", (info?: unknown) => {
    console.log("Call started");
    setIsCallActive(true);
    setCallStatus("Call in progress...");
    setError(null);
    if (onCallStart) onCallStart(info);
  });

  vapi.on("call-end", async () => {
    console.log("Call ended event fired");
    setIsCallActive(false);
    setCallStatus("Call ended");
    if (onCallEnd) {
      console.log("Triggering onCallEnd callback");
      await onCallEnd();
    } else {
      console.warn("onCallEnd callback is not defined");
    }
  });

  vapi.on("speech-start", () => {
    if (isTerminatingRef?.current) return;
    console.log("Assistant started speaking");
    setCallStatus("Assistant is speaking...");
  });

  vapi.on("speech-end", () => {
    if (isTerminatingRef?.current) return;
    console.log("Assistant finished speaking");
    setCallStatus("Listening...");
  });

  vapi.on("message", (message: unknown) => {
    // Capture transcript messages for web calls
    try {
      const msg = message as { type?: string; role?: string; transcript?: string; transcriptType?: string } | undefined;
      if (msg?.type === "transcript" && msg.transcript && msg.transcriptType === "final") {
        const role = msg.role === "assistant" ? "assistant" : "user";
        if (onTranscript) {
          onTranscript({ role, message: msg.transcript, isFinal: true });
        }
      }
    } catch {
      console.log("Message received:", message);
    }
  });

  vapi.on("error", (error: unknown) => {
    const message = extractErrorMessage(error);
    const text = safeStringify(error);
    const combined = `${message} ${text}`.toLowerCase();

    // Treat ejection/ended meeting as a normal end (assistant hung up or user ended)
    if (
      combined.includes("ejection") ||
      combined.includes("meeting has ended") ||
      combined.includes("meeting ended") ||
      combined.includes("call ended")
    ) {
      console.log("Call naturally ended:", message || text);
      // Don't show error or change state - call-end event will handle it
      return;
    }

    console.error("Voice call error:", error, text);
    setError(message || "An error occurred during the call");
    setIsCallActive(false);
    setCallStatus("Call failed");
  });

  vapi.on("call-queued", () => {
    console.log("Call queued");
    setCallStatus("Call queued...");
  });

  vapi.on("call-ringing", () => {
    console.log("Call ringing");
    setCallStatus("Call ringing...");
  });

  vapi.on("call-answered", () => {
    console.log("Call answered");
    setCallStatus("Call answered - conversation started");
  });

  vapi.on("call-failed", (error: unknown) => {
    console.error("Call failed:", error);
    setError("Call failed: " + ((error as { message?: string }).message ?? "Unknown error"));
    setIsCallActive(false);
    setCallStatus("Call failed");
  });
};

// Helper function to handle call controls
const handleCallControls = (
  vapi: VapiInstance,
  isCallActive: boolean,
  isMuted: boolean,
  isSpeakerMuted: boolean,
  setIsMuted: (muted: boolean) => void,
  setIsSpeakerMuted: (muted: boolean) => void,
) => {
  const toggleMute = () => {
    if (vapi && isCallActive) {
      try {
        if (isMuted) {
          vapi.setMuted(false);
          setIsMuted(false);
        } else {
          vapi.setMuted(true);
          setIsMuted(true);
        }
      } catch (err) {
        console.error("Error toggling mute:", err);
      }
    }
  };

  const toggleSpeaker = () => {
    if (vapi && isCallActive) {
      try {
        if (typeof vapi.setSpeakerMuted !== "function") {
          console.warn("setSpeakerMuted is not available on Vapi instance; disabling speaker toggle.");
          return;
        }
        if (isSpeakerMuted) {
          vapi.setSpeakerMuted(false);
          setIsSpeakerMuted(false);
        } else {
          vapi.setSpeakerMuted(true);
          setIsSpeakerMuted(true);
        }
      } catch (err) {
        console.error("Error toggling speaker:", err);
      }
    }
  };

  return { toggleMute, toggleSpeaker };
};

// eslint-disable-next-line complexity
export function WebCall({ agent }: WebCallProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [callStatus, setCallStatus] = useState<string>("Initializing...");
  const [error, setError] = useState<string | null>(null);
  const [isVapiReady, setIsVapiReady] = useState(false);
  const vapiRef = useRef<VapiInstance | null>(null);
  const { user } = useAuth();

  type TranscriptMessage = {
    role: "assistant" | "user";
    message: string;
    time?: number;
  };

  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [partialTranscript, setPartialTranscript] = useState<{ user?: string; assistant?: string }>({});
  const liveTranscriptRef = useRef<TranscriptMessage[]>([]);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [callId, setCallId] = useState<string | undefined>();
  const callIdRef = useRef<string | undefined>(undefined);
  const controlUrlRef = useRef<string | undefined>(undefined);
  const isTerminatingRef = useRef<boolean>(false);

  type CallHistoryItem = {
    id: string;
    call_id: string | null;
    transcript_text: string | null;
    transcript_json: unknown | null;
    duration_seconds: number | null;
    created_at: string;
  };

  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([]);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const saveTranscriptToDb = async (transcriptData: TranscriptMessage[], vapiCallId: string) => {
    console.log("saveTranscriptToDb called with", transcriptData.length, "messages");
    if (!user?.id) {
      console.error("No user ID available");
      toast.error("User not authenticated");
      return;
    }

    if (transcriptData.length === 0) {
      console.log("No transcript messages to save");
      toast.info("No conversation to save");
      return;
    }

    setIsLoadingTranscript(true);
    try {
      setCallStatus("Saving transcript...");
      const transcriptText = transcriptData
        .map((msg) => `${msg.role === "assistant" ? "Assistant" : "You"}: ${msg.message}`)
        .join("\n");

      console.log("Saving transcript to DB...");
      const saveResult = await saveAgentTranscript(user.id, agent.id, {
        callId: vapiCallId,
        transcriptText,
        segments: transcriptData.map((msg) => ({
          role: msg.role,
          text: msg.message,
          isFinal: true,
          startedAt: msg.time?.toString(),
        })),
      });
      console.log("Save transcript result:", saveResult);

      if (saveResult.success) {
        // Refresh call history
        console.log("Refreshing call history...");
        await loadCallHistory();
        setCallStatus("Transcript saved");
        toast.success(`Call transcript saved (${transcriptData.length} messages)`);
      } else {
        console.error("Failed to save transcript:", saveResult.error);
        toast.error("Failed to save transcript: " + (saveResult.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error saving transcript:", err);
      setCallStatus("Failed to save transcript");
      toast.error("Failed to save transcript: " + String(err));
    } finally {
      setIsLoadingTranscript(false);
      // Reset terminating guard after post-call work
      isTerminatingRef.current = false;
    }
  };

  const loadCallHistory = async () => {
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
  };

  useEffect(() => {
    // Load call history on mount
    loadCallHistory();
  }, [user?.id, agent.id]);

  useEffect(() => {
    const initializeVapi = async () => {
      try {
        if (typeof window === "undefined") {
          return;
        }

        const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

        if (!publicKey) {
          setError("Voice call system not configured. Please contact support.");
          setCallStatus("Not available");
          return;
        }

        const { default: Vapi } = await import("@vapi-ai/web");

        try {
          vapiRef.current = new Vapi(publicKey) as unknown as VapiInstance;
          setIsVapiReady(true);
          setCallStatus("Ready to call");
        } catch (initError) {
          console.error("Failed to create Vapi instance:", initError);
          setError("Failed to initialize voice call system");
          setCallStatus("Not available");
          setIsVapiReady(false);
          return;
        }

        setupEventListeners(
          vapiRef.current,
          setIsCallActive,
          setCallStatus,
          setError,
          (data: { role: string; message: string; isFinal: boolean }) => {
            // Capture live transcript from web call
            const role = data.role as "assistant" | "user";
            
            if (data.isFinal) {
              console.log("Final transcript received:", role, data.message);
              const newMessage = {
                role,
                message: data.message,
              };
              liveTranscriptRef.current.push(newMessage);
              // Update UI with finalized message
              setTranscript((prev) => [...prev, newMessage]);
              // Clear partial for this role
              setPartialTranscript((prev) => ({ ...prev, [role]: undefined }));
            } else {
              // Show partial/interim transcript in real-time
              console.log("Partial transcript:", role, data.message);
              setPartialTranscript((prev) => ({ ...prev, [role]: data.message }));
            }
          },
          (info?: unknown) => {
            try {
              const maybe = info as { id?: string; monitor?: { controlUrl?: string } } | undefined;
              const vapiCallId = maybe?.id || `${Date.now()}`;
              console.log("Call started with ID:", vapiCallId);
              setCallId(vapiCallId);
              callIdRef.current = vapiCallId;
              controlUrlRef.current = maybe?.monitor?.controlUrl;
              setTranscript([]); // Clear previous transcript
              setPartialTranscript({}); // Clear partial transcript
              liveTranscriptRef.current = []; // Clear live transcript buffer
            } catch {
              const fallbackId = `${Date.now()}`;
              setCallId(fallbackId);
              callIdRef.current = fallbackId;
              setTranscript([]);
              setPartialTranscript({});
              liveTranscriptRef.current = [];
            }
          },
          async () => {
            // On call end, save captured live transcript
            try {
              const currentCallId = callIdRef.current;
              console.log("Call ended, saving live transcript. CallId:", currentCallId);
              console.log("Captured messages:", liveTranscriptRef.current.length);
              
              if (!currentCallId) {
                console.warn("No callId available");
                toast.error("No call ID available");
                return;
              }

              const capturedTranscript = [...liveTranscriptRef.current];
              setTranscript(capturedTranscript);
              
              // Save to DB
              await saveTranscriptToDb(capturedTranscript, currentCallId);
            } catch (e) {
              console.error("Failed to save transcript:", e);
              toast.error("Failed to save transcript");
            }
          },
          undefined, // No finalizeDraft needed
          isTerminatingRef,
        );
      } catch (err) {
        console.error("Failed to initialize voice call system:", err);
        setError("Failed to initialize voice call system");
      }
    };

    initializeVapi();

    return () => {
      try {
        if (vapiRef.current && isCallActive) {
          vapiRef.current.stop();
        }
      } catch {
        // ignore
      }
    };
  }, []);

  const startCall = async () => {
    if (!vapiRef.current || !agent.vapi_assistant_id) {
      setError("Assistant not properly configured or voice system not available");
      return;
    }

    // Preflight checks to surface common issues early
    try {
      if (typeof window !== "undefined" && !window.isSecureContext) {
        console.warn("WebCall: Not a secure context (https/local), microphone may fail");
      }
      // Ensure microphone permission prompts before SDK tries to start
      if (navigator?.mediaDevices?.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (permErr) {
      const msg = extractErrorMessage(permErr);
      setError(msg || "Microphone permission denied or not available");
      setCallStatus("Call failed");
      return;
    }

    try {
      setError(null);
      setCallStatus("Starting call...");

      // Start call using the assistant ID with tuned configuration to avoid unwanted cutoffs
      const callResponse = await vapiRef.current.start(agent.vapi_assistant_id, {
        // Use sane, higher thresholds rather than 0 which some providers treat as immediate timeout
        customerJoinTimeoutSeconds: 120,
        silenceTimeoutSeconds: 120,
      });
      console.log("Call started successfully:", callResponse);
      try {
        const info = callResponse as { id?: string; monitor?: { controlUrl?: string } } | undefined;
        if (info?.id) {
          setCallId(info.id);
          callIdRef.current = info.id;
        }
        if (info?.monitor?.controlUrl) controlUrlRef.current = info.monitor.controlUrl;
      } catch {}

      // Set a timeout to handle cases where call doesn't connect
      setTimeout(() => {
        if (callStatus === "Starting call...") {
          setCallStatus("Call connecting...");
        }
      }, 5000);
    } catch (err) {
      const msg = extractErrorMessage(err);
      const details = safeStringify(err);
      console.error("Failed to start call:", err, details);
      setError(msg || "Failed to start call. Please try again.");
      setCallStatus("Call failed");
    }
  };

  const endCall = async () => {
    if (!vapiRef.current) return;
    try {
      isTerminatingRef.current = true;
      setCallStatus("Ending call...");
      console.log("Stopping web call via SDK...");
      // For web calls, SDK stop() is sufficient - no need to call server API
      await (vapiRef.current as unknown as { stop: () => Promise<void> | void }).stop();
      console.log("Web call stopped, SDK should fire call-end event");
      // Let the call-end event handler take care of status and transcript fetching
    } catch (err) {
      console.error("Error ending call:", err);
      // Fallback: update UI if SDK throws
      setIsCallActive(false);
      setCallStatus("Call ended");
      isTerminatingRef.current = false;
    }
  };

  const { toggleMute, toggleSpeaker } = vapiRef.current
    ? handleCallControls(vapiRef.current, isCallActive, isMuted, isSpeakerMuted, setIsMuted, setIsSpeakerMuted)
    : { toggleMute: () => {}, toggleSpeaker: () => {} };

  const canToggleMute = isCallActive && !!vapiRef.current;
  const canToggleSpeaker = isCallActive && typeof vapiRef.current?.setSpeakerMuted === "function";

  // Auto-scroll transcript container as new messages arrive
  useEffect(() => {
    try {
      const el = document.getElementById("transcript-container");
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch {
      // ignore
    }
  }, [transcript]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Phone className="mr-2 inline-block size-5" />
          Web Voice Call
        </CardTitle>
        <CardDescription>Test your assistant directly in the browser with voice conversation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 text-center">
          <div className="text-muted-foreground text-sm">
            Status: <span className="font-medium">{callStatus}</span>
          </div>

          <div className="flex justify-center gap-3">
            {!isCallActive ? (
              <Button
                onClick={startCall}
                size="lg"
                disabled={!agent.vapi_assistant_id || !isVapiReady || callStatus === "Not available"}
              >
                <Phone className="mr-2 size-4" />
                {callStatus === "Not available"
                  ? "Not Available"
                  : callStatus === "Initializing..."
                    ? "Initializing..."
                    : callStatus === "Call failed"
                      ? "Retry Call"
                      : "Start Call"}
              </Button>
            ) : (
              <>
                <Button onClick={endCall} variant="destructive" size="lg">
                  <PhoneOff className="mr-2 size-4" />
                  End Call
                </Button>
                <Button onClick={toggleMute} variant="outline" size="lg" disabled={!canToggleMute}>
                  {isMuted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                </Button>
                <Button onClick={toggleSpeaker} variant="outline" size="lg" disabled={!canToggleSpeaker}>
                  {isSpeakerMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </Button>
              </>
            )}
          </div>

          {isCallActive && (
            <div className="text-muted-foreground space-y-1 text-xs">
              <p>• Speak naturally - the assistant will respond</p>
              <p>• Use the mute button to stop speaking</p>
              <p>• Use the speaker button to mute/unmute the assistant</p>
            </div>
          )}

          {!isCallActive && callStatus !== "Not available" && (
            <div className="text-muted-foreground space-y-1 text-xs">
              <p>• Make sure your microphone is enabled</p>
              <p>• Speak clearly and wait for responses</p>
              <p>• Use the controls to manage the call</p>
            </div>
          )}

          {!agent.vapi_assistant_id && (
            <Alert>
              <AlertDescription>
                This assistant is not properly configured. Please recreate the assistant.
              </AlertDescription>
            </Alert>
          )}

          {(transcript.length > 0 || Object.keys(partialTranscript).length > 0) && (
            <div className="text-left">
              <div className="mt-4 text-sm font-medium">
                {isCallActive ? "Live Transcript" : "Call Transcript"}
              </div>
              <div className="bg-muted/40 mt-2 max-h-64 overflow-auto rounded-md p-3 text-left" id="transcript-container">
                <div className="space-y-3">
                  {transcript.map((msg, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="text-muted-foreground mb-1 text-xs font-medium">
                        {msg.role === "assistant" ? "Assistant" : "You"}
                        {msg.time && <span className="ml-2">({msg.time.toFixed(1)}s)</span>}
                      </div>
                      <div className="rounded-md bg-background/50 p-2">{msg.message}</div>
                    </div>
                  ))}
                  
                  {/* Show partial/interim transcripts in real-time */}
                  {partialTranscript.user && (
                    <div className="text-sm animate-pulse">
                      <div className="text-muted-foreground mb-1 text-xs font-medium">You (speaking...)</div>
                      <div className="rounded-md bg-background/50 p-2 italic opacity-70">{partialTranscript.user}</div>
                    </div>
                  )}
                  {partialTranscript.assistant && (
                    <div className="text-sm animate-pulse">
                      <div className="text-muted-foreground mb-1 text-xs font-medium">Assistant (speaking...)</div>
                      <div className="rounded-md bg-background/50 p-2 italic opacity-70">{partialTranscript.assistant}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {isLoadingTranscript && (
            <div className="text-muted-foreground mt-4 text-center text-sm">
              <div className="mx-auto mb-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Loading transcript...
            </div>
          )}

          {/* Call History */}
          {!isCallActive && (
            <div className="mt-8 text-left">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium">Call History</h3>
                <Button variant="outline" size="sm" onClick={loadCallHistory} disabled={isLoadingHistory}>
                  {isLoadingHistory ? "Loading..." : "Refresh"}
                </Button>
              </div>

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
                      <div key={call.id} className="border rounded-md overflow-hidden">
                        <button
                          onClick={() => setExpandedCallId(isExpanded ? null : call.id)}
                          className="bg-muted/30 hover:bg-muted/50 w-full px-4 py-3 text-left transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <span>{date.toLocaleDateString()} {date.toLocaleTimeString()}</span>
                              {call.duration_seconds && (
                                <span className="text-muted-foreground text-xs">
                                  {Math.floor(call.duration_seconds / 60)}m {call.duration_seconds % 60}s
                                </span>
                              )}
                              {call.call_id && (
                                <span className="font-mono text-xs">{call.call_id.substring(0, 12)}...</span>
                              )}
                              <span className="text-muted-foreground text-xs">
                                {transcriptMessages.length} messages
                              </span>
                            </div>
                            <span className="text-muted-foreground text-xs">{isExpanded ? "Hide" : "Show"}</span>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="bg-background p-4">
                            <div className="space-y-3">
                              {transcriptMessages.length > 0 ? (
                                transcriptMessages.map((msg, idx) => (
                                  <div key={idx} className="text-sm">
                                    <div className="text-muted-foreground mb-1 text-xs font-medium">
                                      {msg.role === "assistant" ? "Assistant" : "You"}
                                      {msg.time && <span className="ml-2">({msg.time.toFixed(1)}s)</span>}
                                    </div>
                                    <div className="bg-muted/40 rounded-md p-2">{msg.message}</div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-muted-foreground text-sm">
                                  {call.transcript_text || "No transcript available"}
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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
