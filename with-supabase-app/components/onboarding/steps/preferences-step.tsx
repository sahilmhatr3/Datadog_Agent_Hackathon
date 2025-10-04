"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { OnboardingData } from "../onboarding-form";

interface PreferencesStepProps {
  data: Partial<OnboardingData>;
  updateData: (data: Partial<OnboardingData>) => void;
}

const VIBES = [
  { value: "chill", label: "Chill & Relaxed" },
  { value: "romantic", label: "Romantic" },
  { value: "adventurous", label: "Adventurous" },
  { value: "luxury", label: "Luxury" },
  { value: "budget", label: "Budget-Friendly" },
  { value: "kid_friendly", label: "Kid-Friendly" },
  { value: "nightlife", label: "Nightlife" },
  { value: "foodie", label: "Foodie" },
  { value: "outdoors", label: "Outdoors" },
  { value: "arts_culture", label: "Arts & Culture" },
  { value: "wellness", label: "Wellness" },
];

const EVENT_TYPES = [
  { value: "restaurant", label: "Restaurants" },
  { value: "bar", label: "Bars" },
  { value: "cafe", label: "Cafes" },
  { value: "club", label: "Nightclubs" },
  { value: "museum", label: "Museums" },
  { value: "concert", label: "Concerts" },
  { value: "theater", label: "Theater" },
  { value: "hike", label: "Hiking" },
  { value: "tour", label: "Tours" },
  { value: "shopping", label: "Shopping" },
  { value: "sports", label: "Sports" },
  { value: "workshop", label: "Workshops" },
  { value: "spa", label: "Spa & Wellness" },
];

export default function PreferencesStep({ data, updateData }: PreferencesStepProps) {
  const handleVibeChange = (vibe: string, checked: boolean) => {
    const currentVibes = data.preferredVibes || [];
    const newVibes = checked
      ? [...currentVibes, vibe]
      : currentVibes.filter((v) => v !== vibe);
    updateData({ preferredVibes: newVibes });
  };

  const handleEventTypeChange = (eventType: string, checked: boolean) => {
    const currentTypes = data.preferredEventTypes || [];
    const newTypes = checked
      ? [...currentTypes, eventType]
      : currentTypes.filter((t) => t !== eventType);
    updateData({ preferredEventTypes: newTypes });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base mb-3 block">What vibes do you enjoy? (Select at least one)</Label>
        <div className="grid grid-cols-2 gap-3">
          {VIBES.map((vibe) => (
            <div key={vibe.value} className="flex items-center space-x-2">
              <Checkbox
                id={vibe.value}
                checked={data.preferredVibes?.includes(vibe.value) || false}
                onCheckedChange={(checked) => handleVibeChange(vibe.value, checked as boolean)}
              />
              <Label
                htmlFor={vibe.value}
                className="text-sm font-normal cursor-pointer"
              >
                {vibe.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-base mb-3 block">What activities interest you? (Select at least one)</Label>
        <div className="grid grid-cols-2 gap-3">
          {EVENT_TYPES.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox
                id={type.value}
                checked={data.preferredEventTypes?.includes(type.value) || false}
                onCheckedChange={(checked) => handleEventTypeChange(type.value, checked as boolean)}
              />
              <Label
                htmlFor={type.value}
                className="text-sm font-normal cursor-pointer"
              >
                {type.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
