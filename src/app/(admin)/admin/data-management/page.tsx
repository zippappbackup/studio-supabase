'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Loader2, Download } from 'lucide-react';
import type { Vendor } from '@/lib/types';
import Fuse from 'fuse.js';
import { VendorEditDialog } from './VendorEditDialog';
import { VendorActions } from './VendorActions';
import { Button } from '@/components/ui/button';
import { DataImporterClientPage } from './DataImporterClientPage';
import { PhotoMigrationCard } from './PhotoMigrationCard';
import { BackupTool } from "./BackupTool";
import { UserDataCard } from './UserDataCard';
import { VendorSummaryDialog } from './VendorSummaryDialog';
import * as XLSX from 'xlsx';

const VENDORS_PER_PAGE = 15;
const BATCH_SIZE = 1000;

function stripCountryCode(phone?: string): string {
  if (!phone) return 'N/A';
  // Remove common country codes: +65, +1, +44, etc.
  return phone.replace(/^\+\d{1,3}\s?/, '').trim() || phone;
}

async function fetchAllVendors(): Promise<any[]> {
  let allVendors: any[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('name')
      .range(from, from + BATCH_SIZE - 1);

    if (error) throw error;

    if (data && data.length > 0) {
      allVendors = [...allVendors, ...data];
      from += BATCH_SIZE;
      hasMore = data.length === BATCH_SIZE;
    } else {
      hasMore = false;
    }
  }

  return allVendors;
}

export default function DataManagementPage() {
  const [liveVendors, setLiveVendors] = useState<any[]>([]);
  const [isVendorDataLoading, setIsVendorDataLoading] = useState(true);
  const [vendorCount, setVendorCount] = useState<number>(0);

  useEffect(() => {
    async function loadVendors() {
      setIsVendorDataLoading(true);
      try {
        const vendors = await fetchAllVendors();
        setLiveVendors(vendors);
        setVendorCount(vendors.length);
      } catch (err) {
        console.error('Failed to load vendors:', err);
      } finally {
        setIsVendorDataLoading(false);
      }
    }
    loadVendors();
  }, []);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState<string | undefined>(undefined);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Use snake_case keys to match raw Supabase data
  const fuse = useMemo(() => {
    if (!liveVendors.length) return null;
    return new Fuse(liveVendors, {
      keys: [
        { name: 'name', weight: 0.5 },
        { name: 'tags', weight: 0.2 },
        { name: 'matched_keywords', weight: 0.2 },
        { name: 'category_id', weight: 0.1 },
      ],
      threshold: 0.3,
      includeScore: true,
      minMatchCharLength: 2,
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleEdit = (vendor: any) => {
    setSelectedVendorId(vendor.vendor_id || vendor.id);
    setIsEditDialogOpen(true);
  };

  const handleViewSummary = (vendor: any) => {
    setSelectedVendorId(vendor.vendor_id || vendor.id);
    setIsSummaryDialogOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleExport = () => {
    const exportData = liveVendors.map(v => ({
      Name: v.name || '',
      Address: v.address || '',
      Phone: stripCountryCode(v.phone),
      Email: v.email || '',
      Category: v.category_id || '',
      Region: v.region || '',
      Website: v.website || '',
      'Google Rating': v.google_rating || '',
      'Google Reviews': v.google_review_count || '',
      'Zipp Rating': v.zipp_rating || '',
      'Zipp Reviews': v.zipp_review_count || '',
      'Subscription Status': v.subscription_status || '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendors');
    XLSX.writeFile(workbook, 'vendor_database.xlsx');
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Management</h1>
          <p className="text-muted-foreground">Manage vendor data and photo backups.</p>
        </div>
      </div>

      <DataImporterClientPage />

      <div className="grid gap-4">
        <h2 className="text-xl font-semibold">Photo Backup & Migration</h2>
        <PhotoMigrationCard />
        <BackupTool />
        <UserDataCard />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Live Vendor Database</CardTitle>
              <CardDescription>Browse all vendors in Supabase ({vendorCount} total).</CardDescription>
            </div>
            <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export to Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="relative mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                className="pl-8"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          {searchQuery && (
            <p className="text-sm text-muted-foreground mb-3">
              {filteredVendors.length} {filteredVendors.length === 1 ? 'vendor' : 'vendors'} found for &quot;{searchQuery}&quot;
            </p>
          )}

          {isVendorDataLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%]">Name</TableHead>
                    <TableHead className="w-[20%]">Phone</TableHead>
                    <TableHead className="w-[45%]">Address</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedVendors.map((vendor) => (
                    <TableRow key={vendor.vendor_id || vendor.id}>
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell className="text-sm">{stripCountryCode(vendor.phone)}</TableCell>
                      <TableCell className="text-sm">{vendor.address || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <VendorActions vendor={{ ...vendor, id: vendor.vendor_id || vendor.id }} onEdit={handleEdit} onViewSummary={handleViewSummary} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} ({filteredVendors.length} vendors)
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
            </>
          )}
        </CardContent>
      </Card>

      {selectedVendorId && (
        <>
          <VendorEditDialog vendorId={selectedVendorId} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
          <VendorSummaryDialog vendorId={selectedVendorId} open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen} />
        </>
      )}
    </div>
  );
}
