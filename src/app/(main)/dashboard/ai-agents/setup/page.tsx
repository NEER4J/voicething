"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/use-auth";
import { completeDraftAgent, saveDraftAgent } from "@/server/agents-actions";
import type { AgentFormData } from "@/types/agents";

import { BasicsStep, type BasicsFormData } from "./_components/basics-step";
import { PersonalityStep, type PersonalityFormData } from "./_components/personality-step";
import { PreviewStep } from "./_components/preview-step";
import { SetupProgress, SetupStep } from "./_components/setup-progress";

// Helper function to save draft
const saveDraft = async (
  userId: string,
  updatedData: Partial<AgentFormData>,
  draftId: string | undefined,
  setDraftId: (id: string) => void
) => {
  const result = await saveDraftAgent(userId, updatedData, draftId);
  if (result.success && result.draftId) {
    setDraftId(result.draftId);
  } else if (!result.success) {
    toast.error("Failed to save progress", {
      description: result.error,
    });
  }
};

// Helper function to validate form data
const validateFormData = (formData: Partial<AgentFormData>) => {
  const requiredFields = ['name', 'business_type', 'language', 'tone', 'voice_id', 'voice_name'];
  return requiredFields.every(field => formData[field as keyof AgentFormData]);
};

// Helper function to create agent
const createAgent = async (userId: string, draftId: string, formData: AgentFormData, router: ReturnType<typeof useRouter>) => {
  const result = await completeDraftAgent(userId, draftId, formData);
  if (result.success) {
    toast.success("Assistant created successfully!", {
      description: "Your AI assistant is ready to go.",
    });
    router.push(`/dashboard/ai-agents/${result.agentId}`);
  } else {
    toast.error("Failed to create assistant", {
      description: result.error,
    });
  }
};

export default function SetupPage() {
  const [currentStep, setCurrentStep] = useState<SetupStep>(SetupStep.BASICS);
  const [formData, setFormData] = useState<Partial<AgentFormData>>({});
  const [draftId, setDraftId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleBasicsNext = async (data: BasicsFormData) => {
    setIsLoading(true);
    try {
      const updatedData = { ...formData, ...data };
      setFormData(updatedData);

      if (user?.id) {
        await saveDraft(user.id, updatedData, draftId, setDraftId, toast);
      }

      setCurrentStep(SetupStep.PERSONALITY);
    } catch {
      toast.error("Failed to save progress");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePersonalityNext = async (data: PersonalityFormData) => {
    setIsLoading(true);
    try {
      const updatedData = { ...formData, ...data };
      setFormData(updatedData);

      if (user?.id) {
        await saveDraft(user.id, updatedData, draftId, setDraftId, toast);
      }

      setCurrentStep(SetupStep.PREVIEW);
    } catch {
      toast.error("Failed to save progress");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === SetupStep.PERSONALITY) {
      setCurrentStep(SetupStep.BASICS);
    } else if (currentStep === SetupStep.PREVIEW) {
      setCurrentStep(SetupStep.PERSONALITY);
    }
  };

  const handleCreate = async () => {
    if (!user?.id || !draftId) {
      toast.error("Missing required information");
      return;
    }

    if (!validateFormData(formData)) {
      toast.error("Please complete all required fields");
      return;
    }

    setIsLoading(true);
    try {
      await createAgent(user.id, draftId, formData as AgentFormData, router);
    } catch (error) {
      console.error("Error creating assistant:", error);
      toast.error("Failed to create assistant");
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case SetupStep.BASICS:
        return <BasicsStep onNext={handleBasicsNext} initialData={formData} isLoading={isLoading} />;

      case SetupStep.PERSONALITY:
        return (
          <PersonalityStep
            onNext={handlePersonalityNext}
            onBack={handleBack}
            initialData={formData}
            isLoading={isLoading}
          />
        );

      case SetupStep.PREVIEW:
        return (
          <PreviewStep
            onBack={handleBack}
            onCreate={handleCreate}
            formData={formData}
            isLoading={isLoading}
            isSuccess={isSuccess}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center p-4">
      {!isSuccess && <SetupProgress currentStep={currentStep} />}
      <div className="relative mt-8 w-full max-w-2xl">{renderCurrentStep()}</div>
    </div>
  );
}

