import { cn } from "@/lib/utils";
import { TIMELINE_OPTIONS } from "@/constants/account-creation";
import {
  Info,
  Lightbulb,
  Clock,
  Shield,
  ArrowLeft,
  ArrowRight,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { NumericFormat } from "react-number-format";
import { Checkbox } from "../../ui/checkbox";

export default function FundingNeeds({
  handleNext,
  handleBack,
  formData,
  updateFormData,
  fundingPurposes,
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Tell us about your funding needs
          </h1>
        </div>

        <Card className="w-full">
          <CardContent className="p-8 space-y-8">
            {/* Funding Amount */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-semibold">
                  How much funding do you need?
                </h2>
              </div>
              <div className="text-center p-6 border-2 border-dashed rounded-lg">
                <div className="text-4xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
                  <NumericFormat
                    value={formData.fundingAmount}
                    onValueChange={(value) => {
                      updateFormData("fundingAmount", value.floatValue || 0);
                      updateFormData(
                        "fundingMinAmount",
                        value.floatValue - value.floatValue * 0.1,
                      );
                      updateFormData(
                        "fundingMaxAmount",
                        value.floatValue + value.floatValue * 0.1,
                      );
                    }}
                    thousandSeparator=","
                    prefix={"R "}
                    className="w-full flex-grow p-2 border-b-2 border-primary text-lg md:text-2xl lg:text-4xl font-bold text-center outline-none bg-transparent"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Type an amount. Rounded estimates are fine, you can refine later.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center gap-2 text-sm text-primary p-4 bg-primary/10 rounded-lg">
                
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4" /> Selected amount falls in the range:
                </div>
                <div className="font-semibold text-lg">
                  R {formData?.fundingMinAmount?.toLocaleString()} - 
                  R {formData?.fundingMaxAmount?.toLocaleString()}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lightbulb className="w-4 h-4" />
                  <span>
                    This helps us catch any typos and find the right funding options.
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">
                  When do you need the funding?
                </h2>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {TIMELINE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      updateFormData("fundingTimeline", option.value)
                    }
                    className={cn(
                      "p-4 rounded-lg border-2 text-left transition-all",
                      formData.fundingTimeline === option.value
                        ? "border-primary bg-primary-foreground dark:bg-primary/20"
                        : "border-border hover:border-primary",
                    )}
                  >
                    <div className="font-semibold mb-1">{option.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Funding Purposes */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">
                  What do you need the funding for?
                </h2>
                <Lightbulb className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Pick one or more purposes. Add details if helpful.
              </p>

              <div>
                <FieldLabel>Primary purpose(s) *</FieldLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.fundingPurposes.map((purpose) => (
                    <Badge key={purpose} variant="default" className="gap-1">
                      {fundingPurposes.find((p) => p.id === purpose)?.category}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => {
                          updateFormData(
                            "fundingPurposes",
                            formData.fundingPurposes.filter(
                              (p) => p !== purpose,
                            ),
                          );
                        }}
                      />
                    </Badge>
                  ))}
                </div>
                {formData.fundingPurposes.length >= 3 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Maximum reached — remove one to add another
                  </p>
                )}
                {formData.fundingPurposes.length < 3 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {fundingPurposes
                      .filter((p) => !formData.fundingPurposes.includes(p.id))
                      .map((purpose) => (
                        <Badge
                          key={purpose.id}
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() => {
                            if (formData.fundingPurposes.length < 3) {
                              updateFormData("fundingPurposes", [
                                ...formData.fundingPurposes,
                                purpose.id,
                              ]);
                            }
                          }}
                        >
                          {purpose.category}
                        </Badge>
                      ))}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-2 text-right">
                  {formData.fundingPurposes.length} of 3 max
                </div>
              </div>

              <Field>
                <div className="flex items-center gap-2 mb-2">
                  <FieldLabel>Additional details (optional)</FieldLabel>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
                <textarea
                  value={formData.fundingDetails}
                  onChange={(e) =>
                    updateFormData("fundingDetails", e.target.value)
                  }
                  placeholder="E.g., R250k for refrigerated delivery van in KZN + R120k winter stock; POS upgrade for card acceptance."
                  className="w-full min-h-[100px] p-3 border rounded-md bg-background border-border focus:border-primary focus:ring-0 outline-none"
                  maxLength={400}
                />
                <div className="flex justify-between mt-1">
                  <FieldDescription>
                    AI will extract key details to improve matching
                  </FieldDescription>
                  <span className="text-xs text-muted-foreground">
                    {formData.fundingDetails.length}/400
                  </span>
                </div>
              </Field>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">
                    Building your funding profile
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    These details help us match you with the most suitable
                    funding options. You can always refine them later.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={
                  !formData.fundingTimeline ||
                  formData.fundingPurposes.length === 0
                }
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
