"use client";

import "@/app/globals.css";

// This layout no longer needs its own providers, as they are now in the root layout.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <>
        {children}
      </>
  );
}
