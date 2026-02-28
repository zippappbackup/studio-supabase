
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface PasswordChangeDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function PasswordChangeDialog({ isOpen, setIsOpen }: PasswordChangeDialogProps) {
  const { changePassword, logout } = useAuth();
  const { toast } = useToast();
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
        toast({ title: "Password too short", description: "Your new password must be at least 6 characters long.", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    const result = await changePassword(currentPassword, newPassword);

    if (result.success) {
      toast({ title: "Password Changed", description: "Your password has been updated. You will now be logged out.", variant: "success" });
      await logout();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Your Password</DialogTitle>
          <DialogDescription>Enter your current and new password below.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2 relative">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type={showPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2 relative">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2 relative">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
           <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={() => setShowPassword(p => !p)}>
                {showPassword ? <EyeOff className="mr-2"/> : <Eye className="mr-2"/>}
                {showPassword ? 'Hide' : 'Show'} Passwords
            </Button>
           </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
