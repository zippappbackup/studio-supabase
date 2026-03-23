'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSupabaseCollection } from '@/lib/supabase/hooks';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Loader2 } from 'lucide-react';
import type { Vendor } from '@/lib/types';
import Fuse from 'fuse.js';
import { VendorEditDialog } from './VendorEditDialog';
import { VendorActions } from './VendorActions';
import { Button } from '@/components/ui/button';
import { DataImporterClientPage } from './DataImporterClientPage';
import { PhotoMigrationCard } from './PhotoMigrationCard';
import { VendorSummaryDialog } from './VendorSummaryDialog';

const VENDORS_PER_PAGE = 15;

export default function DataManagementPage() {
  const vendorsQuery = useMemo(
    () => () => supabase.from('vendors').select('*').order('name'),
    []
  );
  const { data: liveVendorsData, isLoading: isVendorDataLoading } = useSupabaseCollection<Vendor>(vendorsQuery);
  const [vendorCount, setVendorCount] = useState<number>(0);

  useEffect(() => {
    supabase.from('vendors').select('*', { count: 'exact', head: true }).then(({ count }) => {
      setVendorCount(count || 0);
    });
  }, []);

  // Transform vendor data to match expected format (vendor_id -> id)
  const liveVendors = useMemo(() => {
    return liveVendorsData?.map(v => ({ ...v, id: v.vendor_id || v.id })) || [];
  }, [liveVendorsData]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState<string | undefined>(undefined);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fuse = useMemo(() => {
    if (!liveVendors) return null;
    return new Fuse(liveVendors, {
      keys: ['id', 'name', 'address', 'phone', 'email', 'category_id'],
      threshold: 0.3,
    });
  }, [liveVendors]);

  const filteredVendors = useMemo(() => {
    if (!searchQuery) return liveVendors;
    if (!fuse) return [];
    return fuse.search(searchQuery).map((result) => result.item);
  }, [searchQuery, liveVendors, fuse]);

  const totalPages = Math.max(1, Math.ceil(filteredVendors.length / VENDORS_PER_PAGE));
  const paginatedVendors = useMemo(() => {
    const startIndex = (currentPage - 1) * VENDORS_PER_PAGE;
    return filteredVendors.slice(startIndex, startIndex + VENDORS_PER_PAGE);
  }, [filteredVendors, currentPage]);

  useEffect(() => {
      if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(1);
      }
  }, [currentPage, totalPages]);

  const handleEdit = (vendor: Vendor) => {
    setSelectedVendorId(vendor.id);
    setIsEditDialogOpen(true);
  };
  
  const handleViewSummary = (vendor: Vendor) => {
    setSelectedVendorId(vendor.id);
    setIsSummaryDialogOpen(true);
  };

  const handlePageChange = (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
          setCurrentPage(newPage);
      }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Management</h1>
          <p className="text-muted-foreground">
            Manage vendor data, import new vendors, export database backups, and migrate photos.
          </p>
        </div>
      </div>

      {/* Data Importer Section */}
      <DataImporterClientPage />

      {/* Photo Migration Tool */}
      <PhotoMigrationCard />

      {/* Live Vendor Browser */}
      <Card>
        <CardHeader>
          <CardTitle>Live Vendor Database</CardTitle>
          <CardDescription>
            Browse all vendors currently in the database ({vendorCount} total, showing {liveVendors.length}). Use search to filter by name, address, phone, or email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isVendorDataLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedVendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      {searchQuery ? 'No vendors found matching your search.' : 'No vendors in database.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedVendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{vendor.address || 'N/A'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{vendor.phone || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <VendorActions vendor={vendor} onEdit={handleEdit} onViewSummary={handleViewSummary} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {selectedVendorId && (
        <>
          <VendorEditDialog
            vendorId={selectedVendorId}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
          />
          <VendorSummaryDialog
            vendorId={selectedVendorId}
            open={isSummaryDialogOpen}
            onOpenChange={setIsSummaryDialogOpen}
          />
        </>
      )}
    </div>
  );
}
