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
import { Loader2, Building, User, Eye, EyeOff, Search, ChevronLeft, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { countries, countryCodeMap } from "@/lib/countries";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { Vendor } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { useAppCache } from "@/context/AppCacheProvider";
import Fuse from 'fuse.js';
import { ScrollArea } from "../ui/scroll-area";
import { PlaceholderImages } from "@/lib/placeholder-images";
import type { Address, ZippUser } from "@/lib/types";

// Vendor search using client-side snapshot and fuse.js
const VendorSearch = React.memo(function VendorSearch({ onSwitchToCreate }: { onSwitchToCreate: () => void }) {
  const router = useRouter();
  const { vendorDataset, isVendorDataReady, categories } = useAppCache();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Vendor[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const fuse = useMemo(() => {
    if (!isVendorDataReady || !vendorDataset) return null;
    return new Fuse(vendorDataset, {
      keys: ['name', 'address'],
      threshold: 0.4,
      includeScore: true,
    });
  }, [isVendorDataReady, vendorDataset]);

  const handleSearchQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleBusinessSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (!fuse) {
      setSearchError("Search data is not ready yet. Please wait a moment.");
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    const results = fuse.search(searchQuery);
    const foundVendors = results.map(result => result.item);
    if (foundVendors.length > 0) {
      setSearchResults(foundVendors.slice(0, 5));
    } else {
      setSearchError("Your business isn't listed. You can create a new listing now.");
    }
    setIsSearching(false);
  }, [fuse, searchQuery]);

  const handleVendorClick = (vendor: Vendor) => {
    router.push(`/claim-business/${vendor.id}`);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '';
  };

  return (
    <div className="space-y-4">
      <div className="text-center p-0">
        <Search className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <h2 className="text-lg font-semibold tracking-tight">Claim Your Business | It Might Already Be Listed</h2>
        <p className="text-sm text-muted-foreground">Start by searching for your business to claim its profile.</p>
      </div>
      <form onSubmit={handleBusinessSearch} className="space-y-2">
        <Label htmlFor="search-business">Search by Business Name</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search-business"
            value={searchQuery}
            onChange={handleSearchQueryChange}
            placeholder="Search for your business by name"
            className="pl-10"
          />
        </div>
        <Button type="submit" className="w-full" disabled={isSearching || !isVendorDataReady}>
          {(isSearching || !isVendorDataReady) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isVendorDataReady ? 'Search' : 'Loading Data...'}
        </Button>
      </form>
      {searchError && <p className="text-sm text-center text-muted-foreground">{searchError}</p>}
      {searchResults.length > 0 && (
        <div className="space-y-2 pt-4">
          <h3 className="font-semibold text-center">Is this your business?</h3>
          {searchResults.map(vendor => {
            const logoUrl = vendor.logoUrl || (vendor.photos && vendor.photos.length > 0 ? (vendor.photos[0] as any).url || vendor.photos[0] : PlaceholderImages['vendor-logo-placeholder'].imageUrl);
            const categoryName = getCategoryName(vendor.categoryId);
            const rating = vendor.zippRating || vendor.googleRating;
            return (
              <Card key={vendor.id} className="cursor-pointer hover:border-primary" onClick={() => handleVendorClick(vendor)}>
                <CardContent className="p-3 bg-card">
                  <div className="flex items-start gap-4 w-full">
                    <Image src={logoUrl as string} alt="logo" width={48} height={48} className="h-12 w-12 object-cover" />
                    <div className="flex-1 overflow-hidden">
                      <p className="font-semibold truncate text-sm">{vendor.name}</p>
                      {categoryName && <p className="text-xs text-muted-foreground">{categoryName}</p>}
                      <p className="text-xs text-muted-foreground truncate">{vendor.address}</p>
                    </div>
                    {rating ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-semibold">{rating.toFixed(1)}</span>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <div className="text-center text-sm pt-2">
        <Button variant="link" onClick={onSwitchToCreate} className="text-sm h-auto p-0 text-accent">
          Not Listed? No worries! Create a new account here
        </Button>
      </div>
    </div>
  );
});

const PrivacyPolicyDialog = ({ isOpen, onOpenChange, onAgree }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onAgree: () => void }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Zipp Privacy & User Agreement</DialogTitle>
          <DialogDescription>Last Updated: January 9 2026</DialogDescription>
        </DialogHeader>
        <div className="border rounded-lg bg-card">
          <ScrollArea className="h-72 p-6">
            <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
              <div>
                <h4 className="text-base font-bold mb-2">Introduction</h4>
                <p>Welcome to Zipp. We are committed to protecting your privacy in accordance with the Personal Data Protection Act 2012 (PDPA) of Singapore. This policy governs how we collect, use, and disclose personal data for our Customers (Regular Users) and Vendors (Business Owners). By creating an account, you consent to the practices described herein.</p>
              </div>
              <Separator className="my-4" />
              <div>
                <h4 className="text-base font-bold mb-2">Personal Data We Collect</h4>
                <p className="mb-2">We collect information necessary to provide a high-quality local service marketplace:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><b>Account Data:</b> Name, email address, mobile number, and password.</li>
                  <li><b>Vendor Business Data:</b> Business name, UEN, address, service catalog, and professional photos.</li>
                  <li><b>Location Data:</b> Your physical location (with your permission) to provide "Nearby Services" and Map-based discovery.</li>
                  <li><b>Interaction Data:</b> Reviews, star ratings, promotion collection history, and your favorites in "Zipp Hub."</li>
                </ul>
              </div>
              <Separator className="my-4" />
              <div>
                <h4 className="text-base font-bold mb-2">Purpose of Collection and Use</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><b>Marketplace Connectivity:</b> Enabling customers to find and contact local vendors.</li>
                  <li><b>Service Personalization:</b> Curating "Zipp Highlights" and tailored promotions.</li>
                  <li><b>Verification:</b> Authenticating business ownership for "Claim Your Business" flows.</li>
                  <li><b>Platform Security:</b> Preventing fraudulent reviews or unauthorized access.</li>
                </ul>
              </div>
              <Separator className="my-4" />
              <div>
                <h4 className="text-base font-bold mb-2">Disclosure to Third Parties</h4>
                <p className="mb-2">We do not sell, rent, or trade your personal data. Disclosure only occurs to:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><b>Vendors:</b> When a customer interacts with a business profile or redeems a promotion.</li>
                  <li><b>Service Providers:</b> Trusted partners like Supabase (used for hosting, authentication, and data storage).</li>
                  <li><b>Legal Requirements:</b> When required by Singapore law or government authorities.</li>
                </ul>
              </div>
              <Separator className="my-4" />
              <div>
                <h4 className="text-base font-bold mb-2">Data Security and Retention</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><b>Security:</b> We implement industry-standard encryption (TLS/SSL) to protect your data.</li>
                  <li><b>Retention:</b> We retain personal data only for as long as your account is active or as needed to fulfill legal or business purposes.</li>
                </ul>
              </div>
              <Separator className="my-4" />
              <div>
                <h4 className="text-base font-bold mb-2">Your Rights (Access, Correction, and Withdrawal)</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  <li><b>Access:</b> Request a copy of the personal data we hold about you.</li>
                  <li><b>Correction:</b> Request that we update or correct any inaccurate information.</li>
                  <li><b>Withdrawal:</b> Withdraw your consent for data processing at any time.</li>
                </ol>
              </div>
              <Separator className="my-4" />
              <div>
                <h4 className="text-base font-bold mb-2">Contact Our Data Protection Officer (DPO)</h4>
                <p>Email: <a href="mailto:dpo@zipp.sg" className="text-blue-800">dpo@zipp.sg</a></p>
                <p>Response Time: We aim to respond within 7 working days.</p>
              </div>
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onAgree}>I Have Read & Agree To The Terms</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export function AuthForm({ type, vendorToClaim: vendorProp }: { type: "login" | "signup", vendorToClaim?: Vendor }) {
  const { user: authUser, loading: authLoading, login, signup, sendResetEmail } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [gender, setGender] = useState<'male' | 'female' | 'other' | "prefer_not_to_say">();
  const [profession, setProfession] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");

  const initialRole = searchParams.get('role') === 'vendor' ? 'vendor' : 'user';
  const [role, setRole] = useState<'user' | 'vendor'>(initialRole);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [vendorStep, setVendorStep] = useState<'search' | 'create'>('search');
  const [vendorToClaim, setVendorToClaim] = useState<Vendor | undefined>(vendorProp);
  const [isPrivacyDialogOpen, setIsPrivacyDialogOpen] = useState(false);
  const [isPrivacyAgreed, setIsPrivacyAgreed] = useState(false);
  const [formView, setFormView] = useState<'login' | 'reset'>('login');

  useEffect(() => {
    if (vendorProp) setVendorToClaim(vendorProp);
  }, [vendorProp]);

  // Fetch vendor by ID from URL param (Supabase version)
  useEffect(() => {
    const claimedVendorId = searchParams.get('claimedVendorId');
    if (claimedVendorId && !vendorToClaim) {
      const fetchVendor = async () => {
        const { data, error } = await supabase
          .from('vendors')
          .select('*')
          .eq('vendor_id', claimedVendorId)
          .single();
        if (!error && data) {
          setVendorToClaim({ id: data.vendor_id, ...data } as Vendor);
        }
      };
      fetchVendor();
    }
  }, [searchParams, vendorToClaim]);

  // Pre-fill fields when claiming a vendor
  useEffect(() => {
    if (vendorToClaim) {
      setRole('vendor');
      setCompanyName(vendorToClaim.name || '');
      setPhone(vendorToClaim.phone || '');
      setEmail(vendorToClaim.email || '');
      setCountry(vendorToClaim.region || '');
      if (vendorToClaim.address) {
        const fullAddress = vendorToClaim.address;
        const postalCodeMatch = fullAddress.match(/(\d{6})$/);
        if (postalCodeMatch) {
          const extractedPostalCode = postalCodeMatch[1];
          setPostalCode(extractedPostalCode);
          const mainAddress = fullAddress.replace(`, Singapore ${extractedPostalCode}`, '').trim().replace(/,$/, '');
          setAddressLine1(mainAddress);
        } else {
          setAddressLine1(fullAddress);
          setPostalCode('');
        }
      }
    }
  }, [vendorToClaim]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSearchError(null);
    try {
      await login(email, password);
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password. Please try again.';
            break;
          default:
            errorMessage = `Login failed: ${error.message}`;
        }
      } else {
        errorMessage = error.message;
      }
      setSearchError(errorMessage);
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", description: "Please re-enter your passwords and try again.", variant: "destructive" });
      return;
    }

    if (!country) {
      toast({ title: "Country is required", description: "Please select your country.", variant: "destructive" });
      return;
    }

    let dobString: string | null = null;
    let finalGender: ZippUser['gender'] | null = null;
    let finalProfession: string | null = null;

    if (role === 'user') {
      if (!year || !month || !day) {
        toast({ title: "Date of Birth Required", description: "Please enter your full date of birth.", variant: "destructive" });
        return;
      }
      const dobDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
      if (isNaN(dobDate.getTime())) {
        toast({ title: "Invalid Date", description: "Please enter a valid date of birth.", variant: "destructive" });
        return;
      }
      dobString = dobDate.toISOString().split('T')[0];
      if (!gender) {
        toast({ title: "Gender selection is required", description: "Please select your gender.", variant: "destructive" });
        return;
      }
      finalGender = gender;
      finalProfession = profession || null;
      const today = new Date();
      let age = today.getUTCFullYear() - dobDate.getUTCFullYear();
      const m = today.getUTCMonth() - dobDate.getUTCMonth();
      if (m < 0 || (m === 0 && today.getUTCDate() < dobDate.getUTCDate())) age--;
      if (age < 16) {
        toast({ title: "Registration Rejected", description: "You must be at least 16 years old to sign up.", variant: "destructive" });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const address = {
        line1: addressLine1,
        line2: addressLine2,
        postalCode: postalCode,
        country: country,
      };
      const countryDialingCode = countryCodeMap[country as keyof typeof countryCodeMap] || '';
      const formattedPhone = phone.startsWith('+') ? phone : `${countryDialingCode}${phone}`;
      const displayName = vendorToClaim ? vendorToClaim.name : (role === 'vendor' ? companyName : name);

      const signupData = {
        name: displayName,
        role,
        phone: formattedPhone,
        address,
        companyName,
        claimedVendorId: vendorToClaim?.id,
        dob: dobString,
        gender: finalGender,
        profession: finalProfession,
      };

      const { redirectPath } = await signup(email, password, signupData);
      router.push(redirectPath);
    } catch (error: any) {
      toast({ title: "Sign Up Error", description: error.message, variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Email required", description: "Please enter your email address to reset your password.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const result = await sendResetEmail(email);
    setIsSubmitting(false);
    if (result.success) {
      toast({ title: "Password Reset Email Sent", description: "Please check your inbox for instructions to reset your password.", variant: "success" });
      setFormView('login');
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleSwitchToCreate = useCallback(() => { setVendorStep('create'); }, []);
  const isLoading = isSubmitting || authLoading;

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value), []);
  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value), []);
  const handleConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value), []);
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value), []);
  const handleCompanyNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setCompanyName(e.target.value), []);
  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value), []);
  const handleProfessionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setProfession(e.target.value), []);
  const handleCountryChange = useCallback((value: string) => setCountry(value), []);
  const handleAddressLine1Change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setAddressLine1(e.target.value), []);
  const handleAddressLine2Change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setAddressLine2(e.target.value), []);
  const handlePostalCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setPostalCode(e.target.value), []);
  const handleAgreeToPrivacy = () => { setIsPrivacyAgreed(true); setIsPrivacyDialogOpen(false); };
  const handlePrivacyCheckChange = (checked: boolean | 'indeterminate') => {
    if (checked === true) { setIsPrivacyDialogOpen(true); } else { setIsPrivacyAgreed(false); }
  };
  const handleSetRole = (value: "user" | "vendor") => { if (value) setRole(value); };

  const showMainSignupForm = role === 'user' || !!vendorToClaim || vendorStep === 'create';

  // LOGIN FORM
  if (type === 'login') {
    if (formView === 'reset') {
      return (
        <div className="grid gap-4">
          <div className="grid gap-2 text-center">
            <h1 className="text-xl font-bold">Reset Password</h1>
            <p className="text-balance text-muted-foreground text-xs">Enter your email and we'll send you a link to reset your password.</p>
          </div>
          <form onSubmit={handlePasswordReset}>
            <fieldset disabled={isLoading}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={handleEmailChange} required />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Email
                </Button>
              </div>
            </fieldset>
          </form>
          <div className="mt-4 text-center text-sm">
            Remembered your password?{" "}
            <Button variant="link" className="p-0 h-auto" onClick={() => setFormView('login')}>Back to Login</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        <div className="grid gap-2 text-center">
          <h1 className="text-xl font-bold">Login</h1>
          <p className="text-balance text-muted-foreground text-xs">Enter your email below to login to your account</p>
        </div>
        <form onSubmit={handleLoginSubmit}>
          <fieldset disabled={isLoading}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={handleEmailChange} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={handlePasswordChange} required />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {searchError && <p className="text-sm text-destructive">{searchError}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </div>
          </fieldset>
        </form>
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-accent">Sign up</Link>
        </div>
        <div className="mt-2 text-center text-sm">
          Forgotten your password?{" "}
          <Button variant="link" className="p-0 h-auto text-sm text-accent" onClick={() => setFormView('reset')}>Recover it now</Button>
        </div>
      </div>
    );
  }

  // SIGNUP FORM
  const countryOptions: ComboboxOption[] = countries.map(c => ({ value: c.value, label: c.label }));
  const genderOptions: ComboboxOption[] = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
    { value: "prefer_not_to_say", label: "Prefer not to say" },
  ];

  return (
    <>
      <div className="grid gap-6">
        {!vendorToClaim && (
          <div className="space-y-4">
            <ToggleGroup
              type="single"
              value={role}
              onValueChange={handleSetRole}
              className="grid grid-cols-2 gap-2 bg-secondary/50 p-1 rounded-lg"
              variant="outline"
            >
              <ToggleGroupItem value="user" className="gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                <User className="h-4 w-4" />
                Personal User
              </ToggleGroupItem>
              <ToggleGroupItem value="vendor" className="gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                <Building className="h-4 w-4" />
                Business Owner
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}

        {role === "vendor" && !showMainSignupForm && (
          <VendorSearch onSwitchToCreate={handleSwitchToCreate} />
        )}

        {showMainSignupForm && (
          <form onSubmit={handleSignupSubmit}>
            <fieldset disabled={isLoading} className="space-y-6">

              {role === "vendor" && (vendorStep === "create" || vendorToClaim) && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h2 className="text-lg font-semibold leading-none tracking-tight">Business Details</h2>
                  </div>
                  {vendorStep === "create" && !vendorToClaim && (
                    <Button variant="link" size="sm" onClick={() => setVendorStep("search")} className="p-0 h-auto">
                      <ChevronLeft className="h-4 w-4 mr-1" /> Back to business search
                    </Button>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Business Name</Label>
                    <Input id="companyName" value={companyName} onChange={handleCompanyNameChange} required disabled={!!vendorToClaim} />
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <h2 className="text-lg font-semibold leading-none tracking-tight">Your Information</h2>
                  <p className="text-sm text-muted-foreground">This will be used to create your account.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">{role === "user" ? "Full Name" : "Your Full Name (As representative)"}</Label>
                  <Input id="name" value={name} onChange={handleNameChange} required />
                </div>

                {role === "user" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input placeholder="DD" value={day} onChange={(e) => setDay(e.target.value)} maxLength={2} className="placeholder:text-[90%]" />
                          <Input placeholder="MM" value={month} onChange={(e) => setMonth(e.target.value)} maxLength={2} className="placeholder:text-[90%]" />
                          <Input placeholder="YYYY" value={year} onChange={(e) => setYear(e.target.value)} maxLength={4} className="w-full placeholder:text-[90%]" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <Combobox
                          options={genderOptions}
                          value={gender}
                          onChange={(value) => setGender(value as any)}
                          placeholder="Select a gender"
                          searchPlaceholder="Search genders..."
                          noResultsMessage="No gender found."
                          searchDisabled
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profession">Profession (Optional)</Label>
                      <Input id="profession" type="text" value={profession} onChange={handleProfessionChange} />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="phone">Mobile Number</Label>
                  <Input id="phone" type="tel" value={phone} onChange={handlePhoneChange} required />
                </div>

                {(role === "user" || (role === "vendor" && vendorStep === "create")) && (
                  <div className="space-y-4 pt-2">
                    <Separator />
                    <p className="text-sm font-medium pt-2">Address</p>
                    <div className="space-y-2">
                      <Input id="addressLine1" value={addressLine1} onChange={handleAddressLine1Change} placeholder="Address Line 1" required />
                    </div>
                    <div className="space-y-2">
                      <Input id="addressLine2" value={addressLine2} onChange={handleAddressLine2Change} placeholder="Address Line 2 (Optional)" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Combobox
                          options={countryOptions}
                          value={country}
                          onChange={handleCountryChange}
                          placeholder="Country"
                          searchPlaceholder="Search countries..."
                          noResultsMessage="No country found."
                        />
                      </div>
                      <div className="space-y-2">
                        <Input id="postalCode" value={postalCode} onChange={handlePostalCodeChange} placeholder="Postal Code" required />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <h2 className="text-lg font-semibold leading-none tracking-tight">Login Credentials</h2>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Login Email</Label>
                    <Input id="email" type="email" value={email} onChange={handleEmailChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={handlePasswordChange} required />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Re-type Password</Label>
                    <div className="relative">
                      <Input id="confirmPassword" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={handleConfirmPasswordChange} required />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="items-top flex space-x-2 pt-4">
                <Checkbox id="terms" checked={isPrivacyAgreed} onCheckedChange={handlePrivacyCheckChange} disabled={isLoading} />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    I agree to the Privacy Policy &amp; Terms.
                  </Label>
                </div>
              </div>

              <Button type="submit" className="w-full !mt-8" disabled={isLoading || !isPrivacyAgreed}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {vendorToClaim ? "Claim Business & Complete Profile" : "Create Account"}
              </Button>

            </fieldset>
          </form>
        )}

        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-accent">Log in</Link>
        </div>
      </div>

      <PrivacyPolicyDialog
        isOpen={isPrivacyDialogOpen}
        onOpenChange={setIsPrivacyDialogOpen}
        onAgree={handleAgreeToPrivacy}
      />
    </>
  );
}
