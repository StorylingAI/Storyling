import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import { get, set, del } from 'idb-keyval';
import { registerSW } from 'virtual:pwa-register';
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

const persister = createAsyncStoragePersister({
  storage: {
    getItem: (key: string) => get(key),
    setItem: (key: string, value: string) => set(key, value),
    removeItem: (key: string) => del(key),
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 24 * 60 * 60 * 1000, // 24h for offline persistence
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    // Don't redirect on query errors — useAuth handles auth redirection properly.
    // Redirecting here causes infinite loops when unauthenticated batch queries fail.
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

// Register PWA service worker — auto-update.
// When a new SW takes control (via skipWaiting + clients.claim in sw.ts),
// reload once so the page picks up the freshly deployed assets. Without
// this, users keep running the old bundle until they manually clear cache.
if ('serviceWorker' in navigator) {
  // Only reload on a genuine update (a controller was already active at load),
  // not on the first-ever install where claiming control is expected.
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading || !hadController) return;
    reloading = true;
    window.location.reload();
  });
}

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // A new version is waiting — activate it now; the controllerchange
    // listener above triggers the reload once it takes control.
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[PWA] App ready for offline use');
  },
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            // Never persist auth queries — must always be fetched fresh
            const key = query.queryKey;
            if (Array.isArray(key) && Array.isArray(key[0]) && key[0][0] === "auth") {
              return false;
            }
            return query.state.status === "success";
          },
        },
      }}
    >
      <App />
    </PersistQueryClientProvider>
  </trpc.Provider>
);
