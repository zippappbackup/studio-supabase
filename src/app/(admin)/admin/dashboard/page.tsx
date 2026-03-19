"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Users, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useSupabaseCollection } from "@/lib/supabase/hooks";
import { supabase } from "@/lib/supabase/client";
import type { Vendor, Promotion, ScrapeCache, ZippUser } from "@/lib/types";
import { useAppCache } from "@/context/AppCacheProvider";
import { useMemo, useState, useEffect } from "react";

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
    
    // ISO string or timestamp
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) {
        return date;
    }
    return null;
};


export default function AdminDashboard() {
  const { vendorDataset, isVendorDataReady } = useAppCache();

  // --- Live Queries for Real-time Data ---
  const [vendorCount, setVendorCount] = useState<number>(0);
  const [userCount, setUserCount] = useState<number>(0);
  const [isLoadingAllVendors, setIsLoadingAllVendors] = useState(true);
  const [isLoadingAllUsers, setIsLoadingAllUsers] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      const { count: vCount } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true });
      setVendorCount(vCount ?? 0);
      setIsLoadingAllVendors(false);

      const { count: uCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      setUserCount(uCount ?? 0);
      setIsLoadingAllUsers(false);
    };
    fetchCounts();
  }, []);

  const pendingClaimsQuery = useMemo(
    () => () => supabase.from('vendors').select('*').eq('subscription_status', 'claimed_pending_approval'),
    []
  );
  const { data: pendingClaims, isLoading: isLoadingPending } = useSupabaseCollection<Vendor>(pendingClaimsQuery);
  
  const unclaimedVendorsQuery = useMemo(
    () => () => supabase.from('vendors').select('*').eq('subscription_status', 'pending_verification'),
    []
  );
  const { data: unclaimedVendors, isLoading: isLoadingUnclaimed } = useSupabaseCollection<Vendor>(unclaimedVendorsQuery);


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
        <p className="text-foreground/80">A high-level overview of your application's status.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          title="Total Vendors"
          value={vendorCount}
          icon={Users}
          isLoading={isLoadingAllVendors}
          footerText="Live count from database"
        />
        <KPICard 
          title="Total Users"
          value={userCount}
          icon={Users}
          isLoading={isLoadingAllUsers}
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
      </div>
    </div>
  );
}
