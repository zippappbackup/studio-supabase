
"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import UserProfileForm from "./UserProfileForm";

const PasswordChangeDialog = dynamic(
  () => import('./PasswordChangeDialog').then(mod => mod.PasswordChangeDialog),
  {
    ssr: false,
    loading: () => <Loader2 className="h-5 w-5 animate-spin" />,
  }
);

export default function UserProfilePage() {
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

    return (
        <div className="space-y-8">
            <UserProfileForm 
              onOpenPasswordDialog={() => setIsPasswordDialogOpen(true)}
            />

            <PasswordChangeDialog 
                isOpen={isPasswordDialogOpen}
                setIsOpen={setIsPasswordDialogOpen}
            />
        </div>
    );
}
