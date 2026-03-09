import { useAuth } from "@/_core/hooks/useAuth";
import type { ComponentType } from "react";

export function ProtectedRoute({ component: Component }: { component: ComponentType }) {
  const { loading, isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <Component />;
}
