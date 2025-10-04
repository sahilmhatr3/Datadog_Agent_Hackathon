"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import BasicInfoStep from "./steps/basic-info-step";
import PreferencesStep from "./steps/preferences-step";
import BudgetAccessibilityStep from "./steps/budget-accessibility-step";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

interface OnboardingFormProps {
  userId: string;
}

export interface OnboardingData {
  displayName: string;
  homeCity: string;
  homeCountry: string;
  timezone: string;
  preferredVibes: string[];
  preferredEventTypes: string[];
  priceMin: string;
  priceMax: string;
  partySize: { min: number; max: number };
  accessibilityNeeds: {
    wheelchairAccessible?: boolean;
    hearingAccessible?: boolean;
    visualAccessible?: boolean;
    other?: string;
  };
}

const STEPS = [
  { title: "Basic Information", description: "Tell us about yourself" },
  { title: "Travel Preferences", description: "What kind of experiences do you enjoy?" },
  { title: "Budget & Accessibility", description: "Help us personalize your recommendations" },
];

export default function OnboardingForm({ userId }: OnboardingFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({
    partySize: { min: 1, max: 4 },
    accessibilityNeeds: {},
  });

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const updateFormData = (data: Partial<OnboardingData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: formData.displayName,
          home_city: formData.homeCity,
          home_country: formData.homeCountry,
          tz: formData.timezone,
          preferred_vibes: (formData.preferredVibes ?? []) as Database["public"]["Enums"]["vibe"][],
          preferred_event_types: (formData.preferredEventTypes ?? []) as Database["public"]["Enums"]["event_type"][],
          price_min: formData.priceMin as Database["public"]["Enums"]["price_tier"],
          price_max: formData.priceMax as Database["public"]["Enums"]["price_tier"],
          party_size_min: formData.partySize?.min,
          party_size_max: formData.partySize?.max,
          accessibility_needs: formData.accessibilityNeeds,
          onboarding_completed: true,
        })
        .eq("id", userId);

      if (error) throw error;

      router.push("/protected");
      router.refresh();
    } catch (error) {
      console.error("Error updating profile:", error);
      // Handle error - show toast or alert
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <BasicInfoStep data={formData} updateData={updateFormData} />;
      case 1:
        return <PreferencesStep data={formData} updateData={updateFormData} />;
      case 2:
        return <BudgetAccessibilityStep data={formData} updateData={updateFormData} />;
      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.displayName && formData.homeCity && formData.homeCountry && formData.timezone;
      case 1:
        return formData.preferredVibes?.length && formData.preferredEventTypes?.length;
      case 2:
        return formData.priceMin && formData.priceMax;
      default:
        return false;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{STEPS[currentStep].title}</CardTitle>
        <CardDescription>{STEPS[currentStep].description}</CardDescription>
        <Progress value={progress} className="mt-4" />
      </CardHeader>
      <CardContent>{renderStep()}</CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          Back
        </Button>
        {currentStep === STEPS.length - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={!isStepValid() || isSubmitting}
          >
            {isSubmitting ? "Completing..." : "Complete Setup"}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!isStepValid()}
          >
            Next
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
