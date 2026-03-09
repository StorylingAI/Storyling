import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
    <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
      <Mail className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <span className="font-medium text-yellow-900 dark:text-yellow-100">
            Please verify your email address
          </span>
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
            We sent a verification link to <strong>{user.email}</strong>. 
            Click the link in the email to verify your account.
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={resendMutation.isPending}
            className="whitespace-nowrap"
          >
            {resendMutation.isPending ? "Sending..." : "Resend Email"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
