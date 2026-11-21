"use client";

import React, { ReactNode } from "react";
import ReduxProvider from "./ReduxProvider";
import ToastProvider from "./ToastProvider";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ReduxProvider>
      {children}
      <ToastProvider />
    </ReduxProvider>
  );
}
