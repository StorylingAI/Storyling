import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  
  const subscribeToNotifications = trpc.notifications.subscribeToPush.useMutation();
  const unsubscribeFromNotifications = trpc.notifications.unsubscribeFromPush.useMutation();

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("This browser doesn't support notifications");
      return false;
    }

    if (!("serviceWorker" in navigator)) {
      toast.error("This browser doesn't support service workers");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === "granted") {
        // Register service worker
        const registration = await navigator.serviceWorker.register("/sw.js");
        
        // Subscribe to push notifications
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            // This is a placeholder VAPID public key - in production, generate your own
            "BEl62iUYgUivxIkv69yViEuiBIa-Ib27SzV95-nSwcCvrCvHCjWPRYT7-Qm5Q6aGxQKPITLMqIvDJQv0Wy2dIeA"
          )
        });

        setSubscription(sub);

        // Send subscription to backend
        await subscribeToNotifications.mutateAsync({
          subscription: JSON.parse(JSON.stringify(sub))
        });

        toast.success("Notifications enabled! You'll receive weekly goal reminders.");
        return true;
      } else {
        toast.error("Notification permission denied");
        return false;
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
      toast.error("Failed to enable notifications");
      return false;
    }
  };

  const unsubscribe = async () => {
    try {
      if (subscription) {
        await subscription.unsubscribe();
        await unsubscribeFromNotifications.mutateAsync();
        setSubscription(null);
        toast.success("Notifications disabled");
      }
    } catch (error) {
      console.error("Error unsubscribing:", error);
      toast.error("Failed to disable notifications");
    }
  };

  return {
    permission,
    subscription,
    requestPermission,
    unsubscribe,
    isSupported: "Notification" in window && "serviceWorker" in navigator
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
