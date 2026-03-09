import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Users,
  DollarSign,
  MousePointerClick,
  Copy,
  Check,
  ExternalLink,
  Download,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export function AffiliateAnalytics() {
  const [copied, setCopied] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal" | "bank_transfer">("stripe");

  const { data: analytics, isLoading: analyticsLoading } = trpc.affiliate.getAnalytics.useQuery();
  const { data: referralLink } = trpc.affiliate.getReferralLink.useQuery();
  const { data: conversions } = trpc.affiliate.getConversions.useQuery();
  const { data: earnings } = trpc.affiliate.getEarnings.useQuery();
  const { data: payouts } = trpc.affiliate.getPayouts.useQuery();

  const requestPayoutMutation = trpc.affiliate.requestPayout.useMutation({
    onSuccess: () => {
      toast.success("Payout requested successfully!");
      setPayoutAmount("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCopyLink = () => {
    if (referralLink?.url) {
      navigator.clipboard.writeText(referralLink.url);
      setCopied(true);
      toast.success("Referral link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRequestPayout = () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    requestPayoutMutation.mutate({
      amount,
      paymentMethod,
    });
  };

  if (analyticsLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  const pendingEarnings = parseFloat(analytics?.pendingEarnings || "0");
  const totalEarnings = parseFloat(analytics?.totalEarnings || "0");
  const paidEarnings = parseFloat(analytics?.paidEarnings || "0");
  const conversionRate = typeof analytics?.conversionRate === 'string' ? parseFloat(analytics.conversionRate) : (analytics?.conversionRate || 0);

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Affiliate Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Track your referrals, earnings, and performance metrics
        </p>
      </div>

      {/* Referral Link Card */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>
            Share this link to earn commissions when users sign up or upgrade to premium
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={referralLink?.url || ""}
              readOnly
              className="flex-1 font-mono text-sm"
            />
            <Button onClick={handleCopyLink} variant="outline" size="icon">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button
              onClick={() => window.open(referralLink?.url, "_blank")}
              variant="outline"
              size="icon"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span>Code: <span className="font-mono font-semibold">{referralLink?.code}</span></span>
            <span>•</span>
            <span>Used: {referralLink?.usageCount || 0} times</span>
            <span>•</span>
            <Badge variant={referralLink?.isActive ? "default" : "secondary"}>
              {referralLink?.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalClicks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique visitors to your referral link
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalConversions || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Users who signed up via your link
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Click-to-signup conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime commission earnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings & Payout Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Earnings Summary</CardTitle>
            <CardDescription>Your commission breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pending Earnings</span>
              <span className="text-lg font-semibold text-yellow-600">
                ${pendingEarnings.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Paid Out</span>
              <span className="text-lg font-semibold text-green-600">
                ${paidEarnings.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-sm font-medium">Total Earned</span>
              <span className="text-xl font-bold">${totalEarnings.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Payout</CardTitle>
            <CardDescription>Withdraw your pending earnings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingEarnings < 50 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Minimum payout amount is $50.00. You have ${pendingEarnings.toFixed(2)} available.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="50.00"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                min="50"
                step="0.01"
                disabled={pendingEarnings < 50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value: any) => setPaymentMethod(value)}
                disabled={pendingEarnings < 50}
              >
                <SelectTrigger id="payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleRequestPayout}
              disabled={pendingEarnings < 50 || requestPayoutMutation.isPending}
              className="w-full"
            >
              {requestPayoutMutation.isPending ? "Processing..." : "Request Payout"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <Tabs defaultValue="conversions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="earnings">Earnings History</TabsTrigger>
          <TabsTrigger value="payouts">Payout History</TabsTrigger>
          <TabsTrigger value="performance">Performance by Code</TabsTrigger>
        </TabsList>

        <TabsContent value="conversions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Details</CardTitle>
              <CardDescription>Users who signed up or upgraded using your referral link</CardDescription>
            </CardHeader>
            <CardContent>
              {conversions && conversions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Code Used</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Reward Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversions.map((conversion) => (
                      <TableRow key={conversion.id}>
                        <TableCell className="font-medium">
                          {conversion.referredUserEmail || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{conversion.code}</Badge>
                        </TableCell>
                        <TableCell>{conversion.discountApplied}%</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              conversion.rewardStatus === "applied"
                                ? "default"
                                : conversion.rewardStatus === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {conversion.rewardStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {conversion.createdAt ? new Date(conversion.createdAt).toLocaleDateString() : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversions yet. Share your referral link to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Earnings History</CardTitle>
              <CardDescription>Detailed breakdown of your commission earnings</CardDescription>
            </CardHeader>
            <CardContent>
              {earnings && earnings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {earnings.map((earning) => (
                      <TableRow key={earning.id}>
                        <TableCell>
                          {new Date(earning.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{earning.conversionType}</Badge>
                        </TableCell>
                        <TableCell>{earning.commissionPercent}%</TableCell>
                        <TableCell className="font-semibold">
                          ${parseFloat(earning.commissionAmount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              earning.payoutStatus === "paid"
                                ? "default"
                                : earning.payoutStatus === "pending"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {earning.payoutStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No earnings yet. Start referring users to earn commissions!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>Track your payout requests and payments</CardDescription>
            </CardHeader>
            <CardContent>
              {payouts && payouts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date Requested</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell>
                          {new Date(payout.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${parseFloat(payout.requestedAmount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payout.paymentMethod}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payout.status === "completed"
                                ? "default"
                                : payout.status === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {payout.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payout.completedAt
                            ? new Date(payout.completedAt).toLocaleDateString()
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payout requests yet. Request a payout when you reach $50.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Referral Code</CardTitle>
              <CardDescription>See how each of your referral codes is performing</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.clicksByCode && analytics.clicksByCode.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>Conversions</TableHead>
                      <TableHead>Conversion Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.clicksByCode.map((codeData) => (
                      <TableRow key={codeData.codeId}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {codeData.code}
                          </Badge>
                        </TableCell>
                        <TableCell>{codeData.clicks}</TableCell>
                        <TableCell>{codeData.conversions}</TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            {parseFloat(codeData.conversionRate).toFixed(2)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No performance data yet. Share your referral link to start tracking!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
