import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
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
import {
  TrendingUp,
  Users,
} from "lucide-react";
import { useRef, Fragment } from "react";
import BusinessTrading from "./business-metrics/business-trading";
import FinanceBanking from "./business-metrics/finance-banking";

const demographics = [
  { id: "youth", label: "Youth-owned (18-35 years)" },
  { id: "rural", label: "Based in rural area or township" },
  // { id: 'coloured', label: 'Coloured-owned (51%+ Coloured ownership)' },
  {
    id: "disability",
    label: "Disability-owned (51%+ people with disabilities)",
  },
  { id: "women", label: "Women-owned (51%+ women ownership)" },
  { id: "black", label: "Black-owned (51%+ Black ownership)" },
  // { id: 'indian', label: 'Indian-owned (51%+ Indian ownership)' },
];

const documents = [
  "3-month bank statements",
  "Audited financial statements",
  "Tax returns",
  "Monthly financial summaries",
  "Customer contracts or purchase orders",
];

export default function BusinessMetrics({ profile, setProfile }) {
  const anchor = useRef(null);
  const anchor2 = useRef(null);

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="annualRevenue">Number of Employees</Label>
              <Select
                defaultValue={profile?.team_size}
                value={profile?.team_size}
                onValueChange={(value) =>
                  setProfile({ ...profile, team_size: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select number of employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="just-me">Just me</SelectItem>
                  <SelectItem value="2-5">2-5 people</SelectItem>
                  <SelectItem value="6-10">6-10 people</SelectItem>
                  <SelectItem value="11-20">11-20 people</SelectItem>
                  <SelectItem value="21-50">21-50 people</SelectItem>
                  <SelectItem value="50+">50+ people</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfEmployees">Stage of Business</Label>
              <Select
                defaultValue={profile?.team_stage}
                value={profile?.team_stage}
                onValueChange={(value) =>
                  setProfile({ ...profile, team_stage: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a stage of business" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre_revenue">Still an idea</SelectItem>
                  <SelectItem value="early">Just getting started</SelectItem>
                  <SelectItem value="growing">Growing Steadily</SelectItem>
                  <SelectItem value="established">Well established</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="annualRevenue">
                Are you up-to-date with SARS
              </Label>
              <Select
                defaultValue={profile?.sars_status}
                value={profile?.sars_status}
                onValueChange={(value) =>
                  setProfile({ ...profile, sars_status: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>SARS Status</SelectLabel>
                    <SelectItem value="yes">Yes, I'm up-to-date.</SelectItem>
                    <SelectItem value="no">No, I'm behind on tax.</SelectItem>
                    <SelectItem value="maybe">Not Registered.</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfEmployees">Are you VAT registered?</Label>
              <Select
                defaultValue={profile?.vat_status}
                value={profile?.vat_status}
                onValueChange={(value) =>
                  setProfile({ ...profile, vat_status: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>VAT Status</SelectLabel>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No.</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfEmployees">B-BBEE Certification</Label>
              <Select
                defaultValue={profile?.bbee_certification}
                value={profile?.bbee_certification}
                onValueChange={(value) =>
                  setProfile({ ...profile, bbee_certification: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>B-BBEE Certification</SelectLabel>
                    <SelectItem value="none">Not Certified</SelectItem>
                    {[...Array(8)].map((_, i) => (
                      <SelectItem
                        key={i}
                        value={`level${i + 1}`}
                      >{`Level ${i + 1}`}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Field>
            <FieldLabel>
              Demographics (helps match you to specialized funding)
            </FieldLabel>
            <FieldDescription>
              Select all that apply to your business ownership
            </FieldDescription>
            <Combobox
              multiple
              autoHighlight
              items={demographics}
              // defaultValue={[demographics[0].id]}
            >
              <ComboboxChips ref={anchor} className="w-full">
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
              <ComboboxContent anchor={anchor}>
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item.id} value={item.id}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </Field>

          <Field>
            <FieldLabel>What financial documents do you have?</FieldLabel>
            <FieldDescription>
              Select all documents you can provide
            </FieldDescription>
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
          </Field>
        </CardContent>
      </Card>

      <BusinessTrading profile={profile} setProfile={setProfile} />

      <FinanceBanking profile={profile} setProfile={setProfile} />
    </>
  );
}
