
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, ArrowLeft, ArrowRight } from 'lucide-react';
import type { Vendor, Category } from "@/lib/types";
import { ImageUploader } from '@/components/core/ImageUploader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { countries } from "@/lib/countries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';

interface VendorEditDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  vendorId?: string;
}

const getSafeDate = (dateInput: any): string => {
    if (!dateInput) return 'N/A';
    let date;
    if (dateInput.toDate) { // Firestore Timestamp
        date = dateInput.toDate();
    } else {
        date = new Date(dateInput);
    }
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    return format(date, "dd/MM/yyyy, HH:mm:ss");
};

export function VendorEditDialog({ isOpen, setIsOpen, vendorId }: VendorEditDialogProps) {
  const db = useFirestore();
  const { toast } = useToast();
  
  const vendorRef = useMemoFirebase(() => (vendorId && db ? doc(db, 'vendors', vendorId) : null), [vendorId, db]);
  const { data: liveVendor, isLoading: isVendorLoading } = useDoc<Vendor>(vendorRef);

  const [formData, setFormData] = useState<Partial<Vendor>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [photoUrlInput, setPhotoUrlInput] = useState('');

  const countryOptions: ComboboxOption[] = useMemo(() => countries.map(c => ({ value: c.value, label: c.label })), []);
  
  const subscriptionStatuses: Vendor['subscriptionStatus'][] = [
      "pending_verification", "trial", "free", "paid", "pay-as-you-go", "claimed_pending_approval", "suspended"
  ];

  useEffect(() => {
    if (liveVendor && isOpen) {
      setFormData({ ...liveVendor });
    }
  }, [liveVendor, isOpen]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleNumberInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? null : Number(value) }));
  }, []);

  const handleSwitchChange = (name: keyof Vendor, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleSelectChange = (name: keyof Vendor, value: string) => {
    setFormData(prev => ({...prev, [name]: value}));
  };

  const handleAddTag = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      const currentTags = formData.tags || [];
      if (!currentTags.map(t => t.toLowerCase()).includes(newTag.toLowerCase())) {
        setFormData(prev => ({ ...prev, tags: [...currentTags, newTag] }));
      }
      setTagInput('');
    }
  }, [tagInput, formData.tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags?.filter(tag => tag !== tagToRemove) }));
  }, []);
  
  const handleAddKeyword = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault();
      const newKeyword = keywordInput.trim();
      const currentKeywords = formData.matchedKeywords || [];
      if (!currentKeywords.map(k => k.toLowerCase()).includes(newKeyword.toLowerCase())) {
        setFormData(prev => ({ ...prev, matchedKeywords: [...currentKeywords, newKeyword] }));
      }
      setKeywordInput('');
    }
  }, [keywordInput, formData.matchedKeywords]);

  const handleRemoveKeyword = useCallback((keywordToRemove: string) => {
    setFormData(prev => ({ ...prev, matchedKeywords: prev.matchedKeywords?.filter(k => k !== keywordToRemove) }));
  }, []);

  const handleLogoUpload = (url: string) => {
    setFormData(prev => ({ ...prev, logoUrl: url }));
  };

  const handleAddPhotoFromUrl = () => {
    if (photoUrlInput) {
        setFormData(prev => ({ ...prev, photos: [...(prev.photos || []), photoUrlInput] }));
        setPhotoUrlInput("");
    }
  };

  const handlePhotoUpload = (url: string) => {
    setFormData(prev => ({ ...prev, photos: [...(prev.photos || []), url] }));
  };

  const handleRemovePhoto = (urlToRemove: string) => {
    setFormData(prev => ({ ...prev, photos: prev.photos?.filter(url => url !== urlToRemove) }));
  };

  const handleSave = async () => {
    if (!vendorId) return;
    setIsSaving(true);
    const docRef = doc(db, "vendors", vendorId);

    try {
      const dataToUpdate = {
        ...formData,
        searchableName: formData.name?.toLowerCase(),
        normalizedName: formData.name?.toLowerCase().replace(/[^a-z0-9\\s]/g, ' ').replace(/\\s+/g, ' ').trim(),
        searchableTags: formData.tags?.map(t => t.toLowerCase()),
        updatedAt: serverTimestamp(),
      };
      await updateDoc(docRef, dataToUpdate as any);
      toast({ title: "Vendor Updated", description: `${formData.name} has been successfully updated.`, variant: "success" });
      setIsOpen(false);
    } catch (error: any) {
      toast({ title: "Error updating vendor", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Vendor: {liveVendor?.name}</DialogTitle>
          <DialogDescription>Modify the details of this vendor profile below. Changes are saved directly to the live database.</DialogDescription>
        </DialogHeader>
        
        {isVendorLoading ? (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        ) : (
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-6 py-4">
              
              <Card>
                <CardHeader><CardTitle>Core Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>ID</Label><Input value={formData.id || ''} disabled className="font-mono text-xs"/></div>
                  <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" value={formData.name || ''} onChange={handleInputChange} /></div>
                  <div className="space-y-2"><Label>Normalized Name</Label><Input value={formData.normalizedName || ''} disabled className="font-mono text-xs"/></div>
                  <div className="space-y-2"><Label htmlFor="categoryId">Category ID</Label><Input id="categoryId" name="categoryId" value={formData.categoryId || ''} onChange={handleInputChange} /></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Location & Contact</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="address">Address</Label><Input id="address" name="address" value={formData.address || ''} onChange={handleInputChange} /></div>
                  <div className="space-y-2"><Label htmlFor="region">Region</Label><Input id="region" name="region" value={formData.region || ''} onChange={handleInputChange} /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2"><Label htmlFor="lat">Latitude</Label><Input id="lat" name="lat" type="number" value={formData.lat ?? ''} onChange={handleNumberInputChange} /></div>
                     <div className="space-y-2"><Label htmlFor="lng">Longitude</Label><Input id="lng" name="lng" type="number" value={formData.lng ?? ''} onChange={handleNumberInputChange} /></div>
                  </div>
                  <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" value={formData.phone || ''} onChange={handleInputChange} /></div>
                  <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" value={formData.email || ''} onChange={handleInputChange} /></div>
                  <div className="space-y-2"><Label htmlFor="website">Website</Label><Input id="website" name="website" value={formData.website || ''} onChange={handleInputChange} /></div>
                </CardContent>
              </Card>

              <Card>
                  <CardHeader><CardTitle>Ratings & Sync</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                      <div className="space-y-2"><Label>Google Place ID</Label><Input value={formData.googlePlaceId || 'N/A'} disabled /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Google Rating</Label><Input type="number" value={formData.googleRating || 0} onChange={handleNumberInputChange} name="googleRating" disabled /></div>
                        <div className="space-y-2"><Label>Google Reviews</Label><Input type="number" value={formData.googleReviewCount || 0} onChange={handleNumberInputChange} name="googleReviewCount" disabled /></div>
                      </div>
                      <div className="space-y-2"><Label>Last Google Sync</Label><Input value={getSafeDate(formData.googleLastSyncedAt)} disabled /></div>
                  </CardContent>
              </Card>
              
              <Card>
                <CardHeader><CardTitle>Details & Metadata</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="tags">Tags</Label>
                        <Input id="tags" placeholder="Add a tag and press Enter" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleAddTag} />
                        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-sm text-muted-foreground">
                        {(formData.tags || []).map(tag => (
                            <div key={tag} className="flex items-center gap-1.5">
                               <span>{tag}</span>
                               <button onClick={() => handleRemoveTag(tag)} className="text-destructive/70 hover:text-destructive"><X className="h-3 w-3" /></button>
                            </div>
                        ))}
                        </div>
                    </div>
                    <div className="space-y-2"><Label>Google Types</Label><Textarea value={formData.types?.join(', ') || 'N/A'} disabled rows={2}/></div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="matchedKeywords">Matched Keywords</Label>
                        <Input id="matchedKeywords" placeholder="Add a keyword and press Enter" value={keywordInput} onChange={e => setKeywordInput(e.target.value)} onKeyDown={handleAddKeyword} />
                        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-sm text-muted-foreground">
                        {(formData.matchedKeywords || []).map(keyword => (
                            <div key={keyword} className="flex items-center gap-1.5">
                               <span>{keyword}</span>
                               <button onClick={() => handleRemoveKeyword(keyword)} className="text-destructive/70 hover:text-destructive"><X className="h-3 w-3" /></button>
                            </div>
                        ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Subscription Status</Label>
                        <Select onValueChange={(v) => handleSelectChange('subscriptionStatus', v)} value={formData.subscriptionStatus}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                {subscriptionStatuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Created At</Label><Input value={getSafeDate(formData.createdAt)} disabled /></div>
                        <div className="space-y-2"><Label>Updated At</Label><Input value={getSafeDate(formData.updatedAt)} disabled /></div>
                    </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Denormalized Data</CardTitle><CardDescription>This data is nested within the document and is managed elsewhere.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Photos</Label><Textarea value={formData.photos?.join('\\n') || 'No photos available.'} disabled rows={4} className="font-mono text-xs"/></div>
                    <div className="space-y-2"><Label>Offerings</Label><Textarea value={formData.offerings && formData.offerings.length > 0 ? `${formData.offerings.length} offering(s) stored.` : 'No offerings available.'} disabled rows={1}/></div>
                    <div className="space-y-2"><Label>Promotions</Label><Textarea value={formData.promotions && formData.promotions.length > 0 ? `${formData.promotions.length} promotion(s) stored.` : 'No promotions available.'} disabled rows={1}/></div>
                    <div className="space-y-2"><Label>Reviews</Label><Textarea value={formData.reviews && formData.reviews.length > 0 ? `${formData.reviews.length} review(s) stored.` : 'No reviews available.'} disabled rows={1}/></div>
                </CardContent>
              </Card>

            </div>
          </ScrollArea>
        )}
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || isVendorLoading}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
