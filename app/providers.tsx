"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { Toast, toastQueue } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { AuthProvider } from "@/components/auth-provider";

type ToastQueueWithWrapUpdate = {
  wrapUpdate: (fn: () => void) => void;
};

// ponytail: Toast view transitions can throw invalid-state DOMExceptions; plain updates are enough here.
(toastQueue.getQueue() as unknown as ToastQueueWithWrapUpdate).wrapUpdate = (
  fn,
) => fn();

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  return (
    <NextThemesProvider {...themeProps}>
      <AuthProvider>{children}</AuthProvider>
      <Toast.Provider placement="top end" />
    </NextThemesProvider>
  );
}
