/* eslint-disable max-lines */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";

import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/use-auth";
import { saveAgentTranscript } from "@/server/agents-actions";
import type { Agent } from "@/types/agents";

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
  if (err instanceof Error) return err.message ?? err.name;
  const asObj = err as { message?: string; error?: string; reason?: string } | undefined;
  return asObj?.message ?? asObj?.error ?? asObj?.reason ?? String(err ?? "Unknown error");
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
    if (!isCallActive) return;
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
  };

  const toggleSpeaker = () => {
    if (!isCallActive) return;
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
  const callIdRef = useRef<string | undefined>(undefined);
  const controlUrlRef = useRef<string | undefined>(undefined);
  const isTerminatingRef = useRef<boolean>(false);

  const saveTranscriptToDb = useCallback(
    async (transcriptData: TranscriptMessage[], vapiCallId: string) => {
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
          setCallStatus("Transcript saved");
          toast.success(`Call transcript saved (${transcriptData.length} messages)`);
        } else {
          console.error("Failed to save transcript:", saveResult.error);
          toast.error("Failed to save transcript: " + (saveResult.error ?? "Unknown error"));
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
    },
    [user?.id, agent.id],
  );

  // Extract callbacks to reduce complexity
  const handleTranscript = useCallback((data: { role: string; message: string; isFinal: boolean }) => {
    const role = data.role as "assistant" | "user";

    if (data.isFinal) {
      console.log("Final transcript received:", role, data.message);
      const newMessage = {
        role,
        message: data.message,
      };
      liveTranscriptRef.current.push(newMessage);
      setTranscript((prev) => [...prev, newMessage]);
      setPartialTranscript((prev) => ({ ...prev, [role]: undefined }));
    } else {
      console.log("Partial transcript:", role, data.message);
      setPartialTranscript((prev) => ({ ...prev, [role]: data.message }));
    }
  }, []);

  const handleCallStart = useCallback((info?: unknown) => {
    try {
      const maybe = info as { id?: string; monitor?: { controlUrl?: string } } | undefined;
      const vapiCallId = maybe?.id ?? `${Date.now()}`;
      console.log("Call started with ID:", vapiCallId);
      callIdRef.current = vapiCallId;
      controlUrlRef.current = maybe?.monitor?.controlUrl;
      setTranscript([]);
      setPartialTranscript({});
      liveTranscriptRef.current = [];
    } catch {
      const fallbackId = `${Date.now()}`;
      callIdRef.current = fallbackId;
      setTranscript([]);
      setPartialTranscript({});
      liveTranscriptRef.current = [];
    }
  }, []);

  const handleCallEnd = useCallback(async () => {
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
      await saveTranscriptToDb(capturedTranscript, currentCallId);
    } catch (e) {
      console.error("Failed to save transcript:", e);
      toast.error("Failed to save transcript");
    }
  }, [saveTranscriptToDb]);

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
          handleTranscript,
          handleCallStart,
          handleCallEnd,
          undefined,
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
  }, [handleTranscript, handleCallStart, handleCallEnd, isCallActive]);

  const checkMicrophonePermission = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!window.isSecureContext) {
      console.warn("WebCall: Not a secure context (https/local), microphone may fail");
    }
    if (navigator.mediaDevices?.getUserMedia) {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    }
  }, []);

  const extractCallInfo = useCallback((callResponse: unknown) => {
    try {
      const info = callResponse as { id?: string; monitor?: { controlUrl?: string } } | undefined;
      if (info?.id) {
        callIdRef.current = info.id;
      }
      if (info?.monitor?.controlUrl) {
        controlUrlRef.current = info.monitor.controlUrl;
      }
    } catch {
      // Ignore errors when extracting call info
    }
  }, []);

  const startCall = async () => {
    if (!vapiRef.current || !agent.vapi_assistant_id) {
      setError("Assistant not properly configured or voice system not available");
      return;
    }

    try {
      await checkMicrophonePermission();
    } catch (permErr) {
      const msg = extractErrorMessage(permErr);
      setError(msg ?? "Microphone permission denied or not available");
      setCallStatus("Call failed");
      return;
    }

    try {
      setError(null);
      setCallStatus("Starting call...");

      const callResponse = await vapiRef.current.start(agent.vapi_assistant_id, {
        customerJoinTimeoutSeconds: 120,
        silenceTimeoutSeconds: 120,
      });
      console.log("Call started successfully:", callResponse);
      extractCallInfo(callResponse);

      setTimeout(() => {
        setCallStatus((prev) => (prev === "Starting call..." ? "Call connecting..." : prev));
      }, 5000);
    } catch (err) {
      const msg = extractErrorMessage(err);
      const details = safeStringify(err);
      console.error("Failed to start call:", err, details);
      setError(msg ?? "Failed to start call. Please try again.");
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
              <div className="mt-4 text-sm font-medium">{isCallActive ? "Live Transcript" : "Call Transcript"}</div>
              <div
                className="bg-muted/40 mt-2 max-h-64 overflow-auto rounded-md p-3 text-left"
                id="transcript-container"
              >
                <div className="space-y-3">
                  {transcript.map((msg, idx) => {
                    const msgHash = `${msg.role}-${msg.message.substring(0, 30)}-${idx}`;
                    return (
                      <div key={msgHash} className="text-sm">
                        <div className="text-muted-foreground mb-1 text-xs font-medium">
                          {msg.role === "assistant" ? "Assistant" : "You"}
                          {msg.time && <span className="ml-2">({msg.time.toFixed(1)}s)</span>}
                        </div>
                        <div className="bg-background/50 rounded-md p-2">{msg.message}</div>
                      </div>
                    );
                  })}

                  {/* Show partial/interim transcripts in real-time */}
                  {partialTranscript.user && (
                    <div className="animate-pulse text-sm">
                      <div className="text-muted-foreground mb-1 text-xs font-medium">You (speaking...)</div>
                      <div className="bg-background/50 rounded-md p-2 italic opacity-70">{partialTranscript.user}</div>
                    </div>
                  )}
                  {partialTranscript.assistant && (
                    <div className="animate-pulse text-sm">
                      <div className="text-muted-foreground mb-1 text-xs font-medium">Assistant (speaking...)</div>
                      <div className="bg-background/50 rounded-md p-2 italic opacity-70">
                        {partialTranscript.assistant}
                      </div>
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
        </div>
      </CardContent>
    </Card>
  );
}
