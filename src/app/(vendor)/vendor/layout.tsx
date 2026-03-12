"use client";

import "@/app/globals.css";
import BottomBar from "@/components/layout/BottomBar";
import { VendorSidebar } from "@/components/layout/VendorSidebar";
import Header from "@/components/layout/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MobileSidebarToggle } from "@/components/layout/MobileSidebarToggle";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useSupabaseDoc } from "@/lib/supabase/hooks";
import { supabase } from "@/lib/supabase/client";
import type { Vendor } from "@/lib/types";
import { PendingApprovalPage } from "./PendingApprovalPage";

const isLighthouseAuditMode = process.env.NEXT_PUBLIC_LIGHTHOUSE_AUDIT_MODE === 'true';

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const vendorId = user?.vendorId || user?.uid;
  
  const vendorQuery = useMemo(
    () => vendorId ? () => supabase.from('vendors').select('*').eq('vendor_id', vendorId).single() : () => null,
    [vendorId]
  );
  const { data: vendor, isLoading: isVendorLoading } = useSupabaseDoc<Vendor>(vendorQuery);

  useEffect(() => {
    // Skip auth checks if in Lighthouse audit mode
    if (isLighthouseAuditMode) return;
    
    // This effect now robustly handles role checks after loading is complete.
    if (!authLoading) {
      if (!user) {
         // If no user is found after loading, redirect to landing.
        router.replace("/welcome");
      } else if (user.role && user.role !== "vendor") {
        // If a user with a non-vendor role (e.g., user, admin) ends up here,
        // redirect them to the root to be correctly routed.
        router.replace("/"); 
      }
    }
  }, [user, authLoading, router]);

  const isLoading = authLoading || isVendorLoading;

  // Show loading spinner for normal users, but bypass for Lighthouse
  if (!isLighthouseAuditMode && (isLoading || !user || user.role !== 'vendor')) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If vendor claim is pending, show the dedicated approval page. (Bypass for Lighthouse)
  if (!isLighthouseAuditMode && vendor?.subscriptionStatus === 'claimed_pending_approval') {
    return <PendingApprovalPage />;
  }
  
  // Render the main layout for authenticated vendors or for Lighthouse audits.
  return (
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <VendorSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header>
              <MobileSidebarToggle />
            </Header>
            <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 pb-24">
                {children}
            </main>
          </div>
          <BottomBar />
        </div>
      </SidebarProvider>
  );
}
