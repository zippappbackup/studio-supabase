
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class VendorProfileErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex h-full items-center justify-center p-4">
            <Card className="max-w-md w-full text-center bg-destructive/10 border-destructive">
                <CardHeader>
                    <div className="mx-auto text-destructive">
                        <AlertTriangle className="h-10 w-10" />
                    </div>
                    <CardTitle className="pt-4 text-destructive">Page Failed to Load</CardTitle>
                    <CardDescription className="text-destructive/80">
                        A critical error prevented this page from rendering.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <p className="text-sm text-muted-foreground">
                        Error: {this.state.error?.message}
                    </p>
                    <Button variant="secondary" onClick={() => window.location.reload()} className="mt-4">
                        Reload Page
                    </Button>
                </CardContent>
            </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
