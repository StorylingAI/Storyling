import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, TrendingUp, DollarSign, Users, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

interface ReferralWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralCode: string;
}

export function ReferralWelcomeModal({ isOpen, onClose, referralCode }: ReferralWelcomeModalProps) {
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (isOpen) {
      // Trigger confetti when modal opens
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#06b6d4', '#ec4899'],
      });
    }
  }, [isOpen]);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            🎉 Welcome to the Referral Program!
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {step === 1 && "You're now part of our referral community"}
            {step === 2 && "Here's how to share your unique link"}
            {step === 3 && "Track your success and earnings"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Share2 className="h-10 w-10 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Your Referral Journey Begins!</h3>
                <p className="text-muted-foreground">
                  You now have access to your unique referral link and dashboard. 
                  Let's get you started with a quick tour of the key features.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Earn Free Months</p>
                </div>
                <div className="p-4 bg-teal-50 rounded-lg">
                  <Users className="h-8 w-8 text-teal-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Track Referrals</p>
                </div>
                <div className="p-4 bg-pink-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-pink-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">View Analytics</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Sharing Your Link */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center">
                  <Share2 className="h-10 w-10 text-white" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Share Your Unique Link</h3>
                <p className="text-muted-foreground mb-4">
                  Your referral code: <span className="font-mono font-bold text-purple-600">{referralCode}</span>
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Your referral link:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border rounded-md text-sm"
                  />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(referralLink);
                    }}
                    variant="outline"
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Share on social media</p>
                    <p className="text-sm text-muted-foreground">Post your link on Twitter, LinkedIn, or Facebook</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Add to your website or blog</p>
                    <p className="text-sm text-muted-foreground">Include your referral link in relevant content</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Email your audience</p>
                    <p className="text-sm text-muted-foreground">Share with your newsletter subscribers</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Track Your Success */}
          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                  <TrendingUp className="h-10 w-10 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Track Your Rewards</h3>
                <p className="text-muted-foreground">
                  Your referral dashboard shows real-time stats on clicks, conversions, and free months earned.
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">0</p>
                    <p className="text-sm text-muted-foreground">Total Referrals</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-2xl font-bold text-teal-600">0</p>
                    <p className="text-sm text-muted-foreground">Free Months Earned</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Visit your dashboard anytime to see detailed analytics and redeem your free months
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i === step ? "bg-purple-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {step < 3 && (
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tour
              </Button>
            )}
            <Button onClick={handleNext}>
              {step < 3 ? "Next" : "Get Started"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
