"use client";

import { useState } from "react";

import { Phone, CheckCircle, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TestAssistantStepProps {
  onNext: (stepData?: { test_call_completed: boolean }) => Promise<void>;
  onSkip: () => Promise<void>;
  onBack: () => void;
  initialData?: Partial<{ test_call_completed: boolean }>;
  isLoading?: boolean;
}

export function TestAssistantStep({ onNext, onSkip, onBack, initialData, isLoading }: TestAssistantStepProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testCompleted, setTestCompleted] = useState(initialData?.test_call_completed ?? false);
  const [showTranscript, setShowTranscript] = useState(initialData?.test_call_completed ?? false);

  const handleTestCall = () => {
    setIsTesting(true);

    // Mock test call process
    setTimeout(() => {
      setIsTesting(false);
      setTestCompleted(true);
      setShowTranscript(true);
    }, 3000);
  };

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
      <div className="space-y-2 text-left">
        <h1 className="text-2xl font-medium">Test Your Assistant</h1>
        <p className="text-muted-foreground text-sm">Make the user feel the magic with a test call.</p>
      </div>

      <div className="space-y-6">
        {!testCompleted ? (
          <Card className="border">
            <CardHeader>
              <CardTitle className="text-base">One-click Test Call</CardTitle>
              <CardDescription className="text-sm">
                AI will greet you, ask a simple question, and summarize the conversation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleTestCall} disabled={isTesting} className="w-full" size="lg">
                {isTesting ? (
                  <>
                    <Phone className="size-4 animate-pulse" />
                    Testing your assistant...
                  </>
                ) : (
                  <>
                    <Phone className="size-4" />
                    Test Call
                  </>
                )}
              </Button>
              <div className="mt-3 flex gap-3">
                <Button variant="outline" onClick={onBack} className="flex-1">
                  Back
                </Button>
                <Button variant="outline" onClick={onSkip} className="flex-1">
                  Skip
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3">
              <CheckCircle className="size-5 text-green-600" />
              <span className="text-sm text-green-800">Test call completed successfully!</span>
            </div>

            <div className="bg-primary/5 border-primary/20 rounded-md border p-4">
              <h3 className="text-primary mb-2 font-medium">Your AI Assistant is live and ready!</h3>
              <p className="text-primary/80 text-sm">
                Ready to answer calls, messages, and voicemails with intelligent responses.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
              <Button
                onClick={() => onNext({ test_call_completed: true })}
                className="flex-1"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Completing..." : "Complete Setup"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
