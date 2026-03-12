"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";

export function PhotoMigrationCard() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [batchSize, setBatchSize] = useState(10);
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const handleRunMigration = async () => {
        if (!user) {
            toast({ 
                title: "Authentication Required", 
                description: "You must be logged in to run migrations.", 
                variant: "destructive" 
            });
            return;
        }

        setIsRunning(true);
        setLogs(["Starting migration process..."]);

        try {
            // Get the auth token
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                throw new Error("No active session");
            }

            // Call Supabase Edge Function
            const { data, error } = await supabase.functions.invoke('migrate-vendor-photos', {
                body: { limit: batchSize },
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            if (error) {
                throw error;
            }

            if (data?.data?.logs) {
                setLogs(data.data.logs);
            }

            toast({
                title: "Migration Complete",
                description: data?.data?.message || "Photo migration completed successfully.",
                variant: "success",
            });

        } catch (err: any) {
            console.error("Migration error:", err);
            setLogs(prev => [...prev, `ERROR: ${err.message}`]);
            toast({
                title: "Migration Failed",
                description: err.message || "An error occurred during migration.",
                variant: "destructive",
            });
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Vendor Photo Migration Tool</CardTitle>
                <CardDescription>
                    Migrate vendor photos from Google Places to Supabase Storage. Processes vendors in batches to avoid system overload.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="batch-size">Batch Size (vendors per run)</Label>
                    <Input
                        id="batch-size"
                        type="number"
                        min={1}
                        max={50}
                        value={batchSize}
                        onChange={(e) => setBatchSize(parseInt(e.target.value) || 10)}
                        disabled={isRunning}
                        className="w-32"
                    />
                    <p className="text-xs text-muted-foreground">
                        Recommended: 10-20 vendors per batch to avoid API rate limits
                    </p>
                </div>

                <Button 
                    onClick={handleRunMigration} 
                    disabled={isRunning}
                    className="w-full sm:w-auto"
                >
                    {isRunning ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing Batch...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Run Photo Migration
                        </>
                    )}
                </Button>

                {logs.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <Label>Migration Logs:</Label>
                        <div className="rounded-md border bg-muted p-4 max-h-96 overflow-y-auto">
                            <pre className="text-xs font-mono whitespace-pre-wrap">
                                {logs.map((log, idx) => (
                                    <div key={idx} className="mb-1">
                                        {log}
                                    </div>
                                ))}
                            </pre>
                        </div>
                    </div>
                )}

                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-sm mb-2">How it works:</h4>
                    <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                        <li>Fetches vendor records with Google Place IDs</li>
                        <li>Downloads photos from Google Places API</li>
                        <li>Uploads photos to Supabase Storage</li>
                        <li>Updates vendor records with permanent URLs</li>
                        <li>Processes in controlled batches to prevent API overload</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
