import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { APP_TITLE, APP_LOGO } from "@/const";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error" | "resend">("loading");

  const verifyMutation = trpc.emailAuth.verifyEmail.useMutation({
    onSuccess: () => {
      setStatus("success");
      toast.success("Email verified successfully!");
      setTimeout(() => {
        setLocation("/app");
      }, 2000);
    },
    onError: (error) => {
      setStatus("error");
      toast.error(error.message || "Failed to verify email");
    },
  });

  const resendMutation = trpc.emailAuth.resendVerification.useMutation({
    onSuccess: () => {
      toast.success("Verification email sent! Please check your inbox.");
      setStatus("resend");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to resend verification email");
    },
  });

  useEffect(() => {
    // Get token from URL query params
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    
    if (tokenParam) {
      setToken(tokenParam);
      verifyMutation.mutate({ token: tokenParam });
    } else {
      setStatus("error");
    }
  }, []);

  const handleResend = () => {
    const email = prompt("Please enter your email address:");
    if (email) {
      resendMutation.mutate({ email });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-12 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
          <CardDescription>
            {status === "loading" && "Verifying your email address..."}
            {status === "success" && "Your email has been verified!"}
            {status === "error" && "Verification failed"}
            {status === "resend" && "Check your email"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center py-8">
            {status === "loading" && (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground text-center">
                  Please wait while we verify your email address...
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <p className="text-center font-medium mb-2">Email verified successfully!</p>
                <p className="text-muted-foreground text-center text-sm">
                  Redirecting you to the dashboard...
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="h-16 w-16 text-red-500 mb-4" />
                <p className="text-center font-medium mb-2">Verification failed</p>
                <p className="text-muted-foreground text-center text-sm mb-4">
                  The verification link may have expired or is invalid.
                </p>
                <Button onClick={handleResend} className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </Button>
              </>
            )}

            {status === "resend" && (
              <>
                <Mail className="h-16 w-16 text-primary mb-4" />
                <p className="text-center font-medium mb-2">Verification email sent!</p>
                <p className="text-muted-foreground text-center text-sm mb-4">
                  Please check your inbox and click the verification link.
                </p>
                <Button onClick={() => setLocation("/app")} variant="outline" className="w-full">
                  Go to Dashboard
                </Button>
              </>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <Button
              variant="link"
              className="p-0 h-auto font-normal"
              onClick={() => setLocation("/app")}
            >
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
