import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Loader2, CheckCircle2, Users, TrendingUp, DollarSign } from "lucide-react";

export default function AffiliateApplication() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    websiteUrl: "",
    socialMediaHandles: "",
    audienceSize: "",
    promotionStrategy: "",
    whyJoin: "",
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (user === null) {
      window.location.href = getLoginUrl();
    }
  }, [user]);

  // Check if user already has a referral code (is already an affiliate)
  const { data: referralCode, isLoading: codeLoading } = trpc.referral.getMyReferralCode.useQuery(
    undefined,
    { enabled: !!user }
  );

  const applyMutation = trpc.referral.applyForAffiliate.useMutation({
    onSuccess: () => {
      toast.success("Application submitted successfully!", {
        description: "We'll review your application and get back to you soon.",
      });
      setLocation("/referrals");
    },
    onError: (error) => {
      toast.error("Application failed", {
        description: error.message,
      });
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    applyMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Show loading state while checking auth and referral code
  if (!user || codeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // If user already has a referral code, redirect to referrals page
  if (referralCode?.code) {
    setLocation("/referrals");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="container max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Become a Storyling AI Affiliate</h1>
          <p className="text-lg text-muted-foreground">
            Join our affiliate program and earn rewards by sharing Storyling AI with your audience
          </p>
        </div>

        {/* Benefits Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <DollarSign className="h-10 w-10 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Earn Commission</h3>
              <p className="text-sm text-muted-foreground">
                Get rewarded for every referral that converts
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="h-10 w-10 text-teal-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Help Learners</h3>
              <p className="text-sm text-muted-foreground">
                Share a tool that transforms language learning
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-10 w-10 text-pink-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Track Performance</h3>
              <p className="text-sm text-muted-foreground">
                Access detailed analytics and insights
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle>Application Form</CardTitle>
            <CardDescription>
              Tell us about yourself and how you plan to promote Storyling AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">
                  Website URL <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={formData.websiteUrl}
                  onChange={(e) => handleChange("websiteUrl", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="socialMediaHandles">
                  Social Media Handles <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Input
                  id="socialMediaHandles"
                  placeholder="@yourhandle on Twitter, Instagram, etc."
                  value={formData.socialMediaHandles}
                  onChange={(e) => handleChange("socialMediaHandles", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="audienceSize">
                  Estimated Audience Size <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="audienceSize"
                  placeholder="e.g., 10,000 followers, 5,000 monthly visitors"
                  value={formData.audienceSize}
                  onChange={(e) => handleChange("audienceSize", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promotionStrategy">
                  How will you promote Storyling AI? <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="promotionStrategy"
                  placeholder="Describe your promotion strategy (e.g., blog posts, social media, email newsletter, YouTube videos)"
                  value={formData.promotionStrategy}
                  onChange={(e) => handleChange("promotionStrategy", e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whyJoin">
                  Why do you want to join our affiliate program? <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="whyJoin"
                  placeholder="Tell us what excites you about Storyling AI and why you'd be a great affiliate partner"
                  value={formData.whyJoin}
                  onChange={(e) => handleChange("whyJoin", e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/affiliates")}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Submit Application
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            By applying, you agree to our affiliate program terms and conditions.
            We typically review applications within 2-3 business days.
          </p>
        </div>
      </div>
    </div>
  );
}
