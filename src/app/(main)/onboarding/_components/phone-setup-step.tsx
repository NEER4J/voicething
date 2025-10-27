"use client";

import { useState, useEffect } from "react";

import { CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PhoneSetupStepProps {
  onNext: (data: { phone_option: "new" | "existing"; phone_country_code: string; phone_area_code: string }) => void;
  onSkip: () => void;
  onBack: () => void;
  initialData?: Partial<{ phone_option: "new" | "existing"; phone_country_code: string; phone_area_code: string }>;
  isLoading?: boolean;
}

const PHONE_NUMBERS = [
  "+1 (555) 123-4567",
  "+1 (555) 234-5678",
  "+1 (555) 345-6789",
  "+1 (555) 456-7890",
  "+1 (555) 567-8901",
];

function OptionSelection({ onSelect }: { onSelect: (option: "new" | "existing") => void }) {
  return (
    <div className="space-y-3">
      <Card className="hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => onSelect("new")}>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Get a New Number</CardTitle>
          <CardDescription className="text-sm">We&apos;ll provide you with a dedicated AI phone number</CardDescription>
        </CardHeader>
      </Card>

      <Card className="hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => onSelect("existing")}>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Bring Your Own Number</CardTitle>
          <CardDescription className="text-sm">Port or forward your existing business line</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function NewNumberSetup({
  selectedPhoneNumber,
  setSelectedPhoneNumber,
  isCompleted,
}: {
  selectedPhoneNumber: string;
  setSelectedPhoneNumber: (value: string) => void;
  isCompleted: boolean;
}) {
  return (
    <>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Available Phone Numbers</label>
          <Select value={selectedPhoneNumber} onValueChange={setSelectedPhoneNumber}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PHONE_NUMBERS.map((number) => (
                <SelectItem key={number} value={number}>
                  {number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isCompleted && (
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3">
          <CheckCircle className="size-5 text-green-600" />
          <span className="text-sm text-green-800">
            Your AI number <span className="font-medium">{selectedPhoneNumber}</span> is ready for calls and messages.
          </span>
        </div>
      )}
    </>
  );
}

function ExistingNumberSetup() {
  return (
    <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
      <p className="text-sm text-blue-800">
        To connect your existing number, please contact our support team. This feature will be available soon.
      </p>
    </div>
  );
}

function PhoneSetupHeader() {
  return (
    <div className="space-y-2 text-left">
      <h1 className="text-2xl font-medium">Connect Your Number</h1>
      <p className="text-muted-foreground text-sm">Set up calling and messaging infrastructure.</p>
    </div>
  );
}

function PhoneSetupContent({
  selectedOption,
  handleOptionSelect,
  selectedPhoneNumber,
  setSelectedPhoneNumber,
  isCompleted,
  onBack,
  onSkip,
  handleContinue,
  isLoading,
}: {
  selectedOption: "new" | "existing" | null;
  handleOptionSelect: (option: "new" | "existing") => void;
  selectedPhoneNumber: string;
  setSelectedPhoneNumber: (value: string) => void;
  isCompleted: boolean;
  onBack: () => void;
  onSkip: () => void;
  handleContinue: () => void;
  isLoading?: boolean;
}) {
  if (!selectedOption) {
    return <OptionSelection onSelect={handleOptionSelect} />;
  }

  return (
    <div className="space-y-4">
      {selectedOption === "new" && (
        <NewNumberSetup
          selectedPhoneNumber={selectedPhoneNumber}
          setSelectedPhoneNumber={setSelectedPhoneNumber}
          isCompleted={isCompleted}
        />
      )}

      {selectedOption === "existing" && <ExistingNumberSetup />}

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleContinue}
          className="flex-1"
          disabled={(selectedOption === "new" && !isCompleted) || isLoading}
        >
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
  );
}

function usePhoneSetupState(
  initialData?: Partial<{ phone_option: "new" | "existing"; phone_country_code: string; phone_area_code: string }>,
) {
  const [selectedOption, setSelectedOption] = useState<"new" | "existing" | null>(initialData?.phone_option ?? null);
  const [countryCode] = useState(initialData?.phone_country_code ?? "+1");
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState(PHONE_NUMBERS[0]);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (selectedOption === "new") {
      const timer = setTimeout(() => setIsCompleted(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedOption]);

  const handleOptionSelect = (option: "new" | "existing") => {
    setSelectedOption(option);
  };

  const getPhoneData = () => ({
    phone_option: selectedOption!,
    phone_country_code: countryCode,
    phone_area_code: selectedPhoneNumber.split(" ")[1].replace(/[()]/g, ""),
  });

  return {
    selectedOption,
    handleOptionSelect,
    selectedPhoneNumber,
    setSelectedPhoneNumber,
    isCompleted,
    getPhoneData,
  };
}

export function PhoneSetupStep({ onNext, onSkip, onBack, initialData, isLoading }: PhoneSetupStepProps) {
  const { selectedOption, handleOptionSelect, selectedPhoneNumber, setSelectedPhoneNumber, isCompleted, getPhoneData } =
    usePhoneSetupState(initialData);

  const handleContinue = () => {
    onNext(getPhoneData());
  };

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
      <PhoneSetupHeader />
      <div className="space-y-4">
        <PhoneSetupContent
          selectedOption={selectedOption}
          handleOptionSelect={handleOptionSelect}
          selectedPhoneNumber={selectedPhoneNumber}
          setSelectedPhoneNumber={setSelectedPhoneNumber}
          isCompleted={isCompleted}
          onBack={onBack}
          onSkip={onSkip}
          handleContinue={handleContinue}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
