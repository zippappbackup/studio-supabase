'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useCollection, useFirestore, useMemoFirebase, initializeFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Loader2, RefreshCw } from 'lucide-react';
import type { Vendor } from '@/lib/types';
import Fuse from 'fuse.js';
import { VendorEditDialog } from './VendorEditDialog';
import { VendorActions } from './VendorActions';
import { Button } from '@/components/ui/button';
import { DataImporterClientPage } from './DataImporterClientPage';
import { VendorSummaryDialog } from './VendorSummaryDialog';
import { useToast } from "@/hooks/use-toast";
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth as useFirebaseAuthHook } from '@/lib/auth'; // Renamed to avoid conflict
import { getAuth } from 'firebase/auth';

const VENDORS_PER_PAGE = 15;

function MigrationCard() {
    const { toast } = useToast();
    const { user } = useFirebaseAuthHook();
    const db = useFirestore();

    const [isLoading, setIsLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [batchSize, setBatchSize] = useState(10);
    
    const invalidPhotosQuery = useMemoFirebase(() => db ? query(collection(db, "vendorsWithInvalidPhotos")) : null, [db]);
    const { data: invalidVendors, isLoading: isLoadingInvalidCount } = useCollection(invalidPhotosQuery);
    
    const remainingCount = invalidVendors?.length ?? 0;

    const handleRunMigration = async () => {
        if (!user) {
            toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setLogs(prev => [`Starting migration with batch size: ${batchSize}...`, ...prev]);

        try {
            const { firebaseApp } = initializeFirebase();
            const auth = getAuth(firebaseApp);
            const currentUser = auth.currentUser;

            if (!currentUser) {
                throw new Error("Could not get the current authenticated user session.");
            }
            
            const idToken = await currentUser.getIdToken(true);
            
            const response = await fetch('https://us-central1-studio-7004719050-b856d.cloudfunctions.net/migrateVendorPhotos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ data: { limit: Number(batchSize) }})
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            }

            const result = await response.json();
            const { success, message, logs: resultLogs } = result.data;
            
            if (!success) {
                throw new Error(message || "The function reported a failure.");
            }

            const newLogs = resultLogs || [];
            setLogs(prev => [...newLogs.reverse(), ...prev]);

            toast({
                title: "Migration Batch Complete",
                description: message || `Processed a batch of vendors.`,
                variant: "success",
            });

        } catch (error: any) {
            const errorMessage = error.message || "An unknown error occurred.";
            toast({
                title: "Migration Failed",
                description: errorMessage,
                variant: "destructive"
            });
            setLogs(prev => [`ERROR: ${errorMessage}`, ...prev]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Photo Migration Tool</CardTitle>
                <CardDescription>
                    Manually trigger the server-side process to migrate invalid Google Photo URLs to permanent Firebase Storage URLs.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="p-4 border rounded-lg bg-background flex items-center justify-between">
                     <p className="font-medium text-sm">Vendors Remaining:</p>
                     {isLoadingInvalidCount ? (
                         <Loader2 className="h-5 w-5 animate-spin"/>
                     ) : (
                         <p className="text-2xl font-bold">{remainingCount}</p>
                     )}
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="batch-size">Batch Size</Label>
                        <Input 
                            id="batch-size" 
                            type="number" 
                            value={batchSize} 
                            onChange={(e) => setBatchSize(Number(e.target.value))}
                            placeholder="e.g., 50"
                        />
                         <p className="text-xs text-muted-foreground">Number of vendors to process per run.</p>
                    </div>
                </div>
                 <Button onClick={handleRunMigration} disabled={isLoading || remainingCount === 0} className="w-full">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Start Migration Batch
                </Button>
                {logs.length > 0 && (
                    <ScrollArea className="h-48 w-full rounded-md border p-4 text-xs font-mono bg-muted/50">
                        {logs.map((log, index) => <p key={index} className="whitespace-pre-wrap">{log}</p>)}
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    )
}

export default function DataManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const { firebaseApp } = useMemoFirebase(() => initializeFirebase(), []);
  
  const vendorsQuery = useMemoFirebase(() => db ? query(collection(db, "vendors"), orderBy("name")) : null, [db]);
  const { data: liveVendors, isLoading: isVendorDataLoading } = useCollection<Vendor>(vendorsQuery);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState<string | undefined>(undefined);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [isGeneratingSnapshot, setIsGeneratingSnapshot] = useState(false);

  const fuse = useMemo(() => {
    if (!liveVendors) return null;
    return new Fuse(liveVendors, {
      keys: ['id', 'name', 'address', 'phone', 'email', 'categoryId'],
      threshold: 0.3,
      minMatchCharLength: 2,
    });
  }, [liveVendors]);

  const filteredVendors = useMemo(() => {
    if (!liveVendors) return [];
    if (!searchQuery.trim()) return liveVendors;
    if (!fuse) return liveVendors;
    const searchResults = fuse.search(searchQuery);
    return searchResults.map(result => result.item);
  }, [liveVendors, searchQuery, fuse]);
  
  const totalPages = Math.ceil(filteredVendors.length / VENDORS_PER_PAGE);
  const paginatedVendors = useMemo(() => {
      const startIndex = (currentPage - 1) * VENDORS_PER_PAGE;
      const endIndex = startIndex + VENDORS_PER_PAGE;
      return filteredVendors.slice(startIndex, endIndex);
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

  const handleGenerateSnapshot = async () => {
    setIsGeneratingSnapshot(true);
    
    try {
        const functions = getFunctions(firebaseApp, 'us-central1');
        const generateSnapshotFn = httpsCallable(functions, 'manuallyGenerateVendorSnapshot');
        
        const result: any = await generateSnapshotFn({});

        if (result.data.success) {
            toast({
                title: "Snapshot Generated Successfully",
                description: result.data.message || `Created snapshot with ${result.data.details?.count} vendors.`,
                variant: "success",
            });
        } else {
            throw new Error(result.data.message || "The function reported a failure.");
        }

    } catch (error: any) {
        const errorMessage = error.details ? `Code: ${error.details.code}, Message: ${error.details.message}` : error.message;
        toast({
            title: "Snapshot Generation Failed",
            description: error.message || "An unknown error occurred.",
            variant: "destructive"
        });
    } finally {
        setIsGeneratingSnapshot(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Management</h1>
          <p className="text-muted-foreground">Search, view, edit, and import vendor profiles from the live database.</p>
        </div>
        
        <DataImporterClientPage />
        
        <MigrationCard />

        <Card>
            <CardHeader>
                <CardTitle>System Actions</CardTitle>
                <CardDescription>Perform high-level system operations like data import, export, and cache management.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 p-4 border rounded-lg bg-background">
                    <Label className="font-semibold">Generate Vendor Snapshot</Label>
                    <p className="text-sm text-muted-foreground">
                        Manually trigger a server-side process to generate a new, optimized vendor dataset. This is used by the app for searching and browsing.
                    </p>
                    <Button onClick={handleGenerateSnapshot} disabled={isGeneratingSnapshot} className="w-full sm:w-auto">
                        {isGeneratingSnapshot ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Generate Snapshot Now
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Vendors</CardTitle>
            <CardDescription>
              A real-time list of all vendors currently in the system. Found {filteredVendors.length} vendors.
            </CardDescription>
            <div className="relative pt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, address, phone, email, or ID..."
                value={searchQuery}
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right w-[50px]"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isVendorDataLoading && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex justify-center items-center gap-2">
                           <Loader2 className="h-5 w-5 animate-spin" />
                           Loading live vendor data...
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isVendorDataLoading && paginatedVendors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No vendors found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                  {!isVendorDataLoading && paginatedVendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-mono text-xs max-w-[150px] truncate">{vendor.id}</TableCell>
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell className="capitalize">{vendor.categoryId}</TableCell>
                      <TableCell className="text-right">
                        <VendorActions 
                          vendor={vendor} 
                          onEdit={() => handleEdit(vendor)}
                          onViewSummary={() => handleViewSummary(vendor)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
             <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
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
          </CardContent>
        </Card>
      </div>
      
      <VendorSummaryDialog
        isOpen={isSummaryDialogOpen}
        setIsOpen={setIsSummaryDialogOpen}
        vendorId={selectedVendorId}
      />

      <VendorEditDialog
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        vendorId={selectedVendorId}
      />
    </>
  );
}
