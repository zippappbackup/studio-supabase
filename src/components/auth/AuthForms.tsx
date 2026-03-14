"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Building, User, Eye, EyeOff, Search, Mail, Phone, ChevronRight, ChevronLeft, CalendarIcon, ShieldCheck, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { countries, countryCodeMap } from "@/lib/countries";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { Vendor } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PrivacyPolicyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAgree: () => void;
}

function PrivacyPolicyDialog({ isOpen, onOpenChange, onAgree }: PrivacyPolicyDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Privacy Policy & Terms of Service</DialogTitle>
          <DialogDescription>
            Please read and agree to our terms to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 text-sm text-muted-foreground">
          <section>
            <h4 className="font-semibold text-foreground mb-2">1. Data Collection</h4>
            <p>We collect business information to provide our services and connect vendors with potential clients.</p>
          </section>
          <section>
            <h4 className="font-semibold text-foreground mb-2">2. Usage</h4>
            <p>Your data is used to maintain your profile and facilitate the marketplace operations.</p>
          </section>
          <section>
            <h4 className="font-semibold text-foreground mb-2">3. Security</h4>
            <p>We implement industry-standard security measures to protect your account and business data.</p>
          </section>
        </div>
        <DialogFooter>
          <Button onClick={onAgree} className="w-full">I Agree & Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showMainSignupForm, setShowMainSignupForm] = useState(false);
  const [isPrivacyAgreed, setIsPrivacyAgreed] = useState(false);
  const [isPrivacyDialogOpen, setIsPrivacyDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [vendorToClaim, setVendorToClaim] = useState<Vendor | null>(null);
  
  const { signUp } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    businessName: "",
    fullName: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handlePrivacyCheckChange = (checked: boolean) => {
    if (checked) {
      setIsPrivacyDialogOpen(true);
    } else {
      setIsPrivacyAgreed(false);
    }
  };

  const handleAgreeToPrivacy = () => {
    setIsPrivacyAgreed(true);
    setIsPrivacyDialogOpen(false);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPrivacyAgreed) {
      toast({
        title: "Agreement Required",
        description: "Please agree to the Privacy Policy & Terms.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        business_name: formData.businessName,
        vendor_id: vendorToClaim?.id
      });

      if (error) throw error;

      toast({
        title: "Account Created",
        description: "Please check your email to verify your account.",
      });
      
      router.push("/login");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-2 text-center">
        <h1 className="text-2xl font-bold">
          {vendorToClaim ? "Claim Business & Complete Profile" : "Create Account"}
        </h1>
        <p className="text-balance text-muted-foreground text-sm">
          Enter your details below to {vendorToClaim ? "claim your business" : "create your account"}
        </p>
      </div>

      {!showMainSignupForm ? (
        <div className="grid gap-4">
          <Button 
            className="w-full" 
            variant="outline"
            onClick={() => setShowMainSignupForm(true)}
          >
            Sign up with Email
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSignupSubmit}>
          <fieldset disabled={isLoading}>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  type="text"
                  autoCapitalize="words"
                  autoComplete="name"
                  autoCorrect="off"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder="Acme Inc"
                  type="text"
                  autoCapitalize="words"
                  autoCorrect="off"
                  required
                  value={formData.businessName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="items-top flex space-x-2 pt-4">
              <Checkbox
                id="terms"
                checked={isPrivacyAgreed}
                onCheckedChange={handlePrivacyCheckChange}
                disabled={isLoading}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the Privacy Policy & Terms.
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full !mt-8"
              disabled={isLoading || !isPrivacyAgreed}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {vendorToClaim
                ? "Claim Business & Complete Profile"
                : "Create Account"}
            </Button>
          </fieldset>
        </form>
      )}

      <div className="mt-4 text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-accent">
          Log in
        </Link>
      </div>

      <PrivacyPolicyDialog
        isOpen={isPrivacyDialogOpen}
        onOpenChange={setIsPrivacyDialogOpen}
        onAgree={handleAgreeToPrivacy}
      />
    </div>
  );
}
