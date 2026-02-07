import { X } from "lucide-react";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function BusinessTrading({ formData, updateFormData }) {
  console.log(formData)
    /**
     * Business & Trading Form Section
     * @param {object} formData - The current form data state
     * @param {function} updateFormData - Function to update form data state
     * @return {JSX.Element} The Business & Trading form section
    */

    /*
    Payment Format:
        - payment_name: string
        - provider: string
        - is_invoice_issued: boolean
        - turnover: string
        - payment_term: string
        - customer_percentage: string
    */

    const addMethod = (method) => {
        const newMethod = {
            payment_name: method,
            provider: [],
            is_invoice_issued: false,
            turnover: "",
            payment_term: "",
            customer_percentage: "",
        }

        if(formData.paymentMethods.find(m => m.payment_name === method)) {
            // Remove method
            const filteredMethods = formData.paymentMethods.filter(m => m.payment_name !== method);
            updateFormData("paymentMethods", filteredMethods);
        } else {
            // Add method
            updateFormData("paymentMethods", [...formData.paymentMethods, newMethod]);
        }
    }

    const editMethod = (methodName, field, value) => {
        const updatedMethods = formData.paymentMethods.map(m => {
            if(m.payment_name === methodName) {
                if(field === "provider") {
                    // Toggle provider in array
                    if(m.provider.includes(value)) {
                        m.provider = m.provider.filter(p => p !== value);
                    } else {
                        m.provider = [...m.provider, value];
                    }
                } else {
                    m[field] = value;
                }
            }
            return m;
        });
        updateFormData("paymentMethods", updatedMethods);
    }
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Business & Trading</h2>
      <p className="text-muted-foreground">
        Tell us about your business model and customers
      </p>

      {formData.whoDoYouSellTo === "Businesses" && (
        <Card className="bg-muted/50"> 
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">Business Customer Details</h3>
            <Field>
              <FieldLabel>How many customers do you serve monthly?</FieldLabel>
              <Select
                value={formData.monthlyCustomers}
                onValueChange={(value) =>
                  updateFormData("monthlyCustomers", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 customers</SelectItem>
                  <SelectItem value="11-50">11-50 customers</SelectItem>
                  <SelectItem value="51-100">51-100 customers</SelectItem>
                  <SelectItem value="100+">100+ customers</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>
                What % of revenue comes from your biggest customer?
              </FieldLabel>
              <Select
                value={formData.revenueFromBiggestCustomer}
                onValueChange={(value) =>
                  updateFormData("revenueFromBiggestCustomer", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select percentage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-10">0-10%</SelectItem>
                  <SelectItem value="11-25">11-25%</SelectItem>
                  <SelectItem value="26-50">26-50%</SelectItem>
                  <SelectItem value="50+">50%+</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>How quickly do customers usually pay you?</FieldLabel>
              <Select
                value={formData.customerPaymentSpeed}
                onValueChange={(value) =>
                  updateFormData("customerPaymentSpeed", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="7-days">7 days</SelectItem>
                  <SelectItem value="30-days">30 days</SelectItem>
                  <SelectItem value="60-days">60 days</SelectItem>
                  <SelectItem value="90+">90+ days</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </CardContent>
        </Card>
      )}

      <Field>
        <FieldLabel>How do customers pay you?</FieldLabel>
        <FieldDescription>
          Choose all that apply. Add detail for better matches.
        </FieldDescription>
        <div className="flex flex-wrap gap-2 mt-2">
          {[
            "Card",
            "Cash",
            "Mobile / App / QR",
            "Debit Orders",
            "Instant EFT / Pay-by-link",
            "EFT / Bank Transfer",
          ].map((method) => (
            <Badge
              key={method}
              variant={
                formData.paymentMethods.find(p => p.payment_name === method) ? "default" : "outline"
              }
              className="cursor-pointer gap-1"
              onClick={() => addMethod(method)}
            >
              {method}
              {formData.paymentMethods.find(p => p.payment_name === method) && (
                <X className="w-3 h-3" />
              )}
            </Badge>
          ))}
        </div>
      </Field>

      {formData.paymentMethods.find(p => p.payment_name ==="Card") && (
        <Card className="bg-muted/50">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">Card details</h3>
            <Field>
              <FieldLabel>POS/Acquirer</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {[
                  "FNB",
                  "Nedbank",
                  "iKhokha",
                  "Yoco",
                  "SnapScan",
                  "Adumo",
                  "Absa",
                  "Capitec",
                  "Peach",
                  "Other",
                ].map((provider) => (
                  <Badge
                    key={provider}
                    variant={
                      formData.paymentMethods.find(p => p.payment_name === "Card").provider.includes(provider)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => {
                      editMethod("Card", "provider", provider);
                    }}
                  >
                    {provider}
                  </Badge>
                ))}
              </div>
            </Field>
            <Field>
              <FieldLabel>Monthly card turnover</FieldLabel>
              <div className="flex gap-2">
                {["<R50k", "R50-250k", "R250k-R1m", "R1-3m", ">R3m"].map(
                  (range) => (
                    <Badge
                      key={range}
                      variant={
                        formData.paymentMethods.find(p => p.payment_name === "Card").turnover === range
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() =>
                        editMethod("Card", "turnover", range)
                      }
                    >
                      {range}
                    </Badge>
                  ),
                )}
              </div>
            </Field>
          </CardContent>
        </Card>
      )}

      {formData.paymentMethods.find(p => p.payment_name ==="EFT / Bank Transfer") && (
        <Card className="bg-muted/50">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">EFT details</h3>
            <Field>
              <FieldLabel>Do you issue invoices?</FieldLabel>
              <div className="flex gap-4">
                <Badge
                  variant={
                    formData.paymentMethods.find(p => p.payment_name === "EFT / Bank Transfer").is_invoice_issued === "yes" ? "default" : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => editMethod("EFT / Bank Transfer", "is_invoice_issued", "yes")}
                >
                  Yes
                </Badge>
                <Badge
                  variant={
                    formData.paymentMethods.find(p => p.payment_name === "EFT / Bank Transfer").is_invoice_issued === "no" ? "default" : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => editMethod("EFT / Bank Transfer", "is_invoice_issued", "no")}
                >
                  No
                </Badge>
              </div>
            </Field>
            <Field>
              <FieldLabel>% from largest customer</FieldLabel>
              <div className="flex gap-2">
                {["<20%", "20-40%", "40-60%", ">60%"].map((percent) => (
                  <Badge
                    key={percent}
                    variant={
                      formData.paymentMethods.find(p => p.payment_name === "EFT / Bank Transfer").customer_percentage === percent
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() =>
                      editMethod("EFT / Bank Transfer", "customer_percentage", percent)
                    }
                  >
                    {percent}
                  </Badge>
                ))}
              </div>
            </Field>
            <Field>
              <FieldLabel>Typical payment terms</FieldLabel>
              <div className="flex gap-2">
                {["0-15 days", "30 days", "45 days", "60+ days"].map((term) => (
                  <Badge
                    key={term}
                    variant={
                      formData.paymentMethods.find(p => p.payment_name === "EFT / Bank Transfer").payment_term === term
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => editMethod("EFT / Bank Transfer", "payment_term", term)}
                  >
                    {term}
                  </Badge>
                ))}
              </div>
            </Field>
          </CardContent>
        </Card>
      )}

      {formData.paymentMethods.find(p => p.payment_name === "Mobile / App / QR") && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Wallet/QR provider</h3>
            <div className="flex flex-wrap gap-2">
              {[
                "SnapScan",
                "Zapper",
                "Apple Pay",
                "Samsung Pay",
                "Ozow",
                "PayFast",
                "Other",
              ].map((provider) => (
                <Badge
                  key={provider}
                  variant={
                    formData.paymentMethods.find(p => p.payment_name === "Mobile / App / QR").provider.includes(provider)
                      ? "default"
                      : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => {
                    editMethod("Mobile / App / QR", "provider", provider);
                  }}
                >
                  {provider}
                </Badge>
              ))}
            </div>
            {/* <Button variant="ghost" className="mt-2 text-sm">
              + Add % split (optional)
            </Button> */}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
