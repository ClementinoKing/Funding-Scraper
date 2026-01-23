import { CheckCircle2, Edit2, Building2, Wallet2, BriefcaseBusiness, Landmark, Users, Settings2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function FundingReadyStatus({
  handleSubmit,
  handleBack,
  goToStep,
  formData,
  fundingPurposes,
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-600 mb-4">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">
            Review your profile
          </h1>
          <p className="text-muted-foreground text-sm">
            Check your details below and edit any section if needed.
          </p>
        </div>

        {/* Business Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex justify-between items-center text-primary">
              <div className="flex items-center">
                <Building2 className="mr-2" /> Business Details
              </div>
              <Button
                variant="button"
                size="sm"
                className="text-primary"
                onClick={() => goToStep(2)}
              >
                <Edit2 />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  Business Name
                </h3>
                <h3 className="text-primary font-semibold">
                  {formData.businessName}
                </h3>
              </div>

              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  Business Type
                </h3>
                <h3 className="text-primary font-semibold">
                  {formData.businessType}
                </h3>
              </div>

              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  Registration Number
                </h3>
                <h3 className="text-primary font-semibold">
                  {formData.companyRegistrationNumber}
                </h3>
              </div>

              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">Address</h3>
                <h3 className="text-primary font-semibold">
                  {formData.province}, {formData.postalCode}
                </h3>
              </div>
              {formData.differentTradingAddress && (
                <div className="flex justify-between items-center pb-1 border-b">
                  <h3 className="font-medium text-muted-foreground">
                    Trading Address
                  </h3>
                  <h3 className="text-primary font-semibold">
                    {formData.secondaryProvince}, {formData.secondaryPostalCode}
                  </h3>
                </div>
              )}

              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">Industry</h3>
                <h3 className="text-primary font-semibold">
                  {formData.industry}
                </h3>
              </div>

              {formData.subIndustry.length > 0 && (
                <div className="flex justify-between items-center pb-1 border-b">
                  <h3 className="font-medium text-muted-foreground">
                    Sub Industries
                  </h3>
                  <h3 className="text-primary font-semibold">
                    {formData.subIndustry.join(", ")}
                  </h3>
                </div>
              )}

              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  Main Customer
                </h3>
                <h3 className="text-primary font-semibold">
                  {formData.whoDoYouSellTo}
                </h3>
              </div>

              {formData.regulatedBy && (
                <div className="flex justify-between items-center pb-1 border-b">
                  <h3 className="font-medium text-muted-foreground">
                    Regulated By
                  </h3>
                  <h3 className="text-primary font-semibold">
                    {formData.regulatedBy}
                  </h3>
                </div>
              )}

              {formData.seasonality && (
                <div className="flex justify-between items-center pb-1 border-b">
                  <h3 className="font-medium text-muted-foreground">
                    Seasonality
                  </h3>
                  <h3 className="text-primary font-semibold">
                    {formData.seasonality}
                  </h3>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Funding Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex justify-between items-center text-primary">
              <div className="flex items-center">
                <Wallet2 className="mr-2" /> Funding Details
              </div>
              <Button
                variant="button"
                size="sm"
                className="text-primary"
                onClick={() => goToStep(3)}
              >
                <Edit2 />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  Funding Amount
                </h3>
                <h3 className="text-primary font-semibold">
                  R {formData.fundingAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                </h3>
              </div>

              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  Timeline
                </h3>
                <h3 className="text-primary font-semibold capitalize">
                  {formData.fundingTimeline}
                </h3>
              </div>

              <div className=" pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  Funding Purpose
                </h3>
                <div className="text-primary font-semibold mt-1">
                  {formData.fundingPurposes.map((purpose) => (
                    <Badge
                      key={purpose}
                      className="mr-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground border-border"
                    >
                      {fundingPurposes.find((p) => p.id === purpose)?.category || purpose}
                    </Badge>
                  ))}
                </div>
              </div>

              {formData.fundingDetails && <div className="pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">Description</h3>
                <h3 className="text-primary font-semibold">
                  {formData.fundingDetails}
                </h3>
              </div>}
            </div>
          </CardContent>
        </Card>

        {/* Business & Trading */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex justify-between items-center text-primary">
              <div className="flex items-center">
                <BriefcaseBusiness className="mr-2" /> Business & Trading
              </div>
              <Button
                variant="button"
                size="sm"
                className="text-primary"
                onClick={() => goToStep(4, 1)}
              >
                <Edit2 />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  Customers Served
                </h3>
                <h3 className="text-primary font-semibold">
                  {formData.monthlyCustomers}
                </h3>
              </div>

              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  % of revenue from Biggest Customer
                </h3>
                <h3 className="text-primary font-semibold capitalize">
                  {formData.revenueFromBiggestCustomer}
                </h3>
              </div>

              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  Frequency of payment
                </h3>
                <div className="text-primary font-semibold mt-1">
                  {formData.customerPaymentSpeed}
                </div>
              </div>

              {formData.averageDaysToGetPaid && <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">Average Days to Get Paid</h3>
                <h3 className="text-primary font-semibold">
                  {formData.averageDaysToGetPaid}
                </h3>
              </div>}

              <div className="pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  Payment Options
                </h3>
                <h3 className="text-primary font-semibold capitalize">
                  {formData.paymentMethods.map((method) => (
                    <Badge
                      key={method}
                      className="mr-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground border-border"
                    >
                      {method.payment_name}
                    </Badge>
                  ))}
                </h3>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Financial & Banking */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex justify-between items-center text-primary">
              <div className="flex items-center">
                <Landmark className="mr-2" /> Financial & Banking
              </div>
              <Button
                variant="button"
                size="sm"
                className="text-primary"
                onClick={() => goToStep(4,2)}
              >
                <Edit2 />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  Where Money Goes To
                </h3>
                <h3 className="text-primary font-semibold">
                  {formData.moneyGoesTo || 'N/A'}
                </h3>
              </div>

              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  Bank
                </h3>
                <h3 className="text-primary font-semibold capitalize">
                  {formData.bank || 'N/A'}
                </h3>
              </div>

              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  Account Duration
                </h3>
                <div className="text-primary font-semibold mt-1">
                  {formData.accountDuration || 'N/A'}
                </div>
              </div>

              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  Monthly Income Range
                </h3>
                <div className="text-primary font-semibold mt-1">
                  {formData.monthlyIncomeRange || 'N/A'}
                </div>
              </div>

              {formData.exactMonthlyIncome && <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">Exact Monthly Income</h3>
                <h3 className="text-primary font-semibold">
                  {formData.exactMonthlyIncome || 'N/A'}
                </h3>
              </div>}

              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  Finance Tracking
                </h3>
                <div className="text-primary font-semibold mt-1">
                  {formData.trackFinances || 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team & Compliance */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex justify-between items-center text-primary">
              <div className="flex items-center">
                <Users className="mr-2" /> Team & Compliance
              </div>
              <Button
                variant="button"
                size="sm"
                className="text-primary"
                onClick={() => goToStep(4,3)}
              >
                <Edit2 />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  Number of Employees
                </h3>
                <h3 className="text-primary font-semibold">
                  {formData.numberOfEmployees || 'N/A'}
                </h3>
              </div>

              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  Business Stage
                </h3>
                <h3 className="text-primary font-semibold capitalize">
                  {formData.businessStage || 'N/A'}
                </h3>
              </div>

              <div className=" pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  Owner Background
                </h3>
                <div className="text-primary font-semibold mt-1">
                  {formData.ownerBackground.map((background) => (
                    <Badge
                      key={background}
                      className="mr-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground border-border"
                    >
                      {background || 'N/A'}
                    </Badge>
                  ))}
                </div>
              </div>

              {formData.demographics.length > 0 && <div className="pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">Demographics</h3>
                <div className="text-primary font-semibold">
                  {formData.demographics.map((background) => (
                    <Badge
                      key={background}
                      className="mr-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground border-border capitalize"
                    >
                      {background || 'N/A'}
                    </Badge>
                  ))}
                </div>
              </div>}

              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  SARS Status
                </h3>
                <h3 className="text-primary font-semibold capitalize">
                  {formData.sarsStatus || 'N/A'}
                </h3>
              </div>

              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  VAT Registered
                </h3>
                <h3 className="text-primary font-semibold capitalize">
                  {formData.vatRegistered || 'N/A'}
                </h3>
              </div>

              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  BBBEE Level
                </h3>
                <h3 className="text-primary font-semibold capitalize">
                  {formData.bbbeeLevel || 'N/A'}
                </h3>
              </div>

              {formData.financialDocuments.length > 0 && <div className="pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">Financial Documents</h3>
                <div className="text-primary font-semibold">
                  {formData.financialDocuments.map((background) => (
                    <Badge
                      key={background}
                      className="mr-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground border-border capitalize"
                    >
                      {background || 'N/A'}
                    </Badge>
                  ))}
                </div>
              </div>}
            </div>
          </CardContent>
        </Card>

        {/* Preferences & Location */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex justify-between items-center text-primary">
              <div className="flex items-center">
                <Settings2 className="mr-2" /> Funding Preferences
              </div>
              <Button
                variant="button"
                size="sm"
                className="text-primary"
                onClick={() => goToStep(4,4)}
              >
                <Edit2 />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  Repayment Frequency
                </h3>
                <h3 className="text-primary font-semibold capitalize">
                  {formData.repaymentFrequency}
                </h3>
              </div>

              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  Repayment Duration
                </h3>
                <h3 className="text-primary font-semibold capitalize">
                  {formData.repaymentDuration}
                </h3>
              </div>

              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  Investor Share
                </h3>
                <h3 className="text-primary font-semibold capitalize">
                  {formData.openToEquity}
                </h3>
              </div>

              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  Collateral/Security
                </h3>
                <h3 className="text-primary font-semibold capitalize">
                  {formData.canProvideCollateral}
                </h3>
              </div>
              
              <div className="flex justify-between items-center pb-1 border-b">
                <h3 className="font-medium text-muted-foreground">
                  Impact Focus
                </h3>
                <h3 className="text-primary font-semibold capitalize">
                  {formData.impactFocus}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-primary text-primary-foreground"
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
