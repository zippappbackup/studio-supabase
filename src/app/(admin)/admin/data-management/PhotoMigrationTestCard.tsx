"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FlaskConical } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export function PhotoMigrationTestCard() {
    const { toast } = useToast();
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const handleRunTest = async () => {
        setIsRunning(true);
        setLogs(["Refreshing session..."]);

        try {
            // Refresh session before calling edge function
            let session = null;
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            if (!refreshError && refreshData.session) {
                session = refreshData.session;
                setLogs(prev => [...prev, "Session refreshed successfully."]);
            } else {
                // Fallback to current session
                const { data: sessionData } = await supabase.auth.getSession();
                session = sessionData.session;
                setLogs(prev => [...prev, "Using current session."]);
            }

            if (!session) {
                throw new Error("No active session. Please log out and back in.");
            }

            setLogs(prev => [...prev, "Calling test migration function..."]);

            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            const response = await fetch(`${supabaseUrl}/functions/v1/migrate-vendor-photos-test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                    'apikey': supabaseAnonKey || '',
                },
                body: JSON.stringify({}),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP ${response.status}`);
            }

            if (result?.data?.logs) {
                setLogs(result.data.logs);
            }

            if (result?.data?.success) {
                toast({
                    title: "Test Migration Successful!",
                    description: result.data.message,
                    variant: "success",
                });
            } else {
                throw new Error(result?.data?.message || "Test failed");
            }

        } catch (err: any) {
            setLogs(prev => [...prev, `ERROR: ${err.message}`]);
            toast({
                title: "Test Failed",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <Card className="border-amber-300">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-amber-500" />
                    Photo Migration Test Tool
                </CardTitle>
                <CardDescription>
                    Tests the migration pipeline on exactly 1 vendor with all its photos. 
                    Run this before the full migration to verify everything works correctly.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button
                    onClick={handleRunTest}
                    disabled={isRunning}
                    variant="outline"
                    className="w-full border-amber-300 hover:bg-amber-50"
                >
                    {isRunning ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Running Test...
                        </>
                    ) : (
                        <>
                            <FlaskConical className="mr-2 h-4 w-4 text-amber-500" />
                            Run Test Migration (1 Vendor)
                        </>
                    )}
                </Button>

                {logs.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium">Test Logs:</p>
                        <div className="rounded-md border bg-muted p-4 max-h-96 overflow-y-auto">
                            <pre className="text-xs font-mono whitespace-pre-wrap">
                                {logs.map((log, idx) => (
                                    <div key={idx} className={`mb-1 ${log.includes('SUCCESS') ? 'text-green-600' : log.includes('ERROR') || log.includes('FAILED') ? 'text-red-600' : ''}`}>
                                        {log}
                                    </div>
                                ))}
                            </pre>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
