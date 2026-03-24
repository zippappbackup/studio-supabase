"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function UserDataCard() {
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

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
            <div className="space-y-3 p-4 border rounded-lg bg-background mt-4">
                    <p className="text-sm text-muted-foreground">
                        Back up Supabase Authentication data including all registered user accounts.
                    </p>
                    <Button onClick={() => setIsInstructionsOpen(true)} variant="outline" className="w-full sm:w-auto">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Instructions to Backup Supabase User Authentication
                    </Button>
                </div>
            </CardContent>

            <Dialog open={isInstructionsOpen} onOpenChange={setIsInstructionsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>How to Backup Supabase User Authentication</DialogTitle>
                        <DialogDescription>Follow these steps to export all authentication data from Supabase.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 text-sm">
                        <div className="space-y-1">
                            <p className="font-semibold">Step 1 — Log in to Supabase Dashboard</p>
                            <p className="text-muted-foreground">Go to <span className="font-mono text-accent">https://supabase.com/dashboard</span> and select your project.</p>
                        </div>
                        <div className="space-y-1">
                            <p className="font-semibold">Step 2 — Go to Project Settings</p>
                            <p className="text-muted-foreground">Click on <span className="font-semibold">Settings</span> in the left sidebar, then select <span className="font-semibold">Database</span>.</p>
                        </div>
                        <div className="space-y-1">
                            <p className="font-semibold">Step 3 — Download a Database Backup</p>
                            <p className="text-muted-foreground">Scroll down to find the <span className="font-semibold">Backups</span> section. Click <span className="font-semibold">Download backup</span>. This includes the full PostgreSQL dump with all authentication data in the <span className="font-mono">auth.users</span> table.</p>
                        </div>
                        <div className="space-y-1">
                            <p className="font-semibold">Step 4 — Store the backup securely</p>
                            <p className="text-muted-foreground">Save the downloaded file in a secure location such as an encrypted drive or secure cloud storage. Do not share this file as it contains sensitive user data.</p>
                        </div>
                        <div className="space-y-1">
                            <p className="font-semibold">Step 5 — Automatic Backups (Recommended)</p>
                            <p className="text-muted-foreground">Supabase automatically creates daily backups on the Pro plan and weekly backups on the Free plan. Consider upgrading to Pro for more frequent backups and Point-in-Time Recovery.</p>
                        </div>
                        <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                            <p className="text-amber-800 font-medium text-xs">⚠️ Important Note</p>
                            <p className="text-amber-700 text-xs mt-1">Password hashes are specific to Supabase's authentication system. If migrating to another platform, users will need to reset their passwords. The User Data export above captures all public profile data separately.</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
