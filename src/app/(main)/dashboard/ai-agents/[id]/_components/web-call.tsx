"use client";

import { useState, useEffect, useRef } from "react";

import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

// Helper function to setup event listeners
const setupEventListeners = (
  vapi: VapiInstance,
  setIsCallActive: (active: boolean) => void,
  setCallStatus: (status: string) => void,
  setError: (error: string | null) => void,
) => {
  vapi.on("call-start", () => {
    console.log("Call started");
    setIsCallActive(true);
    setCallStatus("Call in progress...");
    setError(null);
  });

  vapi.on("call-end", () => {
    console.log("Call ended");
    setIsCallActive(false);
    setCallStatus("Call ended");
  });

  vapi.on("speech-start", () => {
    console.log("Assistant started speaking");
    setCallStatus("Assistant is speaking...");
  });

  vapi.on("speech-end", () => {
    console.log("Assistant finished speaking");
    setCallStatus("Listening...");
  });

  vapi.on("message", (message: unknown) => {
    console.log("Message received:", message);
  });

  vapi.on("error", (error: unknown) => {
    const message = (error as { message?: string }).message ?? "";
    const text = String(error ?? "");
    const combined = `${message} ${text}`.toLowerCase();

    // Treat ejection/ended meeting as a normal end (assistant hung up)
    if (combined.includes("ejection") || combined.includes("meeting has ended") || combined.includes("ended")) {
      console.warn("Call ended by assistant:", error);
      setError(null);
      setIsCallActive(false);
      setCallStatus("Call ended by assistant");
      return;
    }

    console.error("Voice call error:", error);
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
  const [callStatus, setCallStatus] = useState<string>("Ready to call");
  const [error, setError] = useState<string | null>(null);
  const vapiRef = useRef<VapiInstance | null>(null);

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
        } catch (initError) {
          console.error("Failed to create Vapi instance:", initError);
          setError("Failed to initialize voice call system");
          setCallStatus("Not available");
          return;
        }

        setupEventListeners(vapiRef.current, setIsCallActive, setCallStatus, setError);
      } catch (err) {
        console.error("Failed to initialize voice call system:", err);
        setError("Failed to initialize voice call system");
      }
    };

    initializeVapi();

    return () => {
      if (vapiRef.current && isCallActive) {
        vapiRef.current.stop();
      }
    };
  }, [isCallActive]);

  const startCall = async () => {
    if (!vapiRef.current || !agent.vapi_assistant_id) {
      setError("Assistant not properly configured or voice system not available");
      return;
    }

    try {
      setError(null);
      setCallStatus("Starting call...");

      // Start call using the assistant ID with additional configuration
      const callResponse = await vapiRef.current.start(agent.vapi_assistant_id, {
        customerJoinTimeoutSeconds: 30,
        silenceTimeoutSeconds: 30,
      });
      console.log("Call started successfully:", callResponse);

      // Set a timeout to handle cases where call doesn't connect
      setTimeout(() => {
        if (callStatus === "Starting call...") {
          setCallStatus("Call connecting...");
        }
      }, 5000);
    } catch (err) {
      console.error("Failed to start call:", err);
      setError("Failed to start call. Please try again.");
      setCallStatus("Call failed");
    }
  };

  const endCall = () => {
    if (vapiRef.current) {
      try {
        vapiRef.current.stop();
        console.log("Call ended manually");
      } catch (err) {
        console.error("Error ending call:", err);
      }
    }
    setIsCallActive(false);
    setCallStatus("Call ended");
  };

  const { toggleMute, toggleSpeaker } = vapiRef.current
    ? handleCallControls(vapiRef.current, isCallActive, isMuted, isSpeakerMuted, setIsMuted, setIsSpeakerMuted)
    : { toggleMute: () => {}, toggleSpeaker: () => {} };

  const canToggleMute = isCallActive && !!vapiRef.current;
  const canToggleSpeaker = isCallActive && typeof vapiRef.current?.setSpeakerMuted === "function";

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
                disabled={!agent.vapi_assistant_id || !vapiRef.current || callStatus === "Not available"}
              >
                <Phone className="mr-2 size-4" />
                {callStatus === "Not available"
                  ? "Not Available"
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
        </div>
      </CardContent>
    </Card>
  );
}
