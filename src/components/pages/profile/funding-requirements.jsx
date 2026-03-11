import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NumericFormat } from "react-number-format";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import {
  User,
  Building2,
  TrendingUp,
  DollarSign,
  Clock,
  Lightbulb,
  HandCoins,
  Info,
} from "lucide-react";
import {
  BUSINESS_TYPES,
  PROVINCES,
  INDUSTRIES,
  TIMELINE_OPTIONS,
  FUNDING_PURPOSES,
} from "@/constants/account-creation";
import { useRef, Fragment } from "react";

const documents = [
  "3-month bank statements",
  "Audited financial statements",
  "Tax returns",
  "Monthly financial summaries",
  "Customer contracts or purchase orders",
];

export default function FinanceBanking({ profile, setProfile }) {
  const anchor2 = useRef(null);
  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Funding Needs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  value={profile?.fundingAmount}
                  onValueChange={(value) => {
                    setProfile({
                      ...profile,
                      fundingAmount: value.floatValue || 0,
                      fundingMinAmount:
                        value.floatValue - value.floatValue * 0.1,
                      fundingMaxAmount:
                        value.floatValue + value.floatValue * 0.1,
                    });
                  }}
                  thousandSeparator=","
                  prefix={"R "}
                  className="w-full flex-grow p-2 border-b-2 border-primary text-lg md:text-2xl lg:text-4xl font-bold text-center outline-none bg-transparent"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Type an amount. Rounded estimates are fine, you can refine
                later.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-2 text-sm text-primary p-4 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4" /> Selected amount falls in the range:
              </div>
              <div className="font-semibold text-lg">
                R {profile?.fundingMinAmount?.toLocaleString()} - R{" "}
                {profile?.fundingMaxAmount?.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lightbulb className="w-4 h-4" />
                <span>
                  This helps us catch any typos and find the right funding
                  options.
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
              {TIMELINE_OPTIONS?.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setProfile({ ...profile, fundingTimeline: option.value })
                  }
                  className={cn(
                    "p-4 rounded-lg border-2 text-left transition-all",
                    profile?.fundingTimeline === option.value
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
              <Combobox
                multiple
                autoHighlight
                items={documents}
                // defaultValue={[documents[0]]}
              >
                <ComboboxChips ref={anchor2} className="w-full">
                  <ComboboxValue>
                    {(values) => (
                      <Fragment>
                        {values.map((value) => (
                          <ComboboxChip key={value} className="capitalize">
                            {value}
                          </ComboboxChip>
                        ))}
                        <ComboboxChipsInput />
                      </Fragment>
                    )}
                  </ComboboxValue>
                </ComboboxChips>
                <ComboboxContent anchor={anchor2}>
                  <ComboboxEmpty>No items found.</ComboboxEmpty>
                  <ComboboxList>
                    {(item) => (
                      <ComboboxItem key={item} value={item}>
                        {item}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            <Field>
              <div className="flex items-center gap-2 mb-2">
                <FieldLabel>Additional details (optional)</FieldLabel>
                <Info className="w-4 h-4 text-muted-foreground" />
              </div>
              <textarea
                value={profile?.fundingDetails}
                onChange={(e) =>
                  setProfile({ ...profile, fundingDetails: e.target.value })
                }
                placeholder="E.g., R250k for refrigerated delivery van in KZN + R120k winter stock; POS upgrade for card acceptance."
                className="w-full min-h-[100px] p-3 border rounded-md bg-background border-border focus:border-primary focus:ring-0 outline-none"
                maxLength={400}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HandCoins className="h-5 w-5" />
            Funding Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>
                How often would you prefer to repay funding?
              </FieldLabel>
              <Select
                value={profile?.repaymentFrequency}
                onValueChange={(value) =>
                  setProfile({ ...profile, repaymentFrequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>How long do you want to repay over?</FieldLabel>
              <Select
                value={profile?.repaymentDuration}
                onValueChange={(value) =>
                  setProfile({ ...profile, repaymentDuration: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-3-months">0-3 months</SelectItem>
                  <SelectItem value="3-6-months">3-6 months</SelectItem>
                  <SelectItem value="6-12-months">6-12 months</SelectItem>
                  <SelectItem value="12-24-months">12-24 months</SelectItem>
                  <SelectItem value="24+months">24+ months</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>
                Are you open to giving investors a share of your business?
              </FieldLabel>
              <Select
                value={profile?.openToEquity}
                onValueChange={(value) =>
                  setProfile({ ...profile, openToEquity: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">
                    Yes, I'm open to equity investment
                  </SelectItem>
                  <SelectItem value="no">No, I prefer debt/loans</SelectItem>
                  <SelectItem value="not_sure">
                    Maybe, depending on terms
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>
                Can you provide security/collateral for funding?
              </FieldLabel>
              <Select
                value={profile?.canProvideCollateral}
                onValueChange={(value) =>
                  setProfile({ ...profile, canProvideCollateral: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes, I have assets</SelectItem>
                  <SelectItem value="no">No, I don't have assets</SelectItem>
                  <SelectItem value="partial">
                    Partial collateral available
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel>
                Does your business have a specific impact focus?
              </FieldLabel>
              <Select
                value={profile?.impactFocus}
                onValueChange={(value) =>
                  setProfile({ ...profile, impactFocus: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select focus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="social">
                    Social (community, education, health)
                  </SelectItem>
                  <SelectItem value="environmental">Environmental</SelectItem>
                  <SelectItem value="economic">Economic development</SelectItem>
                  <SelectItem value="none">No specific impact focus</SelectItem>
                </SelectContent>
              </Select>
              <FieldDescription className="mt-2">
                Impact-focused businesses may qualify for specialized funding
                programs.
              </FieldDescription>
            </Field>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
