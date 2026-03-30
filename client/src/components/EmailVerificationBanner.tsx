import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const resendMutation = trpc.emailAuth.resendVerification.useMutation({
    onSuccess: () => {
      toast.success("Verification email sent! Please check your inbox.");
      setDismissed(true);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to resend verification email");
    },
  });

  // Don't show if user is not logged in, email is verified, or banner is dismissed
  if (!user || user.emailVerified || dismissed) {
    return null;
  }

  // Only show for email/password users (not OAuth users)
  if (user.loginMethod !== "email") {
    return null;
  }

  const handleResend = () => {
    if (user.email) {
      resendMutation.mutate({ email: user.email });
    }
  };

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-full"
      style={{
        background: "rgba(234, 179, 8, 0.15)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(234, 179, 8, 0.35)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
        maxWidth: 480,
      }}
    >
      <Mail className="h-4 w-4 text-yellow-300 flex-shrink-0" />
      <span
        className="text-xs text-yellow-100 flex-1 truncate"
        style={{ fontFamily: "Fredoka, sans-serif" }}
      >
        Verify your email to unlock all features
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleResend}
        disabled={resendMutation.isPending}
        className="h-6 px-2 text-xs rounded-full text-yellow-200 hover:text-white hover:bg-yellow-500/20 flex-shrink-0"
        style={{ fontFamily: "Fredoka, sans-serif" }}
      >
        {resendMutation.isPending ? "..." : "Resend"}
      </Button>
      <button
        onClick={() => setDismissed(true)}
        className="h-5 w-5 flex items-center justify-center rounded-full text-yellow-300/60 hover:text-yellow-200 hover:bg-yellow-500/20 flex-shrink-0"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
