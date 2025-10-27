"use client";

import { useState } from "react";

import { Play, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VOICE_MODELS, VOICE_TONES } from "@/types/onboarding";

interface VoiceSelectionStepProps {
  onNext: (data: { voice_model: string; voice_tone: "friendly" | "formal" | "energetic" }) => void;
  onSkip: () => void;
  onBack: () => void;
  initialData?: Partial<{ voice_model: string; voice_tone: "friendly" | "formal" | "energetic" }>;
  isLoading?: boolean;
}

export function VoiceSelectionStep({ onNext, onSkip, onBack, initialData, isLoading }: VoiceSelectionStepProps) {
  const [selectedVoice, setSelectedVoice] = useState(initialData?.voice_model ?? VOICE_MODELS[0].id);
  const [selectedTone, setSelectedTone] = useState<"friendly" | "formal" | "energetic">(
    initialData?.voice_tone ?? "friendly",
  );
  const [isPlaying, setIsPlaying] = useState(false);

  const selectedVoiceModel = VOICE_MODELS.find((v) => v.id === selectedVoice);

  const handlePlaySample = () => {
    setIsPlaying(true);
    // Mock play functionality
    setTimeout(() => {
      setIsPlaying(false);
    }, 2000);
  };

  const handleContinue = () => {
    onNext({
      voice_model: selectedVoice,
      voice_tone: selectedTone,
    });
  };

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
      <div className="space-y-2 text-left">
        <h1 className="text-2xl font-medium">Choose Your AI Voice</h1>
        <p className="text-muted-foreground text-sm">Let users pick their preferred assistant tone.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium">Voice Model</label>
          <div className="grid grid-cols-2 gap-3">
            {VOICE_MODELS.map((voice) => (
              <Card
                key={voice.id}
                className={`cursor-pointer transition-colors ${
                  selectedVoice === voice.id ? "border-primary bg-primary/5" : "hover:bg-accent/50"
                }`}
                onClick={() => setSelectedVoice(voice.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                      <Volume2 className="text-primary size-6" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{voice.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {voice.gender} • {voice.tone}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlaySample();
                      }}
                      disabled={isPlaying}
                      className="w-full"
                    >
                      {isPlaying ? <Volume2 className="size-3 animate-pulse" /> : <Play className="size-3" />}
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Voice Tone</label>
          <Select
            value={selectedTone}
            onValueChange={(value: "friendly" | "formal" | "energetic") => setSelectedTone(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent>
              {VOICE_TONES.map((tone) => (
                <SelectItem key={tone.value} value={tone.value}>
                  {tone.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedVoiceModel && (
          <div className="bg-muted/50 rounded-md p-3">
            <p className="text-muted-foreground text-sm">
              Selected: <span className="font-medium">{selectedVoiceModel.name}</span> ({selectedVoiceModel.gender},{" "}
              {selectedTone})
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleContinue} className="flex-1" disabled={isLoading}>
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              "Continue"
            )}
          </Button>
          <Button variant="outline" onClick={onSkip}>
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}
