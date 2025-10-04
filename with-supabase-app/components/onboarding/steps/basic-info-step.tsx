"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OnboardingData } from "../onboarding-form";

interface BasicInfoStepProps {
  data: Partial<OnboardingData>;
  updateData: (data: Partial<OnboardingData>) => void;
}

// Common timezones - you can expand this list
const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
];

export default function BasicInfoStep({ data, updateData }: BasicInfoStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          placeholder="How should we call you?"
          value={data.displayName || ""}
          onChange={(e) => updateData({ displayName: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="homeCity">Home City</Label>
          <Input
            id="homeCity"
            placeholder="e.g., New York"
            value={data.homeCity || ""}
            onChange={(e) => updateData({ homeCity: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="homeCountry">Home Country</Label>
          <Input
            id="homeCountry"
            placeholder="e.g., USA"
            value={data.homeCountry || ""}
            onChange={(e) => updateData({ homeCountry: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Select
          value={data.timezone || ""}
          onValueChange={(value) => updateData({ timezone: value })}
        >
          <SelectTrigger id="timezone">
            <SelectValue placeholder="Select your timezone" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
