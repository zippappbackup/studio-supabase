
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useFirestore } from "@/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import type { Vendor, GooglePhoto } from "@/lib/types";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Eye, X, Info, Lock, Unlock, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { countries } from "@/lib/countries";
import { logActivity } from "@/lib/activity-logger";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ImageUploader } from "@/components/core/ImageUploader";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { PlaceholderImages } from "@/lib/placeholder-images";
import { useDoc, useMemoFirebase } from "@/firebase";
import { getLogoUrl } from "@/lib/utils";

interface VendorProfileFormProps {
    onPublicViewClick: () => void;
}

export function VendorProfileForm({ onPublicViewClick }: VendorProfileFormProps) {
    const { user } = useAuth();
    const db = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const [vendor, setVendor] = useState<Partial<Vendor>>({});
    const [initialVendor, setInitialVendor] = useState<Partial<Vendor>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [hoursText, setHoursText] = useState('');
    const [photoUrlInput, setPhotoUrlInput] = useState("");

    const vendorId = useMemo(() => user?.vendorId || user?.uid, [user]);

    // This is the single source of truth for live data
    const vendorRef = useMemoFirebase(() => (vendorId && db ? doc(db, "vendors", vendorId) : null), [vendorId, db]);
    const { data: liveVendor, isLoading: isLiveVendorLoading } = useDoc<Vendor>(vendorRef);
    
    // Memoize the selected country code to avoid re-calculating on every render
    const countryOptions: ComboboxOption[] = useMemo(() => countries.map(c => ({ value: c.value, label: c.label })), []);

    // Effect to update the form's state only when live data arrives
    useEffect(() => {
        if (liveVendor) {
            const dataToSet = { ...liveVendor };
            
            if ((!dataToSet.tags || dataToSet.tags.length === 0) && dataToSet.types && dataToSet.types.length > 0) {
                dataToSet.tags = [...dataToSet.types];
            }
            
            setVendor(dataToSet);
            setInitialVendor(dataToSet);

            if (Array.isArray(dataToSet.operatingHours)) {
                setHoursText(dataToSet.operatingHours.join('\n'));
            } else if (typeof dataToSet.operatingHours === 'object' && dataToSet.operatingHours !== null) {
                setHoursText(Object.entries(dataToSet.operatingHours).map(([day, time]) => `${day}: ${time}`).join('\n'));
            } else {
                 setHoursText('');
            }
        }
        if (!isLiveVendorLoading) {
            setIsLoading(false);
        }
    }, [liveVendor, isLiveVendorLoading]);
    
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setVendor(prev => ({ ...prev, [name]: value }));
    }, []);
    
    const handleHoursChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setHoursText(e.target.value);
        // This will be parsed on save
    };

    const handleAddTag = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            const newTag = tagInput.trim().toLowerCase();
            if (!vendor.types?.map(t => t.toLowerCase()).includes(newTag)) {
                const newTypes = [...(vendor.types || []), tagInput.trim()];
                setVendor(prev => ({ ...prev, types: newTypes }));
            }
            setTagInput('');
        }
    }, [tagInput, vendor.types]);

    const handleRemoveTag = useCallback((typeToRemove: string) => {
        const newTypes = vendor.types?.filter(type => type !== typeToRemove);
        setVendor(prev => ({ ...prev, types: newTypes }));
    }, [vendor.types]);
    
    const handleCountryChange = useCallback((countryLabel: string) => {
        setVendor(prev => ({ ...prev, region: countryLabel, country: countryLabel }));
    }, []);


    const handleSave = async () => {
        if (!vendorId || !db) {
            toast({ title: "Error", description: "Not logged in or database not connected.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        const vendorRef = doc(db, "vendors", vendorId);
        try {
            const operatingHoursArray = hoursText.split('\n').filter(line => line.trim() !== '');

            const dataToUpdate = {
                ...vendor,
                operatingHours: operatingHoursArray,
                searchableTags: vendor.types?.map(t => t.toLowerCase()) ?? [],
                updatedAt: serverTimestamp(),
            };

            await updateDoc(vendorRef, dataToUpdate as { [x: string]: any; });
            
            const updatedVendorState = { ...initialVendor, ...vendor, operatingHours: operatingHoursArray };
            setInitialVendor(updatedVendorState);
            setVendor(updatedVendorState);


            if (user) {
                logActivity(db, user.uid, 'vendor_profile_update', { fieldsUpdated: Object.keys(dataToUpdate) });
            }

            toast({ title: "Profile Saved", description: "Your business information has been updated." });
        } catch (error) {
            console.error("Error updating vendor profile:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ title: "Save Failed", description: errorMessage, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleTagInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value), []);

    const handleLogoUpload = (url: string) => {
        setVendor(prev => ({ ...prev, logoUrl: url }));
    };

    const handleAddPhotoFromUrl = () => {
        if (photoUrlInput) {
            setVendor(prev => ({ ...prev, photos: [...(prev.photos || []), photoUrlInput] }));
            setPhotoUrlInput("");
        }
    };
    
    const handlePhotoUpload = (url: string) => {
        setVendor(prev => ({ ...prev, photos: [...(prev.photos || []), url] }));
    };
    
    const handleRemovePhoto = (urlToRemove: string) => {
        setVendor(prev => ({...prev, photos: prev.photos?.filter(url => url !== urlToRemove)}));
    };

    const handleMovePhoto = (index: number, direction: 'left' | 'right') => {
        setVendor(prev => {
            if (!prev.photos) return prev;

            const newPhotos = [...prev.photos];
            const targetIndex = direction === 'left' ? index - 1 : index + 1;

            if (targetIndex >= 0 && targetIndex < newPhotos.length) {
                const temp = newPhotos[index];
                newPhotos[index] = newPhotos[targetIndex];
                newPhotos[targetIndex] = temp;
            }
            
            return {...prev, photos: newPhotos };
        })
    };

    const isChanged = JSON.stringify(vendor) !== JSON.stringify(initialVendor);
    
    const uploadedPhotoCount = useMemo(() => {
        return vendor.photos?.filter(url => typeof url === 'string' && url.includes("firebasestorage.googleapis.com")).length || 0;
    }, [vendor.photos]);

    const isUploadLimitReached = uploadedPhotoCount >= 3;

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }
    
    const logoUrl = getLogoUrl(vendor);
    const logoUrlForInput = vendor.logoUrl || "";

    return (
        <div className="w-full space-y-8 relative">
            <Card>
                <CardHeader>
                    <CardTitle>Business Details</CardTitle>
                    <CardDescription>This is the core information that customers will see first.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                        <div className="flex-shrink-0">
                            <Image 
                                unoptimized
                                src={logoUrl}
                                alt="Logo" 
                                width={128} 
                                height={128} 
                                className="rounded-lg border object-cover"
                                data-ai-hint={logoUrl !== PlaceholderImages['vendor-logo-placeholder'].imageUrl ? "vendor logo" : "logo placeholder"}
                            />
                        </div>
                        <div className="space-y-4 flex-1 w-full">
                            <div className="space-y-2">
                                <Label htmlFor="name">Business Name</Label>
                                <Input id="name" name="name" value={vendor.name || ""} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="logoUrl">Logo URL</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="logoUrl" name="logoUrl" placeholder="https://example.com/logo.png" value={logoUrlForInput || ""} onChange={handleInputChange} />
                                    <ImageUploader onUploadComplete={handleLogoUpload} storagePath="vendor-logos" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" value={vendor.description || ""} onChange={handleInputChange} rows={4} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tags">Types (from Google)</Label>
                        <Input 
                            id="tags"
                            placeholder="Add relevant types and press Enter (e.g., coffee, wifi, pet-friendly)"
                            value={tagInput}
                            onChange={handleTagInputChange}
                            onKeyDown={handleAddTag}
                        />
                        <div className="flex flex-wrap gap-2 pt-2">
                            {vendor.types?.map(type => (
                                <Badge key={type} variant="secondary" className="pl-2 capitalize rounded-sm">
                                    {type.replace(/_/g, ' ')}
                                    <button onClick={() => handleRemoveTag(type)} className="ml-1.5 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive">
                                        <span className="sr-only">Remove {type}</span>
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Contact & Location</CardTitle>
                    <CardDescription>How customers can reach you and find your business.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" name="phone" type="tel" value={vendor.phone || ""} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Public Email</Label>
                            <Input id="email" name="email" type="email" value={user?.email || ""} disabled />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input id="website" name="website" type="url" placeholder="https://your-business.com" value={vendor.website || ""} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Full Address</Label>
                        <Input id="address" name="address" placeholder="e.g., 123 Orchard Road, #04-56, Singapore 238879" value={vendor.address || ""} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>Country / Region</Label>
                        <Combobox
                            options={countryOptions}
                            value={vendor.region || ''}
                            onChange={handleCountryChange}
                            searchPlaceholder="Search countries..."
                            noResultsMessage="No country found."
                            placeholder="Select Country"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Business Hours</CardTitle>
                    <CardDescription>Let customers know when you're open. Enter one entry per line (e.g., "Monday: 9 AM - 6 PM").</CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea
                        value={hoursText}
                        onChange={handleHoursChange}
                        rows={7}
                        placeholder={"Monday: 9:00 AM - 6:00 PM\nTuesday: 9:00 AM - 6:00 PM\nWednesday: Closed\n..."}
                    />
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Photo Gallery</CardTitle>
                    <CardDescription>Manage your business photos. The first image is used as a fallback logo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {vendor.photos && vendor.photos.length > 0 ? (
                        <Carousel className="w-full">
                            <CarouselContent>
                                {vendor.photos.map((photo, index) => {
                                    let photoUrl: string | null = null;
                                    if(typeof photo === 'string') {
                                        photoUrl = photo;
                                    } else if (typeof photo === 'object' && photo !== null && 'photo_reference' in photo) {
                                        // cannot render on client
                                    }
                                    if (!photoUrl) return null;

                                    return (
                                        <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                                            <div className="p-1">
                                                <Card>
                                                    <CardContent className="flex aspect-video items-center justify-center p-0 rounded-lg overflow-hidden">
                                                        <Image src={photoUrl} alt={`Vendor photo ${index + 1}`} width={400} height={300} className="object-cover w-full h-full" />
                                                    </CardContent>
                                                </Card>
                                                <div className="mt-2 flex items-center justify-center gap-2">
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => handleMovePhoto(index, 'left')}
                                                        disabled={index === 0}
                                                        className="h-8"
                                                    >
                                                        <ArrowLeft className="h-4 w-4 mr-1"/>
                                                        Shift
                                                    </Button>
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => handleRemovePhoto(photoUrl!)}
                                                    >
                                                        Delete Image
                                                    </Button>
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        className="h-8"
                                                        onClick={() => handleMovePhoto(index, 'right')}
                                                        disabled={index === (vendor.photos?.length ?? 0) - 1}
                                                    >
                                                        Shift
                                                        <ArrowRight className="h-4 w-4 ml-1"/>
                                                    </Button>
                                                </div>
                                            </div>
                                        </CarouselItem>
                                    )
                                })}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                        </Carousel>
                    ) : (
                        <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
                            No photos uploaded yet.
                        </div>
                    )}
                    <Separator/>
                     <div className="space-y-2 pt-4">
                        <Label htmlFor="photoUrl">Add Photo by URL</Label>
                        <div className="flex items-center gap-2">
                             <Input 
                                id="photoUrl" 
                                placeholder="https://example.com/photo.jpg" 
                                value={photoUrlInput}
                                onChange={(e) => setPhotoUrlInput(e.target.value)}
                             />
                             <Button onClick={handleAddPhotoFromUrl} disabled={!photoUrlInput}>Add URL</Button>
                             <ImageUploader onUploadComplete={handlePhotoUpload} storagePath="vendor-photos" disabled={isUploadLimitReached} />
                        </div>
                         {isUploadLimitReached && (
                            <p className="text-sm text-destructive font-medium">You have reached the 3-photo upload limit.</p>
                         )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Advanced Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <Label htmlFor="sync-lock" className="font-semibold">Lock Google Sync</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Prevents automatic updates from Google Places to preserve your manual edits.
                            </p>
                        </div>
                        <Switch
                            id="sync-lock"
                            checked={vendor.googleSyncLocked || false}
                            onCheckedChange={(checked) => setVendor(prev => ({...prev, googleSyncLocked: checked}))}
                        />
                     </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                     <Button onClick={onPublicViewClick} variant="outline" className="w-full">
                        <Eye className="mr-2" />
                        View Public Page
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving || !isChanged} size="lg" className="w-full">
                        {isSaving ? <Loader2 className="mr-2 animate-spin" /> : null}
                        Save Changes
                    </Button>
                    {isChanged && <p className="text-xs text-center text-muted-foreground">You have unsaved changes.</p>}
                </CardContent>
            </Card>
        </div>
    );
}
