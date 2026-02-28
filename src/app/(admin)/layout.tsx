
"use client";

import "@/app/globals.css";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import BottomBar from "@/components/layout/BottomBar";
import Header from "@/components/layout/Header";
import { MobileSidebarToggle } from "@/components/layout/MobileSidebarToggle";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const isLighthouseAuditMode = process.env.NEXT_PUBLIC_LIGHTHOUSE_AUDIT_MODE === 'true';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Skip auth checks if in Lighthouse audit mode
    if (isLighthouseAuditMode) return;

    // This effect now robustly handles role checks after loading is complete.
    if (!loading) {
      if (!user) {
        // If no user is found after loading, redirect to landing.
        router.replace("/welcome");
      } else if (user.role && user.role !== "admin") {
        // If a user with a non-admin role ends up here,
        // redirect them to the root to be correctly routed.
        router.replace("/");
      }
    }
  }, [user, loading, router]);

  // Show loading spinner for normal users, but bypass for Lighthouse
  if (!isLighthouseAuditMode && (loading || !user || user.role !== "admin")) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only render children if the user is authenticated and has the correct role, or if in audit mode.
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header>
            <MobileSidebarToggle />
          </Header>
          <main className="flex-1 overflow-auto">
            <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 pb-24">
              {children}
            </div>
          </main>
        </div>
        {/* BottomBar is hidden for admin via its own internal logic */}
        <BottomBar />
      </div>
    </SidebarProvider>
  );
}
