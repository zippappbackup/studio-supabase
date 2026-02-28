
'use client';

import { Suspense } from 'react';
import { AuthForm } from './AuthForms';
import type { Vendor } from '@/lib/types';
import { Loader2 } from 'lucide-react';

function AuthFormLoading() {
    return (
        <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    )
}

export function AuthFormWrapper({ 
    type, 
    vendorToClaim
}: { 
    type: 'login' | 'signup', 
    vendorToClaim?: Vendor
}) {
    return (
        <Suspense fallback={<AuthFormLoading />}>
            <AuthForm type={type} vendorToClaim={vendorToClaim} />
        </Suspense>
    )
}
