"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { TONES, VOICE_OPTIONS, GREETING_TEMPLATES, type BusinessType } from "@/types/agents";

const FormSchema = z.object({
  tone: z.enum(["friendly", "professional", "energetic"]),
  voice_id: z.string().min(1, "Please select a voice"),
  voice_name: z.string(),
  greeting_message: z.string().min(10, "Greeting message should be at least 10 characters"),
});

export type PersonalityFormData = z.infer<typeof FormSchema>;

interface PersonalityStepProps {
  onNext: (data: PersonalityFormData) => void;
  onBack: () => void;
  initialData?: Partial<PersonalityFormData> & { business_type?: BusinessType; name?: string };
  isLoading?: boolean;
}

// Helper component for tone selection
const ToneSelection = ({ selectedTone, onToneChange }: {
  selectedTone: string;
  onToneChange: (tone: string) => void;
}) => (
  <div className="grid grid-cols-3 gap-3">
    {TONES.map((tone) => (
      <Card
        key={tone.value}
        className={cn(
          "cursor-pointer transition-colors",
          selectedTone === tone.value ? "border-primary bg-primary/5" : "hover:bg-accent/50",
        )}
        onClick={() => onToneChange(tone.value)}
      >
        <CardHeader className="p-4 text-center">
          <CardTitle className="text-sm">{tone.label}</CardTitle>
          <CardDescription className="text-xs">{tone.description}</CardDescription>
        </CardHeader>
      </Card>
    ))}
  </div>
);

// Helper component for voice selection
const VoiceSelection = ({ selectedVoiceId, onVoiceSelect }: {
  selectedVoiceId: string;
  onVoiceSelect: (voiceId: string) => void;
}) => (
  <div className="grid grid-cols-2 gap-3">
    {VOICE_OPTIONS.map((voice) => (
      <Card
        key={voice.id}
        className={cn(
          "cursor-pointer transition-colors",
          selectedVoiceId === voice.id ? "border-primary bg-primary/5" : "hover:bg-accent/50",
        )}
        onClick={() => onVoiceSelect(voice.id)}
      >
        <CardHeader className="p-4">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
                <Volume2 className="text-primary size-5" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-sm">{voice.name}</CardTitle>
                <CardDescription className="text-xs">
                  {voice.gender} • {voice.provider}
                </CardDescription>
              </div>
            </div>
            <p className="text-muted-foreground text-xs">{voice.description}</p>
          </div>
        </CardHeader>
      </Card>
    ))}
  </div>
);

// Helper function to handle form submission
const handleFormSubmit = (form: any, onNext: (data: PersonalityFormData) => void) => {
  const onSubmit = (data: PersonalityFormData) => {
    onNext(data);
  };
  return onSubmit;
};

export function PersonalityStep({ onNext, onBack, initialData, isLoading }: PersonalityStepProps) {
  // Generate default greeting based on business type
  const defaultGreeting =
    initialData?.greeting_message ??
    (initialData?.business_type
      ? GREETING_TEMPLATES[initialData.business_type].replace("[Business Name]", initialData.name ?? "us")
      : "Hi! Thank you for calling. How can I assist you today?");

  const form = useForm<PersonalityFormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      tone: initialData?.tone ?? "friendly",
      voice_id: initialData?.voice_id ?? "elliot",
      voice_name: initialData?.voice_name ?? "Elliot",
      greeting_message: defaultGreeting,
    },
  });

  const selectedTone = form.watch("tone");
  const selectedVoiceId = form.watch("voice_id");
  const greetingMessage = form.watch("greeting_message");

  const handleVoiceSelect = (voiceId: string) => {
    const voice = VOICE_OPTIONS.find((v) => v.id === voiceId);
    if (voice) {
      form.setValue("voice_id", voice.id);
      form.setValue("voice_name", voice.name);
    }
  };

  const onSubmit = handleFormSubmit(form, onNext);

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[600px]">
      <div className="space-y-2 text-left">
        <h1 className="text-2xl font-medium">How should your assistant sound?</h1>
        <p className="text-muted-foreground text-sm">Choose the voice and personality that best represents your brand.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="tone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tone</FormLabel>
                <ToneSelection selectedTone={selectedTone} onToneChange={field.onChange} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="voice_id"
            render={() => (
              <FormItem>
                <FormLabel>Voice Selection</FormLabel>
                <VoiceSelection selectedVoiceId={selectedVoiceId} onVoiceSelect={handleVoiceSelect} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="greeting_message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Greeting Message (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter the first message your assistant will say..."
                    className="min-h-[100px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {greetingMessage.length} characters. This is what callers will hear first.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
