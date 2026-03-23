"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, StopCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Progress } from "@/components/ui/progress";

export function PhotoMigrationCard() {
    const { toast } = useToast();
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [totalRemaining, setTotalRemaining] = useState<number | null>(null);
    const [totalVendors, setTotalVendors] = useState<number>(0);
    const [processedTotal, setProcessedTotal] = useState(0);
    const [failedTotal, setFailedTotal] = useState(0);
    const stopRef = useRef(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Fetch initial remaining count on mount
    useEffect(() => {
        const fetchCount = async () => {
            const { count } = await supabase
                .from('vendors')
                .select('*', { count: 'exact', head: true })
                .like('vendor_id', 'ChIJ%')
                .not('photos', 'is', null)
                .not('photos', 'eq', '[]')
                .like('photos->0', '%maps.googleapis.com%');
            setTotalRemaining(count || 0);
            setTotalVendors(count || 0);
        };
        fetchCount();
    }, []);

    // Auto scroll logs to bottom
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const addLog = (message: string) => {
        setLogs(prev => [...prev, message]);
    };

    const handleStart = async () => {
        stopRef.current = false;
        setIsRunning(true);
        setLogs([]);
        setProcessedTotal(0);
        setFailedTotal(0);

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const BATCH_SIZE = 5;
        let remaining = totalRemaining || 0;
        let batchNumber = 0;

        addLog(`Starting full migration. ${remaining} vendors to process...`);
        addLog(`Batch size: ${BATCH_SIZE} vendors per batch`);

        while (remaining > 0 && !stopRef.current) {
            batchNumber++;
            addLog(`--- Batch ${batchNumber} (${remaining} remaining) ---`);

            // Refresh session before each batch
            let session = null;
            try {
                const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                if (!refreshError && refreshData.session) {
                    session = refreshData.session;
                } else {
                    const { data: sessionData } = await supabase.auth.getSession();
                    session = sessionData.session;
                }
            } catch (e) {
                const { data: sessionData } = await supabase.auth.getSession();
                session = sessionData.session;
            }

            if (!session) {
                addLog('ERROR: Session expired. Please log out and back in.');
                break;
            }

            try {
                const response = await fetch(`${supabaseUrl}/functions/v1/migrate-vendor-photos`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                        'apikey': supabaseAnonKey || '',
                    },
                    body: JSON.stringify({ limit: BATCH_SIZE }),
                });

                const result = await response.json();

                if (result?.data?.logs) {
                    result.data.logs.forEach((log: string) => addLog(log));
                }

                if (!result?.data?.success) {
                    addLog(`ERROR: ${result?.data?.message}`);
                    if (result?.data?.message?.includes('quota')) {
                        addLog('STOPPING: Google API quota exceeded. Resume tomorrow.');
                        toast({ title: "Quota Exceeded", description: "Google API quota reached. Resume tomorrow.", variant: "destructive" });
                        break;
                    }
                    if (result?.data?.message?.includes('Unauthorized')) {
                        addLog('STOPPING: Authentication failed.');
                        break;
                    }
                }

                const batchProcessed = result?.data?.processed || 0;
                const batchFailed = result?.data?.failed || 0;
                setProcessedTotal(prev => prev + batchProcessed);
                setFailedTotal(prev => prev + batchFailed);
                remaining = result?.data?.total_remaining ?? remaining - BATCH_SIZE;
                setTotalRemaining(remaining);

                if (remaining <= 0) {
                    addLog('✅ ALL VENDORS MIGRATED SUCCESSFULLY!');
                    toast({ title: "Migration Complete!", description: "All vendor photos migrated to Supabase Storage.", variant: "success" });
                    break;
                }

                // Wait 2 seconds between batches
                if (!stopRef.current) {
                    addLog(`Waiting 2 seconds before next batch...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }

            } catch (err: any) {
                addLog(`ERROR in batch ${batchNumber}: ${err.message}`);
                addLog('Stopping migration. Safe to resume - already migrated vendors will be skipped.');
                toast({ title: "Migration Error", description: err.message, variant: "destructive" });
                break;
            }
        }

        if (stopRef.current) {
            addLog('Migration stopped by user. Safe to resume later - already migrated vendors will be skipped.');
            toast({ title: "Migration Paused", description: "Resume anytime - migrated vendors are automatically skipped." });
        }

        setIsRunning(false);
    };

    const handleStop = () => {
        stopRef.current = true;
        addLog('Stop requested — finishing current batch before stopping...');
    };

    const progressPercent = totalVendors > 0
        ? Math.round(((totalVendors - (totalRemaining || 0)) / totalVendors) * 100)
        : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Vendor Photo Migration Tool</CardTitle>
                <CardDescription>
                    Migrates vendor photos from Google Places to Supabase Storage permanently.
                    Processes 5 vendors per batch. Already migrated vendors are automatically skipped.
                    Safe to stop and resume at any time.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

                {totalRemaining !== null && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                Unmigrated: <strong>{totalRemaining}</strong> vendors
                            </span>
                            <span className="text-muted-foreground">
                                Progress: <strong>{progressPercent}%</strong>
                            </span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                        {isRunning && (
                            <div className="flex gap-4 text-xs">
                                <span className="text-green-600 font-medium">✓ Processed this session: {processedTotal}</span>
                                <span className="text-red-600 font-medium">✗ Failed: {failedTotal}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-2">
                    <Button
                        onClick={handleStart}
                        disabled={isRunning || totalRemaining === 0}
                        className="flex-1"
                    >
                        {isRunning ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Migrating...</>
                        ) : totalRemaining === 0 ? (
                            <><RefreshCw className="mr-2 h-4 w-4" />All Photos Migrated ✓</>
                        ) : (
                            <><RefreshCw className="mr-2 h-4 w-4" />Start Migration ({totalRemaining} vendors)</>
                        )}
                    </Button>
                    {isRunning && (
                        <Button onClick={handleStop} variant="destructive">
                            <StopCircle className="mr-2 h-4 w-4" />Stop
                        </Button>
                    )}
                </div>

                {logs.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Migration Logs:</p>
                        <div className="rounded-md border bg-muted p-4 max-h-96 overflow-y-auto">
                            <pre className="text-xs font-mono whitespace-pre-wrap">
                                {logs.map((log, idx) => (
                                    <div key={idx} className={`mb-1 ${
                                        log.includes('SUCCESS') || log.includes('✅') ? 'text-green-600 font-medium' :
                                        log.includes('ERROR') || log.includes('FAILED') || log.includes('STOPPING') ? 'text-red-600' :
                                        log.includes('---') ? 'text-blue-600 font-bold' :
                                        log.includes('SKIPPED') ? 'text-yellow-600' : ''
                                    }`}>
                                        {log}
                                    </div>
                                ))}
                            </pre>
                            <div ref={logsEndRef} />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
