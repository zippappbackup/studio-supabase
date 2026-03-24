"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export function UserDataCard() {
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        toast({ title: "Exporting User Data", description: "Fetching all users from the database...", variant: "info" });

        try {
            const { data: users, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!users || users.length === 0) {
                toast({ title: "Export Complete", description: "No users found in the database." });
                return;
            }

            // Transform to clean export format
            const exportData = users.map(u => ({
                uid: u.uid,
                name: u.name,
                email: u.email,
                role: u.role,
                phone: u.phone,
                vendorId: u.vendor_id,
                addressLine1: u.address_line1,
                addressLine2: u.address_line2,
                postalCode: u.address_postal_code,
                country: u.address_country,
                region: u.region,
                dob: u.dob,
                gender: u.gender,
                profession: u.profession,
                favourites: u.favourites,
                createdAt: u.created_at,
                updatedAt: u.updated_at,
            }));

            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const date = new Date().toISOString().split('T')[0];
            link.download = `users-export-${date}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast({ title: "Export Successful", description: `Exported ${users.length} users.`, variant: "success" });

        } catch (err: any) {
            toast({ title: "Export Failed", description: err.message, variant: "destructive" });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Data</CardTitle>
                <CardDescription>Export all registered user data from the database as a JSON file.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 p-4 border rounded-lg bg-background">
                    <p className="text-sm text-muted-foreground">
                        Download a complete JSON export of all users including their profile information, roles and account details.
                    </p>
                    <Button onClick={handleExport} disabled={isExporting} className="w-full sm:w-auto">
                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Export All User Data
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
