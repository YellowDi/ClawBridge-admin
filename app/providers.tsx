"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { Toast } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { AuthProvider } from "@/components/auth-provider";

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
