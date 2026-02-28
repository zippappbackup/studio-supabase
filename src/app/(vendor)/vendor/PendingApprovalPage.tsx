"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import Logo from "@/components/core/Logo";

export function PendingApprovalPage() {
    const { logout } = useAuth();

    return (
        <div className="flex h-screen w-full items-center justify-center bg-muted p-4">
            <Card className="max-w-md w-full text-center">
                <CardHeader>
                    <div className="mx-auto mb-4">
                        <Logo />
                    </div>
                    <CardTitle className="pt-4">Claim Submitted for Review</CardTitle>
                    <CardDescription>
                        Thank you for claiming your business. Your submission is currently pending admin approval.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={logout} variant="outline">
                        Log Out
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
