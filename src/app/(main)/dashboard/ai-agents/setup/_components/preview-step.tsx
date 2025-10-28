"use client";

import { CheckCircle2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BUSINESS_TYPES, LANGUAGES, TONES, VOICE_OPTIONS, type AgentFormData } from "@/types/agents";

interface PreviewStepProps {
  onBack: () => void;
  onCreate: () => void;
  formData: Partial<AgentFormData>;
  isLoading?: boolean;
  isSuccess?: boolean;
}

// Helper component for success state
const SuccessState = ({ formData }: { formData: Partial<AgentFormData> }) => (
  <div className="mx-auto flex w-full flex-col items-center justify-center space-y-8 text-center sm:w-[500px]">
    <div className="bg-primary/10 flex size-20 items-center justify-center rounded-full">
      <CheckCircle2 className="text-primary size-10" />
    </div>
    <div className="space-y-2">
      <h1 className="text-3xl font-medium">Your AI Assistant is Ready!</h1>
      <p className="text-muted-foreground text-sm">
        <strong>{formData.name}</strong> has been created successfully and is ready to start handling calls and messages.
      </p>
    </div>
    <div className="flex gap-3">
      <Button size="lg" onClick={() => (window.location.href = "/dashboard/ai-agents/test")}>
        <Sparkles />
        Test My Assistant
      </Button>
      <Button variant="outline" size="lg" onClick={() => (window.location.href = "/dashboard/ai-agents")}>
        View All Agents
      </Button>
    </div>
  </div>
);

// Helper component for agent summary row
const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <>
    <div className="flex justify-between">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
    <Separator />
  </>
);

// Helper component for greeting message display
const GreetingMessage = ({ message }: { message: string }) => (
  <>
    <Separator />
    <div className="space-y-2">
      <span className="text-muted-foreground text-sm font-medium">Greeting Message</span>
      <p className="bg-muted rounded-md p-3 text-sm italic">&quot;{message}&quot;</p>
    </div>
  </>
);

// Helper component for summary content
const SummaryContent = ({ formData, businessType, language, tone, voice }: {
  formData: Partial<AgentFormData>;
  businessType: { label: string } | undefined;
  language: { label: string } | undefined;
  tone: { label: string } | undefined;
  voice: { name: string; gender: string } | undefined;
}) => (
  <div className="space-y-3">
    <SummaryRow label="Name" value={formData.name ?? "—"} />
    <SummaryRow label="Business Type" value={businessType?.label ?? "—"} />
    <SummaryRow label="Language" value={language?.label ?? "—"} />
    <SummaryRow label="Voice" value={`${voice?.name ?? "—"} (${voice?.gender})`} />
    <SummaryRow label="Tone" value={tone?.label ?? "—"} />
  </div>
);

// Helper component for agent summary
const AgentSummary = ({ formData, businessType, language, tone, voice }: {
  formData: Partial<AgentFormData>;
  businessType: { label: string } | undefined;
  language: { label: string } | undefined;
  tone: { label: string } | undefined;
  voice: { name: string; gender: string } | undefined;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Assistant Summary</CardTitle>
      <CardDescription>Here&apos;s what your AI assistant will be like</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <SummaryContent 
        formData={formData} 
        businessType={businessType} 
        language={language} 
        tone={tone} 
        voice={voice} 
      />
      {formData.greeting_message && <GreetingMessage message={formData.greeting_message} />}
    </CardContent>
  </Card>
);

export function PreviewStep({ onBack, onCreate, formData, isLoading, isSuccess }: PreviewStepProps) {
  const businessType = BUSINESS_TYPES.find((bt) => bt.value === formData.business_type);
  const language = LANGUAGES.find((l) => l.value === formData.language);
  const tone = TONES.find((t) => t.value === formData.tone);
  const voice = VOICE_OPTIONS.find((v) => v.id === formData.voice_id);

  if (isSuccess) {
    return <SuccessState formData={formData} />;
  }

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[500px]">
      <div className="space-y-2 text-left">
        <h1 className="text-2xl font-medium">Almost done!</h1>
        <p className="text-muted-foreground text-sm">Review your assistant&apos;s configuration before creating.</p>
      </div>

      <AgentSummary 
        formData={formData} 
        businessType={businessType} 
        language={language} 
        tone={tone} 
        voice={voice} 
      />

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button onClick={onCreate} className="flex-1" disabled={isLoading}>
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <>
              <Sparkles />
              Create My Assistant
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

