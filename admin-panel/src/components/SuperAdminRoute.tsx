import type { ReactNode } from "react";
import { useAuth } from "@/auth/AuthContext";
import { ForbiddenPage } from "@/pages/ForbiddenPage";

export function SuperAdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== "super_admin") {
    return <ForbiddenPage />;
  }
  return <>{children}</>;
}
