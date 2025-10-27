"use client";

import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { useAuth } from "@/lib/auth/use-auth";
import { saveBusinessProfile, completeOnboarding, getBusinessProfile } from "@/server/onboarding-actions";
import { OnboardingStep, OnboardingFormData } from "@/types/onboarding";

import { BusinessInfoStep } from "./_components/business-info-step";
import { ChannelsStep } from "./_components/channels-step";
import { OnboardingProgress } from "./_components/onboarding-progress";
import { PhoneSetupStep } from "./_components/phone-setup-step";
import { VoiceSelectionStep } from "./_components/voice-selection-step";
import { WelcomeStep } from "./_components/welcome-step";
import { TestAssistantStep } from "./_components/test-assistant-step";

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(OnboardingStep.WELCOME);
  const [formData, setFormData] = useState<Partial<OnboardingFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  const stepOrder = [
    OnboardingStep.WELCOME,
    OnboardingStep.BUSINESS_INFO,
    OnboardingStep.PHONE_SETUP,
    OnboardingStep.VOICE_SELECTION,
    OnboardingStep.CHANNELS,
    OnboardingStep.TEST_ASSISTANT,
  ];

  const currentStepIndex = stepOrder.indexOf(currentStep);

  // Load existing business profile data on component mount
  useEffect(() => {
    const loadExistingData = async () => {
      if (!user?.id) return;

      try {
        const existingProfile = await getBusinessProfile(user.id);
        if (existingProfile) {
          setFormData(existingProfile);
        }
      } catch {
        console.error("Error loading existing profile");
      } finally {
        setIsLoadingData(false);
      }
    };

    loadExistingData();
  }, [user?.id]);

  const handleNext = async (stepData?: any) => {
    setIsLoading(true);

    try {
      if (stepData) {
        setFormData((prev) => ({ ...prev, ...stepData }));

        // Save data to database
        if (user?.id) {
          const result = await saveBusinessProfile(user.id, stepData);
          if (!result.success) {
            toast.error("Failed to save data", {
              description: result.error,
            });
            return;
          }
        }
      }

      // Move to next step
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < stepOrder.length) {
        setCurrentStep(stepOrder[nextIndex]);
      }
    } catch (error) {
      toast.error("Failed to save data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    // Move to previous step
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(stepOrder[prevIndex]);
    }
  };

  const handleSkip = async () => {
    // Move to next step without saving data
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < stepOrder.length) {
      setCurrentStep(stepOrder[nextIndex]);
    }
  };

  const handleComplete = async () => {
    if (!user?.id) {
      toast.error("User not found");
      return;
    }

    setIsLoading(true);

    try {
      // Mark onboarding as completed
      const result = await completeOnboarding(user.id);
      if (!result.success) {
        toast.error("Failed to complete onboarding", {
          description: result.error,
        });
        return;
      }

      toast.success("Onboarding completed!", {
        description: "Your AI assistant is ready to go.",
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch {
      toast.error("Failed to complete onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentStep = () => {
    if (isLoadingData) {
      return (
        <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
          <div className="space-y-2 text-left">
            <div className="flex items-center justify-center">
              <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
            </div>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case OnboardingStep.WELCOME:
        return <WelcomeStep onNext={() => handleNext()} />;

      case OnboardingStep.BUSINESS_INFO:
        return (
          <BusinessInfoStep
            onNext={handleNext}
            onSkip={handleSkip}
            onBack={handleBack}
            initialData={formData}
            isLoading={isLoading}
          />
        );

      case OnboardingStep.PHONE_SETUP:
        return (
          <PhoneSetupStep
            onNext={handleNext}
            onSkip={handleSkip}
            onBack={handleBack}
            initialData={formData}
            isLoading={isLoading}
          />
        );

      case OnboardingStep.VOICE_SELECTION:
        return (
          <VoiceSelectionStep
            onNext={handleNext}
            onSkip={handleSkip}
            onBack={handleBack}
            initialData={formData}
            isLoading={isLoading}
          />
        );

      case OnboardingStep.CHANNELS:
        return (
          <ChannelsStep
            onNext={handleNext}
            onSkip={handleSkip}
            onBack={handleBack}
            initialData={formData}
            isLoading={isLoading}
          />
        );

      case OnboardingStep.TEST_ASSISTANT:
        return (
          <TestAssistantStep
            onNext={handleNext}
            onSkip={handleSkip}
            onBack={handleBack}
            initialData={formData}
            isLoading={isLoading}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center p-4">
      <OnboardingProgress currentStep={currentStep} />
      <div className="relative mt-8 w-full max-w-md rounded-lg border bg-background p-8 shadow-lg">
        {renderCurrentStep()}
      </div>
    </div>
  );
}
