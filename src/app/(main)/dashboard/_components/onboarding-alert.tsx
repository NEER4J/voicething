"use client";

import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface OnboardingAlertProps {}

export function OnboardingAlert({}: OnboardingAlertProps) {
  return (
    <div className="border-primary/20 bg-primary/5 rounded-md border p-3">
      <div className="space-y-2">
        <p className="text-primary text-sm font-medium">Complete your setup</p>
        <p className="text-primary/80 text-xs">Unlock all features of your AI Voice Assistant.</p>
        <Button asChild size="sm" variant="default" className="w-full">
          <Link href="/onboarding" className="flex items-center gap-1">
            Complete Setup
            <ArrowRight className="size-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
