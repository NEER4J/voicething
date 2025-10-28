"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export enum SetupStep {
  BASICS = "basics",
  PERSONALITY = "personality",
  PREVIEW = "preview",
}

interface SetupProgressProps {
  currentStep: SetupStep;
}

const steps = [
  { id: SetupStep.BASICS, title: "Basics", number: 1 },
  { id: SetupStep.PERSONALITY, title: "Personality", number: 2 },
  { id: SetupStep.PREVIEW, title: "Create", number: 3 },
];

export function SetupProgress({ currentStep }: SetupProgressProps) {
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex flex-1 items-center hidden">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary bg-background text-primary",
                    !isCompleted && !isCurrent && "border-muted-foreground/30 bg-background text-muted-foreground",
                  )}
                >
                  {isCompleted ? <Check className="size-5" /> : <span className="text-sm font-medium">{step.number}</span>}
                </div>
                <span
                  className={cn(
                    "mt-2 text-sm font-medium",
                    isCurrent && "text-primary",
                    !isCurrent && "text-muted-foreground",
                  )}
                >
                  {step.title}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 transition-colors",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/30",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

