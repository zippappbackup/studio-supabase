'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Download, Loader2, CheckCircle2 } from 'lucide-react';

export function BackupTool() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  const handleRunBackup = async () => {
    setIsBackingUp(true);
    // This calls the API route that triggers your python logic
    try {
      const response = await fetch('/api/admin/run-backup', { method: 'POST' });
      if (response.ok) {
        setLastBackup(new Date().toLocaleString());
      }
    } catch (error) {
      console.error('Backup failed:', error);
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          <CardTitle>System Wide Backup Tool</CardTitle>
        </div>
        <CardDescription>
          Runs the Python-based backup script to sync Supabase buckets and export raw data to local storage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Status: {isBackingUp ? 'Backup in progress...' : 'Ready'}
            </p>
            {lastBackup && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Last successful backup: {lastBackup}
              </p>
            )}
          </div>
          <Button 
            onClick={handleRunBackup} 
            disabled={isBackingUp}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isBackingUp ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Run Python Backup
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
