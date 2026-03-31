import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useIsRestoring } from "@tanstack/react-query";
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
  const isRestoring = useIsRestoring();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * (attemptIndex + 1), 3000),
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  // Treat auth as pending while IndexedDB cache is restoring, while the
  // initial fetch is running, or while a refetch is in progress with no
  // authenticated data yet.  This prevents premature redirects when stale
  // null data is hydrated from persistence before the network response arrives.
  const isAuthPending =
    isRestoring ||
    meQuery.isLoading ||
    (meQuery.isFetching && !meQuery.data) ||
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
