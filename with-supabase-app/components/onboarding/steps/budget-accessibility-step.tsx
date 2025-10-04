"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingData } from "../onboarding-form";

interface BudgetAccessibilityStepProps {
  data: Partial<OnboardingData>;
  updateData: (data: Partial<OnboardingData>) => void;
}

const PRICE_TIERS = [
  { value: "free", label: "Free" },
  { value: "$", label: "$" },
  { value: "$$", label: "$$" },
  { value: "$$$", label: "$$$" },
  { value: "$$$$", label: "$$$$" },
];

export default function BudgetAccessibilityStep({ data, updateData }: BudgetAccessibilityStepProps) {
  const handlePartySizeChange = (values: number[]) => {
    updateData({
      partySize: {
        min: values[0],
        max: values[1],
      },
    });
  };

  const handleAccessibilityChange = (type: string, checked: boolean | string) => {
    updateData({
      accessibilityNeeds: {
        ...data.accessibilityNeeds,
        [type]: checked,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-base">Budget Range</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="priceMin" className="text-sm">Minimum</Label>
            <Select
              value={data.priceMin || ""}
              onValueChange={(value) => updateData({ priceMin: value })}
            >
              <SelectTrigger id="priceMin">
                <SelectValue placeholder="Select minimum" />
              </SelectTrigger>
              <SelectContent>
                {PRICE_TIERS.map((tier) => (
                  <SelectItem key={tier.value} value={tier.value}>
                    {tier.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priceMax" className="text-sm">Maximum</Label>
            <Select
              value={data.priceMax || ""}
              onValueChange={(value) => updateData({ priceMax: value })}
            >
              <SelectTrigger id="priceMax">
                <SelectValue placeholder="Select maximum" />
              </SelectTrigger>
              <SelectContent>
                {PRICE_TIERS.map((tier) => (
                  <SelectItem key={tier.value} value={tier.value}>
                    {tier.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-base">Typical Party Size</Label>
        <div className="px-2">
          <Slider
            min={1}
            max={20}
            step={1}
            value={[data.partySize?.min || 1, data.partySize?.max || 4]}
            onValueChange={handlePartySizeChange}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>Min: {data.partySize?.min || 1}</span>
            <span>Max: {data.partySize?.max || 4}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-base">Accessibility Needs</Label>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="wheelchair"
              checked={data.accessibilityNeeds?.wheelchairAccessible || false}
              onCheckedChange={(checked) => handleAccessibilityChange("wheelchairAccessible", checked as boolean)}
            />
            <Label htmlFor="wheelchair" className="text-sm font-normal cursor-pointer">
              Wheelchair accessible
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hearing"
              checked={data.accessibilityNeeds?.hearingAccessible || false}
              onCheckedChange={(checked) => handleAccessibilityChange("hearingAccessible", checked as boolean)}
            />
            <Label htmlFor="hearing" className="text-sm font-normal cursor-pointer">
              Hearing accessible
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="visual"
              checked={data.accessibilityNeeds?.visualAccessible || false}
              onCheckedChange={(checked) => handleAccessibilityChange("visualAccessible", checked as boolean)}
            />
            <Label htmlFor="visual" className="text-sm font-normal cursor-pointer">
              Visual accessibility features
            </Label>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="other-needs" className="text-sm">Other accessibility requirements</Label>
          <Textarea
            id="other-needs"
            placeholder="Please describe any other accessibility needs..."
            value={data.accessibilityNeeds?.other || ""}
            onChange={(e) => handleAccessibilityChange("other", e.target.value)}
            className="min-h-[80px]"
          />
        </div>
      </div>
    </div>
  );
}
