"use client";

import { Progress } from "@/components/ui/progress";
import { OnboardingStep } from "@/types/onboarding";

interface OnboardingProgressProps {
  currentStep: OnboardingStep;
}

const stepOrder = [
  OnboardingStep.WELCOME,
  OnboardingStep.BUSINESS_INFO,
  OnboardingStep.PHONE_SETUP,
  OnboardingStep.VOICE_SELECTION,
  OnboardingStep.CHANNELS,
  OnboardingStep.TEST_ASSISTANT,
];

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  const currentIndex = stepOrder.indexOf(currentStep);
  const progress = ((currentIndex + 1) / stepOrder.length) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Step {currentIndex + 1} of {stepOrder.length}
        </span>
        <span className="font-medium">{Math.round(progress)}% Complete</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
