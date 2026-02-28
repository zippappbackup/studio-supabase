
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Ticket } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Vendor, Promotion } from "@/lib/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";


function KPICard({ title, value, isLoading, description }: { title: string, value: string | number, isLoading: boolean, description?: string }) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold">{value}</div>
            <Separator style={{ backgroundColor: '#d6eafa' }} orientation="vertical" className="h-8" />
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PromotionsBreakdownCard({ promotions, isLoading }: { promotions: Promotion[], isLoading: boolean }) {
    if (isLoading) {
        return (
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Promotions Performance</CardTitle>
                    <CardDescription>A breakdown of your campaign performance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        )
    }

    if (!promotions || promotions.length === 0) {
        return (
             <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Promotions Performance</CardTitle>
                    <CardDescription>A breakdown of your campaign performance.</CardDescription>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground py-12">
                    <Ticket className="mx-auto h-12 w-12" />
                    <p className="mt-4">You haven't created any promotions yet.</p>
                    <Button asChild variant="link">
                        <Link href="/vendor/promotions">Create One Now</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    const calculateStats = (promo: Promotion) => {
        const redemptions = promo.redemptions || [];
        // The total number of collections is the total number of redemption events created.
        const collectedCount = redemptions.length;
        // The number of redemptions is the count of events with 'redeemed' status.
        const redeemedCount = redemptions.filter(r => r.status === 'redeemed').length;
        
        return { collected: collectedCount, redeemed: redeemedCount };
    };

    return (
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Promotions Performance</CardTitle>
                <CardDescription>A breakdown of your campaign performance.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Promotion</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center">Collected</TableHead>
                            <TableHead className="text-center">Redeemed</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {promotions.map((promo) => {
                             const stats = calculateStats(promo);
                             const endDate = (promo.endAt as any)?.toDate ? (promo.endAt as any).toDate() : new Date();
                             const isActive = endDate > new Date();

                             return (
                                <TableRow key={promo.id}>
                                    <TableCell className="font-medium">{promo.title}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={isActive ? "default" : "outline"} className={isActive ? "bg-green-600/20 text-green-700 border-green-600/30" : ""}>
                                            {isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center font-bold">{stats.collected}</TableCell>
                                    <TableCell className="text-center font-bold">{stats.redeemed}</TableCell>
                                </TableRow>
                             )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function VendorDashboard() {
  const { user } = useAuth();
  const db = useFirestore();
  
  const vendorId = user?.vendorId || user?.uid;

  const vendorRef = useMemoFirebase(() => vendorId && db ? doc(db, "vendors", vendorId) : null, [vendorId, db]);
  const { data: vendor, isLoading: isVendorLoading } = useDoc<Vendor>(vendorRef);
  
  const welcomeMessage = isVendorLoading 
    ? "Loading Dashboard..." 
    : vendor 
    ? `Welcome, ${vendor.name}` 
    : "Vendor Dashboard";

    const subscriptionValue = useMemo(() => {
        const status = vendor?.subscriptionStatus;
        if (!status) return '...';
        const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
        return capitalizedStatus.replace(/_/g, ' ');
    }, [vendor]);
    
    const subscriptionDescription = useMemo(() => {
        if (vendor?.subscriptionStatus === 'trial' && vendor.trialStartedAt) {
            const trialStartDate = (vendor.trialStartedAt as any).toDate ? (vendor.trialStartedAt as any).toDate() : new Date(vendor.trialStartedAt as any);
            const trialEndDate = new Date(trialStartDate);
            trialEndDate.setDate(trialEndDate.getDate() + 14); // Assuming a 14-day trial
            
            const daysLeft = Math.max(0, Math.ceil((trialEndDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
            
            if (daysLeft > 0) {
                return `${daysLeft} day${daysLeft === 1 ? '' : 's'} of trial left`;
            } else {
                return "Trial has ended";
            }
        }
        return "Your current plan";
    }, [vendor]);


    const kpis = [
      { title: "Subscription", value: subscriptionValue, isLoading: isVendorLoading, description: subscriptionDescription },
      { title: "Zipp Rating", value: `${(vendor?.zippRating || 0).toFixed(1)}/5`, isLoading: isVendorLoading, description: `From ${vendor?.zippReviewCount || 0} reviews` },
      { title: "Offerings", value: vendor?.offerings?.length || 0, isLoading: isVendorLoading, description: "Active products & services" },
      { title: "Profile Views", value: vendor?.profileViews ?? 0, isLoading: isVendorLoading, description: "Total times your profile has been viewed" },
    ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{welcomeMessage}</h1>
        <p className="text-muted-foreground">Here's a quick overview of your business activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} title={kpi.title} value={kpi.value} isLoading={kpi.isLoading} description={kpi.description} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <PromotionsBreakdownCard promotions={vendor?.promotions || []} isLoading={isVendorLoading} />
         <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-1 gap-3">
              <Button asChild><Link href="/vendor/profile">Edit Business Profile</Link></Button>
              <Button asChild><Link href="/vendor/offerings">Manage Your Offerings</Link></Button>
              <Button asChild><Link href="/vendor/promotions">Create a Promotion</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
