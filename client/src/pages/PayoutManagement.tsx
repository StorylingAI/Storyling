// Original implementation preserved in git history (Stripe Connect not yet implemented)
// To restore: git show HEAD:client/src/pages/PayoutManagement.tsx

import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PayoutManagement() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="container max-w-5xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/referrals")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Referrals
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "Fredoka, sans-serif" }}>
            Coming Soon
          </h2>
          <p className="text-gray-500 max-w-md mb-6">
            The payout system is being finalized. You'll be able to manage your earnings and request payouts here very soon.
          </p>
          <a href="/app" className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-teal-500 text-white font-semibold hover:opacity-90 transition-all">
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
