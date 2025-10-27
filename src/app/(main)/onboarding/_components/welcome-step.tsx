"use client";

import { Button } from "@/components/ui/button";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
      <div className="space-y-4 text-left">
        <h1 className="text-3xl font-medium">Let&apos;s set up your AI Voice Assistant in 3 minutes.</h1>
        <p className="text-muted-foreground text-sm">
          You&apos;ll connect your phone number, choose a voice, and you&apos;re ready to take calls.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 mt-0.5 rounded-full p-2">
              <div className="bg-primary size-2 rounded-full" />
            </div>
            <div>
              <h3 className="font-medium">Business Information</h3>
              <p className="text-muted-foreground text-sm">Tell us about your business and preferences</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-primary/10 mt-0.5 rounded-full p-2">
              <div className="bg-primary size-2 rounded-full" />
            </div>
            <div>
              <h3 className="font-medium">Phone Setup</h3>
              <p className="text-muted-foreground text-sm">Get a new number or connect your existing one</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-primary/10 mt-0.5 rounded-full p-2">
              <div className="bg-primary size-2 rounded-full" />
            </div>
            <div>
              <h3 className="font-medium">Voice Selection</h3>
              <p className="text-muted-foreground text-sm">Choose your AI assistant&apos;s voice and tone</p>
            </div>
          </div>
        </div>

        <Button className="w-full" onClick={onNext}>
          Get Started
        </Button>
      </div>
    </div>
  );
}
