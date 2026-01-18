import { useNavigate } from "react-router-dom";
import {
  Building2,
  Store,
  Lightbulb,
  FileText,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Search,
  Info,
  Target,
  TrendingUp,
  Clock,
  Zap,
  Star,
  X,
  MapPin,
  DollarSign,
  Users,
  Shield,
  Wallet,
  CreditCard,
  Smartphone,
  Banknote,
  Receipt,
  Sparkles,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function FundingReadyStatus({
    handleSubmit
}) {
    const navigate = useNavigate();
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 mb-4">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-purple-600 mb-2">Great news! You're funding-ready</h1>
            <p className="text-muted-foreground text-lg">
              Based on your profile, we've identified 1 funding categories perfect for your business. Complete the detailed assessment to unlock specific programs and funders.
            </p>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-3xl font-bold mb-1">89%</div>
                <div className="text-sm text-muted-foreground">Match Score</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-3xl font-bold mb-1">1</div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-3xl font-bold mb-1">1-2 weeks</div>
                <div className="text-sm text-muted-foreground">Timeline</div>
              </CardContent>
            </Card>
          </div>

          {/* Funding Categories */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <CardTitle>Your Funding Categories</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-4">
                  <TrendingUp className="w-8 h-8 text-green-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Working Capital</h3>
                    <p className="text-sm text-muted-foreground mb-2">Cash flow solutions for operations</p>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="text-purple-600 border-purple-600">
                        R50k - R2M
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Zap className="w-4 h-4" />
                        <span>72 hours</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">3 specific programs match your profile</p>
                  </div>
                </div>
                <Badge className="bg-green-600">89% match</Badge>
              </div>
            </CardContent>
          </Card>

          {/* CTA Card */}
          <Card className="bg-gradient-to-br from-purple-600 to-blue-600 text-white mb-8">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <Target className="w-12 h-12 mx-auto mb-4 text-white" />
                <h2 className="text-2xl font-bold mb-2">Ready to unlock specific funders?</h2>
                <p className="text-white/90">
                  Complete our detailed assessment to get matched with specific funding programs, application deadlines, and direct contact details.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">50+</div>
                  <div className="text-sm text-white/80">Active Funders</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">15+</div>
                  <div className="text-sm text-white/80">Your Programs</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">5</div>
                  <div className="text-sm text-white/80">Closing Soon</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">92%</div>
                  <div className="text-sm text-white/80">Success Rate</div>
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleSubmit}
                  className="bg-white text-purple-600 hover:bg-white/90"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Complete Assessment →
                </Button>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Save & Continue Later
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Testimonial */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex justify-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                500+ SA businesses have successfully secured funding through our platform
              </p>
              <p className="text-sm italic text-muted-foreground">
                "The detailed assessment helped me find grants I never knew existed" - Sarah M., Cape Town
              </p>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Funding
            </Button>
          </div>
        </div>
      </div>
    )
}