import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Loader2, DollarSign, CreditCard, Building2, CheckCircle2, Clock, XCircle, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function PayoutManagement() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "stripe">("paypal");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [bankDetails, setBankDetails] = useState({
    accountName: "",
    accountNumber: "",
    routingNumber: "",
    bankName: "",
  });
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (user === null) {
      window.location.href = getLoginUrl();
    }
  }, [user]);

  // Fetch affiliate stats
  const { data: stats, isLoading: statsLoading } = trpc.referral.getMyReferralStats.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Fetch payout history
  const { data: payoutHistory = [], isLoading: historyLoading } = trpc.payout.getPayoutHistory.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Fetch available balance
  const { data: balance, isLoading: balanceLoading } = trpc.payout.getAvailableBalance.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Request payout mutation
  const requestPayoutMutation = trpc.payout.requestPayout.useMutation({
    onSuccess: () => {
      toast.success("Payout request submitted!", {
        description: "We'll process your request within 3-5 business days.",
      });
      setIsRequestingPayout(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to request payout");
      setIsRequestingPayout(false);
    },
  });

  const handleRequestPayout = async () => {
    if (paymentMethod === "paypal" && !paypalEmail) {
      toast.error("Please enter your PayPal email");
      return;
    }

    if (!balance || balance.availableForPayout < 50) {
      toast.error("Minimum payout amount is $50");
      return;
    }

    setIsRequestingPayout(true);
    
    requestPayoutMutation.mutate({
      amount: balance.availableForPayout,
      method: paymentMethod,
      paypalEmail: paymentMethod === "paypal" ? paypalEmail : undefined,
    });
  };

  // Show loading state
  if (!user || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const pendingEarnings = balance?.totalEarned || 0;
  const availableForPayout = balance?.availableForPayout || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/referrals")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold mb-2">Payout Management</h1>
          <p className="text-muted-foreground">
            Manage your earnings and request payouts
          </p>
        </div>

        {/* Earnings Overview */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <p className="text-3xl font-bold">${pendingEarnings.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available for Payout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <p className="text-3xl font-bold">${availableForPayout.toFixed(2)}</p>
              </div>
              {pendingEarnings < 50 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Minimum payout: $50
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.totalReferrals || 0}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="request" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="request">Request Payout</TabsTrigger>
            <TabsTrigger value="history">Payout History</TabsTrigger>
          </TabsList>

          {/* Request Payout Tab */}
          <TabsContent value="request" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Request a Payout</CardTitle>
                <CardDescription>
                  Choose your payment method and submit a payout request
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {availableForPayout < 50 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      You need at least $50 in earnings to request a payout. 
                      Current balance: ${pendingEarnings.toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={(value: "paypal" | "stripe") => setPaymentMethod(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paypal">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              PayPal
                            </div>
                          </SelectItem>
                          <SelectItem value="stripe">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Stripe
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {paymentMethod === "paypal" && (
                      <div className="space-y-2">
                        <Label htmlFor="paypalEmail">PayPal Email</Label>
                        <Input
                          id="paypalEmail"
                          type="email"
                          placeholder="your@email.com"
                          value={paypalEmail}
                          onChange={(e) => setPaypalEmail(e.target.value)}
                        />
                      </div>
                    )}

                    {paymentMethod === "stripe" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="accountName">Account Holder Name</Label>
                          <Input
                            id="accountName"
                            placeholder="John Doe"
                            value={bankDetails.accountName}
                            onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accountNumber">Account Number</Label>
                          <Input
                            id="accountNumber"
                            placeholder="1234567890"
                            value={bankDetails.accountNumber}
                            onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="routingNumber">Routing Number</Label>
                          <Input
                            id="routingNumber"
                            placeholder="123456789"
                            value={bankDetails.routingNumber}
                            onChange={(e) => setBankDetails({ ...bankDetails, routingNumber: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bankName">Bank Name</Label>
                          <Input
                            id="bankName"
                            placeholder="Bank of America"
                            value={bankDetails.bankName}
                            onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Payout Amount:</strong> ${availableForPayout.toFixed(2)}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Processing time: 3-5 business days
                      </p>
                    </div>

                    <Button
                      onClick={handleRequestPayout}
                      disabled={isRequestingPayout}
                      className="w-full"
                    >
                      {isRequestingPayout ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Request Payout
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payout History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payout History</CardTitle>
                <CardDescription>
                  View all your past payout requests and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payoutHistory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No payout history yet</p>
                    <p className="text-sm">Request your first payout to see it here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payoutHistory.map((payout: any) => (
                      <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-purple-100 rounded-full">
                            <DollarSign className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold">${payout.amount.toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">{payout.method}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            payout.status === "completed" ? "default" :
                            payout.status === "pending" ? "secondary" :
                            "destructive"
                          }>
                            {payout.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">{payout.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
