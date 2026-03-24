"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Download } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";

export function DataImporterClientPage() {
    const { toast } = useToast();
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
        toast({ title: "Upload Started", description: "Processing vendor file. This may take a moment...", variant: "info" });

        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = async (e) => {
            try {
                const content = e.target?.result;
                if (typeof content !== 'string') {
                    throw new Error("Could not read file content.");
                }
                
                // Parse the JSON content
                const vendors = JSON.parse(content);
                
                if (!Array.isArray(vendors)) {
                    throw new Error("Invalid JSON format. Expected an array of vendors.");
                }

                // Insert vendors in batches
                const BATCH_SIZE = 50;
                let createdCount = 0;
                let skippedCount = 0;

                for (let i = 0; i < vendors.length; i += BATCH_SIZE) {
                    const batch = vendors.slice(i, i + BATCH_SIZE);
                    
                    // Transform vendor data to match database schema
                    const transformedBatch = batch.map((vendor: any) => ({
                        vendor_id: vendor.id || vendor.vendor_id,
                        name: vendor.name,
                        normalized_name: vendor.normalizedName || vendor.normalized_name,
                        searchable_name: vendor.searchableName || vendor.searchable_name,
                        category_id: vendor.categoryId || vendor.category_id,
                        logo_url: vendor.logoUrl || vendor.logo_url,
                        description: vendor.description,
                        region: vendor.region,
                        lat: vendor.lat,
                        lng: vendor.lng,
                        address: vendor.address,
                        phone: vendor.phone,
                        email: vendor.email,
                        website: vendor.website,
                        operating_hours: vendor.operatingHours || vendor.operating_hours,
                        google_rating: vendor.googleRating || vendor.google_rating,
                        google_review_count: vendor.googleReviewCount || vendor.google_review_count,
                        zipp_rating: vendor.zippRating || vendor.zipp_rating,
                        zipp_review_count: vendor.zippReviewCount || vendor.zipp_review_count,
                        tags: vendor.tags,
                        offerings: vendor.offerings,
                        photos: vendor.photos,
                        created_at: vendor.createdAt || vendor.created_at || new Date().toISOString(),
                        updated_at: vendor.updatedAt || vendor.updated_at || new Date().toISOString(),
                    }));

                    // Insert batch with upsert to handle duplicates
                    const { data, error } = await supabase
                        .from('vendors')
                        .upsert(transformedBatch, { 
                            onConflict: 'vendor_id',
                            ignoreDuplicates: false 
                        });

                    if (error) {
                        // Check if error is due to duplicates
                        if (error.code === '23505') { // Unique violation
                            skippedCount += batch.length;
                        } else {
                            throw error;
                        }
                    } else {
                        createdCount += batch.length;
                    }
                }
                
                // NOW IMPORT REVIEWS from the vendor data
                let reviewCount = 0;
                const allReviews = [];
                
                for (const vendor of vendors) {
                    const vendorId = vendor.id || vendor.vendor_id;
                    const reviews = vendor.reviews || [];
                    
                    for (const review of reviews) {
                        // Generate a unique review_id from vendor + author + time
                        const reviewId = `google-${vendorId}-${review.author_name?.replace(/\s/g, '-')}-${review.time}`;
                        
                        allReviews.push({
                            review_id: reviewId,
                            vendor_id: vendorId,
                            user_id: null, // Google reviews don't have user_id
                            user_name: null, // Google reviews don't have user_name
                            user_avatar: review.profile_photo_url || null,
                            rating: review.rating,
                            text: review.text,
                            author_name: review.author_name,
                            time: review.time,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        });
                    }
                }
                
                // Insert reviews in batches
                if (allReviews.length > 0) {
                    for (let i = 0; i < allReviews.length; i += BATCH_SIZE) {
                        const reviewBatch = allReviews.slice(i, i + BATCH_SIZE);
                        
                        const { error: reviewError } = await supabase
                            .from('reviews')
                            .upsert(reviewBatch, { 
                                onConflict: 'review_id',
                                ignoreDuplicates: true 
                            });
                        
                        if (reviewError && reviewError.code !== '23505') {
                            console.error('Review import error:', reviewError);
                        } else {
                            reviewCount += reviewBatch.length;
                        }
                    }
                }
                
                toast({
                    title: "Import Complete",
                    description: `Successfully processed ${createdCount} vendors and ${reviewCount} reviews. Skipped ${skippedCount} potential duplicates.`,
                    variant: "success",
                });
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
        setIsExporting(true);
        toast({ title: "Exporting Live Data", description: "Fetching all vendors from the database. This may take a moment...", variant: "info" });
    
        try {
            // Fetch all vendors in batches to bypass 1000 row limit
            let allVendors: any[] = [];
            let from = 0;
            const BATCH = 500;
            while (true) {
                const { data: batch, error } = await supabase
                    .from('vendors')
                    .select('*')
                    .order('name')
                    .range(from, from + BATCH - 1);
                if (error) throw error;
                if (!batch || batch.length === 0) break;
                allVendors = [...allVendors, ...batch];
                if (batch.length < BATCH) break;
                from += BATCH;
            }
            const vendors = allVendors;
    
            if (!vendors || vendors.length === 0) {
                toast({ title: "Export Complete", description: "No vendors found in the database." });
                setIsExporting(false);
                return;
            }
    
            // Transform back to original format with camelCase
            const transformedVendors = vendors.map(v => ({
                id: v.vendor_id,
                name: v.name,
                normalizedName: v.normalized_name,
                searchableName: v.searchable_name,
                categoryId: v.category_id,
                logoUrl: v.logo_url,
                description: v.description,
                region: v.region,
                lat: v.lat,
                lng: v.lng,
                address: v.address,
                phone: v.phone,
                email: v.email,
                website: v.website,
                operatingHours: v.operating_hours,
                googleRating: v.google_rating,
                googleReviewCount: v.google_review_count,
                zippRating: v.zipp_rating,
                zippReviewCount: v.zipp_review_count,
                tags: v.tags,
                offerings: v.offerings,
                photos: v.photos,
                createdAt: v.created_at,
                updatedAt: v.updated_at,
            }));

            const jsonString = JSON.stringify(transformedVendors, null, 2);

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
            
            toast({ title: "Export Successful", description: `Exported ${vendors.length} vendors.`, variant: "success" });
    
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
                    <p className="text-sm text-muted-foreground">Download a complete JSON backup of all vendors currently in the Supabase database.</p>
                    <Button onClick={handleLiveExport} disabled={isExporting} className="w-full sm:w-auto">
                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Export All Live Vendor Data
                    </Button>
                </div>
                <div className="space-y-4 p-4 border rounded-lg bg-background">
                    <Label htmlFor="vendor-file-upload" className="font-semibold">Import New Vendors from File</Label>
                    <p className="text-sm text-muted-foreground">
                        Upload a JSON array of vendor objects. The system performs deduplication and writes in batches. Reviews will also be imported.
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
