import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

export default function BusinessTrading({ profile, setProfile }) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Business & Trading
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="monthlyCustomers">Customers served monthly</Label>
            <Input
              id="monthlyCustomers"
              value={profile?.monthly_customers || ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  annual_revenue: e.target.value,
                })
              }
              placeholder="Annual revenue"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="biggestCustomerRevenue">
              Revenue from biggest customer
            </Label>
            <Input
              id="biggestCustomerRevenue"
              value={profile?.biggest_customer_revenue || ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  biggest_customer_revenue: e.target.value,
                })
              }
              placeholder="% of revenue from your biggest customer"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentTerms">Payment period from customers</Label>
            <Input
              id="paymentTerms"
              value={profile?.payment_terms || ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  payment_terms: e.target.value,
                })
              }
              placeholder="Payment terms"
            />
          </div>
        </div>
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
                // variant={
                //   formData.paymentMethods.find(p => p.payment_name === method) ? "default" : "outline"
                // }
                variant="outline"
                className="cursor-pointer gap-1 p-1.5"
                // onClick={() => addMethod(method)}
              >
                {method}
                {/* {formData.paymentMethods.find(p => p.payment_name === method) && (
                    <X className="w-3 h-3" />
                  )} */}
              </Badge>
            ))}
          </div>
        </Field>
      </CardContent>
    </Card>
  );
}
