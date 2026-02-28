
"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Download } from "lucide-react";
import { useFirestore } from "@/firebase";
import { collection, query, getDocs, orderBy, limit, startAfter, DocumentSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from "firebase/functions";
import { useAuth } from "@/lib/auth";

export function DataImporterClientPage() {
    const { toast } = useToast();
    const db = useFirestore();

    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== "application/json") {
                toast({ title: "Invalid File Type", description: "Please upload a valid JSON file.", variant: "destructive" });
                return;
            }
            setFile(selectedFile);
        }
    }, [toast]);

    const handleUpload = async () => {
        if (!file) {
            toast({ title: "No File Selected", description: "Please select a JSON file to upload.", variant: "destructive" });
            return;
        }

        setIsUploading(true);
        toast({ title: "Upload Started", description: "Processing vendor file on the server. This may take a moment...", variant: "info" });

        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = async (e) => {
            try {
                const content = e.target?.result;
                if (typeof content !== 'string') {
                    throw new Error("Could not read file content.");
                }
                
                const functions = getFunctions();
                const processVendorImport = httpsCallable(functions, 'processVendorImport');
                
                const result: any = await processVendorImport({ fileContent: content });
                const { success, createdCount, skippedCount, error } = result.data;
                
                if (success) {
                    toast({
                        title: "Import Complete",
                        description: `Successfully created ${createdCount} new vendors. Skipped ${skippedCount} potential duplicates.`,
                        variant: "success",
                    });
                } else {
                    throw new Error(error || "An unknown server error occurred during import.");
                }
            } catch (err: any) {
                toast({
                    title: "Import Failed",
                    description: err.message,
                    variant: "destructive",
                });
            } finally {
                setIsUploading(false);
                setFile(null);
                const fileInput = document.getElementById("vendor-file-upload") as HTMLInputElement;
                if(fileInput) fileInput.value = "";
            }
        };
        reader.onerror = () => {
            toast({ title: "File Read Error", description: "Could not read the selected file.", variant: "destructive" });
            setIsUploading(false);
        };
    };
    
    const handleLiveExport = async () => {
        if (!db) {
            toast({ title: "Database Error", description: "Firestore connection not available.", variant: "destructive" });
            return;
        }
    
        setIsExporting(true);
        toast({ title: "Exporting Live Data", description: "Fetching all vendors from the database. This may take a moment...", variant: "info" });
    
        const allVendors: any[] = [];
        const BATCH_SIZE = 300;
        let lastVisible: DocumentSnapshot | null = null;
        let hasMore = true;
    
        try {
            while (hasMore) {
                const vendorsCollectionRef = collection(db, "vendors");
                let q;
                
                if (lastVisible) {
                    q = query(vendorsCollectionRef, orderBy('__name__'), startAfter(lastVisible), limit(BATCH_SIZE));
                } else {
                    q = query(vendorsCollectionRef, orderBy('__name__'), limit(BATCH_SIZE));
                }
                
                const querySnapshot = await getDocs(q);
    
                if (querySnapshot.empty) {
                    hasMore = false;
                } else {
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        allVendors.push({ id: doc.id, ...data });
                    });
                    lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
                    hasMore = querySnapshot.docs.length === BATCH_SIZE;
                }
            }
    
            if (allVendors.length === 0) {
                toast({ title: "Export Complete", description: "No vendors found in the database." });
                setIsExporting(false);
                return;
            }
    
            const jsonString = JSON.stringify(allVendors, (key, value) => {
                if (value && typeof value === 'object' && value.seconds !== undefined && value.nanoseconds !== undefined) {
                    return new Date(value.seconds * 1000).toISOString();
                }
                return value;
            }, 2);

            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const date = new Date().toISOString().split('T')[0];
            link.download = `vendors-live-export-${date}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toast({ title: "Export Successful", description: `Exported ${allVendors.length} vendors.`, variant: "success" });
    
        } catch (err: any) {
            toast({ title: "Export Failed", description: err.message, variant: "destructive" });
        } finally {
            setIsExporting(false);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Import & Export Vendor Data</CardTitle>
                <CardDescription>Upload a JSON file to add new vendors or export the entire live database.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-3 p-4 border rounded-lg bg-background">
                    <Label className="font-semibold">Export Live Database</Label>
                    <p className="text-sm text-muted-foreground">Download a complete JSON backup of all vendors currently in the live Firestore database.</p>
                    <Button onClick={handleLiveExport} disabled={isExporting} className="w-full sm:w-auto">
                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Export All Live Vendor Data
                    </Button>
                </div>
                <div className="space-y-4 p-4 border rounded-lg bg-background">
                    <Label htmlFor="vendor-file-upload" className="font-semibold">Import New Vendors from File</Label>
                    <p className="text-sm text-muted-foreground">
                        Upload a JSON array of vendor objects. The system performs deduplication and writes in batches.
                    </p>
                    <div className="flex items-center gap-4">
                        <Input id="vendor-file-upload" type="file" accept="application/json" onChange={handleFileChange} disabled={isUploading} />
                        <Button onClick={handleUpload} disabled={!file || isUploading}>
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Upload & Process
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
