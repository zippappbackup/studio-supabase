
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Users, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { Vendor, Promotion, ScrapeCache } from "@/lib/types";
import { useAppCache } from "@/context/AppCacheProvider";
import { useMemo } from "react";

function KPICard({ title, value, icon: Icon, isLoading, footerText }: { title: string, value: string | number, icon: React.ElementType, isLoading: boolean, footerText?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {footerText && <p className="text-xs text-muted-foreground">{footerText}</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
}

const getSafeDate = (dateInput: any): Date | null => {
    if (!dateInput) return null;
    // Firestore Timestamp object
    if (typeof dateInput.toDate === 'function') {
        return dateInput.toDate();
    }
    // Plain object from Cloud Function serialization
    if (typeof dateInput === 'object' && dateInput !== null && typeof (dateInput as any)._seconds === 'number') {
        return new Date((dateInput as any)._seconds * 1000);
    }
    // String or number that can be parsed
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) {
        return date;
    }
    return null;
};


export default function AdminDashboard() {
  const db = useFirestore();
  const { vendorDataset, isVendorDataReady } = useAppCache();

  // --- Live Queries for Real-time Data ---
  const allVendorsQuery = useMemoFirebase(() => db ? query(collection(db, "vendors")) : null, [db]);
  const { data: allVendors, isLoading: isLoadingAllVendors } = useCollection<Vendor>(allVendorsQuery);

  const pendingClaimsQuery = useMemoFirebase(
    () => db ? query(collection(db, "vendors"), where("subscriptionStatus", "==", "claimed_pending_approval")) : null,
    [db]
  );
  const { data: pendingClaims, isLoading: isLoadingPending } = useCollection<Vendor>(pendingClaimsQuery);
  
  const unclaimedVendorsQuery = useMemoFirebase(
    () => db ? query(collection(db, "vendors"), where("subscriptionStatus", "==", "pending_verification")) : null,
    [db]
  );
  const { data: unclaimedVendors, isLoading: isLoadingUnclaimed } = useCollection<Vendor>(unclaimedVendorsQuery);


  // --- Derived Data from Snapshot for Efficiency ---
  const activePromotionsCount = useMemo(() => {
    if (!vendorDataset) return 0;
    const now = new Date();
    return vendorDataset.reduce((count, vendor) => {
      const activePromos = vendor.promotions?.filter(p => {
        const endDate = getSafeDate(p.endAt);
        return endDate ? endDate > now : false;
      }).length || 0;
      return count + activePromos;
    }, 0);
  }, [vendorDataset]);


  const kpis = [
    { title: "Pending Claims", value: pendingClaims?.length ?? 0, icon: AlertTriangle, isLoading: isLoadingPending },
    { title: "Active Promotions", value: activePromotionsCount, icon: BarChart, isLoading: !isVendorDataReady },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">A high-level overview of your application's status.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          title="Total Vendors"
          value={allVendors?.length ?? 0}
          icon={Users}
          isLoading={isLoadingAllVendors}
          footerText="Live count from database"
        />
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} title={kpi.title} value={kpi.value} icon={kpi.icon} isLoading={kpi.isLoading} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Unclaimed Businesses</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingUnclaimed ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <p className="text-sm text-muted-foreground">
                There are currently {unclaimedVendors?.length ?? 0} businesses that are not yet claimed by an owner.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Alerts for failed scrapes or other critical system-level errors will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
