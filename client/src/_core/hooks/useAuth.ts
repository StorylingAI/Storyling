import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useRef } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();
  const redirectAttempted = useRef(false);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    // Retry up to 2 times with a delay — prevents false logouts from transient DB errors
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * (attemptIndex + 1), 3000),
    refetchOnWindowFocus: false,
    // Keep stale data while refetching so the user doesn't flash to login screen
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const isAuthPending =
    meQuery.isLoading ||
    (meQuery.isFetching && typeof meQuery.data === "undefined") ||
    logoutMutation.isPending;

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      redirectAttempted.current = false;
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    return {
      user: meQuery.data ?? null,
      // Keep rendering with cached auth data during background refetches.
      loading: isAuthPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    isAuthPending,
    meQuery.data,
    meQuery.error,
    logoutMutation.error,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data ?? null)
    );
  }, [meQuery.data]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    // Wait until the initial auth state has settled.
    if (isAuthPending) return;
    if (state.user) {
      // User is authenticated — reset redirect guard
      redirectAttempted.current = false;
      return;
    }
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;
    // Prevent double-redirect
    if (redirectAttempted.current) return;

    redirectAttempted.current = true;
    window.location.href = redirectPath;
  }, [
    isAuthPending,
    redirectOnUnauthenticated,
    redirectPath,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
