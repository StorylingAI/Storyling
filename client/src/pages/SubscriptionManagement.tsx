import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, CreditCard, Users, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { SUBSCRIPTION_PRODUCTS } from "../../../shared/subscriptionProducts";

interface SubscriptionManagementProps {
  organizationId: number;
}

export default function SubscriptionManagement({ organizationId }: SubscriptionManagementProps) {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedTier, setSelectedTier] = useState<"basic">("basic");
  const [studentCount, setStudentCount] = useState(100);
  const [newSeatCount, setNewSeatCount] = useState(0);
  const [showUpdateSeatsDialog, setShowUpdateSeatsDialog] = useState(false);

  const { data: subscription, isLoading, refetch } = trpc.checkout.getSubscriptionStatus.useQuery({
    organizationId,
  });

  const createCheckoutMutation = trpc.checkout.createSubscriptionCheckout.useMutation({
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
      toast.success("Redirecting to checkout...");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout session");
    },
  });

  const updateSeatsMutation = trpc.checkout.updateSubscriptionSeats.useMutation({
    onSuccess: () => {
      toast.success("Seats updated successfully");
      setShowUpdateSeatsDialog(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update seats");
    },
  });

  const cancelMutation = trpc.checkout.cancelSubscription.useMutation({
    onSuccess: () => {
      toast.success("Subscription will be cancelled at the end of the billing period");
      setShowCancelDialog(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel subscription");
    },
  });

  const handleUpgrade = () => {
    createCheckoutMutation.mutate({
      organizationId,
      tier: selectedTier,
      studentCount,
    });
    setShowUpgradeDialog(false);
  };

  const handleUpdateSeats = () => {
    updateSeatsMutation.mutate({
      organizationId,
      newStudentCount: newSeatCount,
    });
  };

  const handleCancelSubscription = () => {
    cancelMutation.mutate({ organizationId });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const isTrial = subscription?.isTrial || subscription?.tier === "trial";
  const isActive = subscription?.status === "active";

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Subscription</CardTitle>
              <CardDescription>Manage your organization's subscription plan</CardDescription>
            </div>
            <Badge variant={isActive ? "default" : "secondary"}>
              {subscription?.status || "trial"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Plan</p>
                <p className="text-lg font-semibold capitalize">{subscription?.tier}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Students</p>
                <p className="text-lg font-semibold">
                  {subscription?.currentStudents} / {subscription?.maxStudents}
                </p>
              </div>
            </div>

            {!isTrial && subscription?.currentPeriodEnd && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Renews</p>
                  <p className="text-lg font-semibold">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {subscription?.cancelAtPeriodEnd && (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Your subscription will be cancelled at the end of the current billing period.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            {isTrial ? (
              <Button onClick={() => setShowUpgradeDialog(true)}>Upgrade to Paid Plan</Button>
            ) : (
              <>
                <Button onClick={() => {
                  setNewSeatCount(subscription?.currentStudents || 0);
                  setShowUpdateSeatsDialog(true);
                }}>
                  Update Seats
                </Button>
                {!subscription?.cancelAtPeriodEnd && (
                  <Button variant="outline" onClick={() => setShowCancelDialog(true)}>
                    Cancel Subscription
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      {isTrial && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(["basic"] as const).map((tier) => {
            const product = SUBSCRIPTION_PRODUCTS[tier];
            return (
              <Card key={tier} className={selectedTier === tier ? "border-blue-500 border-2" : ""}>
                <CardHeader>
                  <CardTitle className="capitalize">{product.name}</CardTitle>
                  <CardDescription>{product.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${product.pricePerStudent}</span>
                    <span className="text-gray-600">/student/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {product.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={selectedTier === tier ? "default" : "outline"}
                    onClick={() => {
                      setSelectedTier(tier);
                      setShowUpgradeDialog(true);
                    }}
                  >
                    Select {product.name}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to {SUBSCRIPTION_PRODUCTS[selectedTier].name}</DialogTitle>
            <DialogDescription>
              Choose the number of student seats for your organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="studentCount">Number of Students</Label>
              <Input
                id="studentCount"
                type="number"
                min="1"
                max={SUBSCRIPTION_PRODUCTS[selectedTier].maxStudents}
                value={studentCount}
                onChange={(e) => setStudentCount(parseInt(e.target.value) || 1)}
              />
              <p className="text-sm text-gray-500">
                Maximum: {SUBSCRIPTION_PRODUCTS[selectedTier].maxStudents} students
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Monthly Cost</span>
                <span className="text-2xl font-bold">
                  ${(SUBSCRIPTION_PRODUCTS[selectedTier].pricePerStudent * studentCount).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {studentCount} students × ${SUBSCRIPTION_PRODUCTS[selectedTier].pricePerStudent}/month
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpgrade} disabled={createCheckoutMutation.isPending}>
              {createCheckoutMutation.isPending ? "Processing..." : "Continue to Checkout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Seats Dialog */}
      <Dialog open={showUpdateSeatsDialog} onOpenChange={setShowUpdateSeatsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Student Seats</DialogTitle>
            <DialogDescription>
              Add or remove seats from your subscription
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newSeatCount">Number of Students</Label>
              <Input
                id="newSeatCount"
                type="number"
                min="1"
                max={subscription?.maxStudents || 2000}
                value={newSeatCount}
                onChange={(e) => setNewSeatCount(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">New Monthly Cost</span>
                <span className="text-2xl font-bold">
                  ${subscription?.tier === "basic" ? newSeatCount * 5 : newSeatCount * 4}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateSeatsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSeats} disabled={updateSeatsMutation.isPending}>
              {updateSeatsMutation.isPending ? "Updating..." : "Update Seats"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You'll continue to have access until
              the end of your billing period.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
