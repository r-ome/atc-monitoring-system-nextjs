"use client";

import { Toaster } from "@/app/components/ui/sonner";
import { AppThemeProvider } from "@/app/components/theme-provider";
import { SessionProvider } from "next-auth/react";

export function Session({ children }: { children: React.ReactNode }) {
  return (
    <AppThemeProvider>
      <Toaster richColors position="top-center" />
      <SessionProvider>{children}</SessionProvider>;
    </AppThemeProvider>
  );
}
