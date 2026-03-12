"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useSupabaseCollection } from "@/lib/supabase/hooks";
import { supabase } from "@/lib/supabase/client";
import type { Vendor } from "@/lib/types";
import { format } from "date-fns";
import { VendorActions } from "./VendorActions";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function VendorApprovalsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const pendingClaimsQuery = useMemo(
    () => () => supabase
      .from('vendors')
      .select('*')
      .eq('subscription_status', 'claimed_pending_approval'),
    []
  );
  const { data: vendors, isLoading } = useSupabaseCollection<Vendor>(pendingClaimsQuery);

  const filteredVendors = useMemo(() => {
    if (!vendors) return [];
    if (!searchQuery) return vendors;
    return vendors.filter(vendor => 
      vendor.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [vendors, searchQuery]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vendor Claim Approvals</h1>
        <p className="text-muted-foreground">Review and approve new claims on business profiles.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Claims</CardTitle>
          <CardDescription>A list of businesses claimed by users that are awaiting your approval.</CardDescription>
          <div className="relative pt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by vendor name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Claimed On</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      Loading pending claims...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filteredVendors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      {searchQuery ? `No claims found for "${searchQuery}".` : "There are no new business claims awaiting approval."}
                    </TableCell>
                  </TableRow>
                )}
                {filteredVendors?.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell>{vendor.email}</TableCell>
                    <TableCell>{vendor.region}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={vendor.subscriptionStatus === 'claimed_pending_approval' ? "default" : "destructive"} 
                        className={cn("capitalize", vendor.subscriptionStatus === 'claimed_pending_approval' && "bg-amber-500/80 text-white")}
                      >
                        {vendor.subscriptionStatus.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {vendor.updatedAt &&
                        format(
                          new Date(vendor.updatedAt),
                          "dd MMM yyyy"
                        )}
                    </TableCell>
                    <TableCell>
                      <VendorActions vendor={vendor} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
