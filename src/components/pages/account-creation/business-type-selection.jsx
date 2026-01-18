import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import {
  BUSINESS_TYPES,
  PROVINCES,
  INDUSTRIES,
  TIMELINE_OPTIONS,
  FUNDING_PURPOSES,
} from "@/constants/account-creation";
import StepTimeline from '@/components/pages/account-creation/step-timeline'

export default function BusinessTypeSelection({
  currentStep,
  handleNext,
  formData,
  updateFormData,
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <StepTimeline currentStep={currentStep} />
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
            <Building2 className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Tell us about your business
          </h1>
          <p className="text-muted-foreground text-lg">
            We'll help you find the right funding based on your business type
          </p>
        </div>

        <Card className="w-full">
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold mb-6">
              What describes your business?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BUSINESS_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      updateFormData("businessType", type.id);
                      setTimeout(() => handleNext(), 300);
                    }}
                    className={cn(
                      "p-6 rounded-lg border-2 transition-all text-left",
                      formData.businessType === type.id
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                        : "border-border hover:border-purple-300 hover:bg-muted/50",
                    )}
                  >
                    <Icon className={cn("w-8 h-8 mb-3", type.color)} />
                    <h3 className="font-semibold text-lg mb-1">{type.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => navigate("/account-creation-old")}
                className="w-full"
              >
                Use old account creation form
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
