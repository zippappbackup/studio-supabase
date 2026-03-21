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

  // vendor_id comes back from DB as snake_case so also check vendor_id directly
  const vendorId = (user as any)?.vendor_id || user?.vendorId || user?.uid;
  
  const vendorQuery = useMemo(
    () => vendorId ? () => supabase.from('vendors').select('subscription_status, claimed_by').eq('vendor_id', vendorId).single() : () => null,
    [vendorId]
  );
  const { data: vendor, isLoading: isVendorLoading } = useSupabaseDoc<Vendor>(vendorQuery);

  useEffect(() => {
    if (isLighthouseAuditMode) return;
    if (!authLoading) {
      if (!user) {
        router.replace("/welcome");
      } else if (user.role && user.role !== "vendor") {
        router.replace("/");
      }
    }
  }, [user, authLoading, router]);

  // Still loading auth or vendor data — show spinner
  if (!isLighthouseAuditMode && (authLoading || isVendorLoading)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in or wrong role — let the useEffect redirect handle it,
  // show spinner in the meantime
  if (!isLighthouseAuditMode && (!user || user.role !== 'vendor')) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Vendor is pending approval — block access and show pending page
  if (!isLighthouseAuditMode && ((vendor as any)?.subscription_status ?? vendor?.subscriptionStatus) === 'claimed_pending_approval') {
    return <PendingApprovalPage />;
  }

  // Render the main vendor layout
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
