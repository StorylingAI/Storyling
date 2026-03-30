import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Calendar, AlertCircle, CheckCircle2, Crown, Sparkles, Download, ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { toast } from "sonner";

export function SubscriptionSettings() {
  const [, setLocation] = useLocation();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);

  const { data: subscription, isLoading, refetch } = trpc.subscription.getMySubscription.useQuery();
  const { data: usage } = trpc.subscription.getUsageStats.useQuery();
  const { data: billingHistory, isLoading: historyLoading } = trpc.subscription.getBillingHistory.useQuery();

  const cancelMutation = trpc.subscription.cancelSubscription.useMutation({
    onSuccess: () => {
      toast.success("Subscription Cancelled", {
        description: "Your subscription will remain active until the end of the current billing period.",
      });
      setShowCancelDialog(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const reactivateMutation = trpc.subscription.reactivateSubscription.useMutation({
    onSuccess: () => {
      toast.success("Subscription Reactivated", {
        description: "Your subscription will continue as normal.",
      });
      setShowReactivateDialog(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const portalMutation = trpc.subscription.createPortalSession.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Unable to load subscription information.</AlertDescription>
      </Alert>
    );
  }

  const isPremium = subscription.isPremium;
  const isCancelled = subscription.cancelAtPeriodEnd;

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscription</h1>
        <p className="text-muted-foreground mt-2">Manage your subscription and billing</p>
      </div>

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPremium ? (
                <Crown className="h-6 w-6 text-amber-500" />
              ) : (
                <Sparkles className="h-6 w-6 text-gray-400" />
              )}
              <div>
                <CardTitle className="flex items-center gap-2">
                  {subscription.tier === "premium" ? "Premium Plan" : "Free Plan"}
                  {isPremium && <Badge className="bg-amber-500">Active</Badge>}
                  {isCancelled && <Badge variant="destructive">Cancelling</Badge>}
                </CardTitle>
                <CardDescription>
                  {isPremium
                    ? "Unlimited stories, all formats, and advanced features"
                    : "5 stories per month, podcast format only"}
                </CardDescription>
              </div>
            </div>
            {!isPremium && (
              <Button onClick={() => setLocation("/pricing")}>
                <Crown className="mr-2 h-4 w-4" />
                Upgrade to Premium
              </Button>
            )}
          </div>
        </CardHeader>

        {isPremium && (
          <CardContent className="space-y-4">
            {/* Billing Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Billing Period</p>
                  <p className="text-sm text-muted-foreground">
                    {subscription.billingPeriod === "monthly" ? "Monthly" : "Annual"}
                  </p>
                </div>
              </div>

              {subscription.currentPeriodEnd && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">
                      {isCancelled ? "Active Until" : "Renews On"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}

              {subscription.paymentMethod && (
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Payment Method</p>
                    <p className="text-sm text-muted-foreground">
                      {subscription.paymentMethod.brand.toUpperCase()} •••• {subscription.paymentMethod.last4}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {isCancelled && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your subscription will be cancelled at the end of the current billing period. You'll continue to have
                  access to Premium features until{" "}
                  {subscription.currentPeriodEnd &&
                    new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              {subscription.paymentMethod && (
                <Button
                  variant="outline"
                  onClick={() => portalMutation.mutate()}
                  disabled={portalMutation.isPending}
                >
                  {portalMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Update Payment Method
                    </>
                  )}
                </Button>
              )}

              {isCancelled ? (
                <Button variant="default" onClick={() => setShowReactivateDialog(true)}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Reactivate Subscription
                </Button>
              ) : (
                <Button variant="destructive" onClick={() => setShowCancelDialog(true)}>
                  Cancel Subscription
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Billing History */}
      {isPremium && (
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>View and download your past invoices</CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : billingHistory?.invoices && billingHistory.invoices.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingHistory.invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(invoice.created).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {invoice.currency} ${invoice.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={invoice.status === "paid" ? "default" : "secondary"}
                            className={invoice.status === "paid" ? "bg-green-500" : ""}
                          >
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {invoice.invoicePdf && (
                              <Button
                                size="sm"
                                variant="ghost"
                                asChild
                              >
                                <a href={invoice.invoicePdf} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {invoice.hostedInvoiceUrl && (
                              <Button
                                size="sm"
                                variant="ghost"
                                asChild
                              >
                                <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No billing history available</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Usage Stats for Free Tier */}
      {!isPremium && usage && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Usage</CardTitle>
            <CardDescription>Track your story creation today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Stories Created Today</span>
                <span className="font-medium">
                  {usage.storiesToday} / {usage.storiesLimit ?? '\u221e'}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${usage.storiesLimit ? Math.min((usage.storiesToday / usage.storiesLimit) * 100, 100) : 0}%`,
                  }}
                />
              </div>
              {!usage.canCreateStory && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You've reached your daily limit. Upgrade to Premium for unlimited stories.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Premium Features */}
      {!isPremium && (
        <Card>
          <CardHeader>
            <CardTitle>Premium Features</CardTitle>
            <CardDescription>Unlock the full potential of Storyling.ai</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Unlimited story generation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Access to Film format with AI-generated videos</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Advanced vocabulary mastery system</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Detailed analytics and insights</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Priority support</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Export progress reports</span>
              </li>
            </ul>
            <Button className="w-full mt-6" size="lg" onClick={() => setLocation("/pricing")}>
              <Crown className="mr-2 h-4 w-4" />
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your Premium subscription? You'll continue to have access until the end of
              your current billing period.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Subscription"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate Dialog */}
      <Dialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reactivate Subscription</DialogTitle>
            <DialogDescription>
              Welcome back! Your subscription will continue and you'll be charged at the end of the current period.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReactivateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => reactivateMutation.mutate()} disabled={reactivateMutation.isPending}>
              {reactivateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reactivating...
                </>
              ) : (
                "Reactivate Subscription"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
