"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { useSupabaseDoc } from '@/lib/supabase/hooks';
import { supabase } from '@/lib/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, HardHat } from "lucide-react";
import type { Offering, Category, Vendor } from "@/lib/types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { logActivity } from "@/lib/activity-logger";
import { v4 as uuidv4 } from "uuid";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ImageUploader } from "@/components/core/ImageUploader";

const countryCurrencyMap: { [key: string]: string } = {
  SG: "SGD", MY: "MYR", AU: "AUD", US: "USD", GB: "GBP",
};

export function OfferingEditDialog({ isOpen, setIsOpen, offering, onSaved }: { isOpen: boolean; setIsOpen: (isOpen: boolean) => void; offering?: Offering; onSaved?: () => void; }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [offeringData, setOfferingData] = useState<Partial<Offering>>({});
  const [initialOfferingData, setInitialOfferingData] = useState<Partial<Offering>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  
  const vendorId = user?.vendorId || user?.uid;
  
  const vendorQuery = useMemo(
    () => vendorId ? () => supabase.from('vendors').select('*').eq('vendor_id', vendorId).single() : () => null,
    [vendorId]
  );
  const { data: vendor } = useSupabaseDoc<Vendor>(vendorQuery);

  const categoryQuery = useMemo(
    () => vendor?.categoryId ? () => supabase.from('categories').select('*').eq('id', vendor.categoryId).single() : () => null,
    [vendor?.categoryId]
  );
  const { data: category } = useSupabaseDoc<Category>(categoryQuery);

  useEffect(() => {
    if (isOpen) {
      const defaultCurrency = vendor?.region ? countryCurrencyMap[vendor.region] || "USD" : "USD";
      
      const initialState = offering ? 
        { ...offering, currency: offering.currency || defaultCurrency } :
        { id: uuidv4(), name: "", description: "", type: "product", isActive: true, price: 0, currency: defaultCurrency, pricingModel: "fixed", inStock: true, sku: "", images: [], customFields: {} };
      
      setOfferingData(initialState);
      setInitialOfferingData(initialState);
      setIsChanged(false);
    }
  }, [offering, isOpen, vendor]);

  useEffect(() => {
    const hasChanged = JSON.stringify(offeringData) !== JSON.stringify(initialOfferingData);
    setIsChanged(hasChanged);
  }, [offeringData, initialOfferingData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const finalValue = type === 'number' ? parseFloat(value) : value;
    setOfferingData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSwitchChange = (name: keyof Offering, checked: boolean) => {
    setOfferingData(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleSelectChange = (name: keyof Offering, value: string) => {
      setOfferingData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCustomFieldChange = (key: string, value: any) => {
      setOfferingData(prev => ({
          ...prev,
          customFields: {
              ...(prev.customFields || {}),
              [key]: value,
          }
      }))
  };

  const handleSave = async () => {
    if (!offeringData.name || offeringData.name.trim() === "") {
        toast({ title: "Validation Error", description: "Offering name is required.", variant: "destructive" });
        return;
    }
    if (offeringData.price === undefined || offeringData.price < 0) {
        toast({ title: "Validation Error", description: "Price must be a positive number.", variant: "destructive" });
        return;
    }

    if (!vendorId) {
        toast({ title: "Error", description: "Vendor ID not available.", variant: "destructive" });
        return;
    }
    setIsLoading(true);

    const isCreating = !offering;
    const timestamp = new Date().toISOString();
    
    const finalData = {
      ...offeringData,
      vendorId: vendorId,
      searchableName: offeringData.name?.toLowerCase(),
      updatedAt: timestamp, 
      createdAt: isCreating ? timestamp : offeringData.createdAt,
    } as Offering;
    
    try {
        // Fetch current vendor data to get existing offerings
        const { data: currentVendor, error: fetchError } = await supabase
            .from('vendors')
            .select('offerings')
            .eq('vendor_id', vendorId)
            .single();
        
        if (fetchError) throw fetchError;

        let updatedOfferings: Offering[];
        
        if (isCreating) {
            // Add new offering to array
            updatedOfferings = [...(currentVendor.offerings || []), finalData];
        } else {
            // Remove old offering and add updated one
            const existingOfferings = currentVendor.offerings || [];
            const filteredOfferings = existingOfferings.filter((o: Offering) => o.id !== offering.id);
            updatedOfferings = [...filteredOfferings, finalData];
        }

        // Update vendor with new offerings array
        const { error: updateError } = await supabase
            .from('vendors')
            .update({ offerings: updatedOfferings })
            .eq('vendor_id', vendorId);
        
        if (updateError) throw updateError;

      await logActivity(supabase, vendorId, isCreating ? 'offering_create' : 'offering_update', { offeringId: finalData.id, name: finalData.name });
      toast({ title: isCreating ? "Offering Created" : "Offering Updated", description: `"${finalData.name}" has been saved.` });
      onSaved?.();
      setInitialOfferingData(finalData);
      setIsOpen(false);
    } catch (e: any) {
        const errorMsg = e.message || "Failed to save offering.";
        toast({ title: "Error", description: errorMsg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const renderCustomFields = () => {
    if (!category?.fieldsSchema?.length) return null;
    return (
        <div className="space-y-4 pt-4">
            <Separator />
            <h3 className="text-sm font-medium text-muted-foreground pt-2">
                {category.name}-specific Fields
            </h3>
            <div className="space-y-4">
                {category.fieldsSchema.map((field) => {
                    const value = offeringData.customFields ? offeringData.customFields[field.key] : '';
                    switch (field.uiComponent) {
                        case "switch": return (
                            <div key={field.key} className="flex items-center justify-between rounded-lg border p-3">
                                <Label htmlFor={field.key}>{field.label}</Label>
                                <Switch id={field.key} checked={!!value} onCheckedChange={(checked) => handleCustomFieldChange(field.key, checked)} />
                            </div>
                        );
                        default: return (
                            <div key={field.key} className="space-y-2">
                                <Label htmlFor={field.key}>{field.label}</Label>
                                <Input id={field.key} value={value} onChange={(e) => handleCustomFieldChange(field.key, e.target.value)} type={field.type === "number" ? "number" : "text"} />
                            </div>
                        );
                    }
                })}
            </div>
        </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl p-0 flex flex-col h-[90vh]">
        <div className="p-6 pb-2 border-b">
            <DialogTitle className="text-2xl font-bold">
                {offering ? "Edit Offering" : "Create New Offering"}
            </DialogTitle>
        </div>
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 py-6">
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <ToggleGroup type="single" value={offeringData.type} onValueChange={(v) => v && handleSelectChange('type', v)} className="grid grid-cols-2">
                        <ToggleGroupItem value="product" aria-label="Product"><Package className="mr-2 h-4 w-4" />Product</ToggleGroupItem>
                        <ToggleGroupItem value="service" aria-label="Service"><HardHat className="mr-2 h-4 w-4" />Service</ToggleGroupItem>
                    </ToggleGroup>
                    <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" value={offeringData.name || ''} onChange={handleInputChange} /></div>
                    <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" value={offeringData.description || ''} onChange={handleInputChange} /></div>
                    
                    <Separator />
                    <h3 className="text-sm font-medium text-muted-foreground pt-2">Pricing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="price">Price</Label><Input id="price" name="price" type="number" step="0.01" value={offeringData.price || 0} onChange={handleInputChange} /></div>
                        <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Input id="currency" name="currency" value={offeringData.currency || ''} readOnly className="bg-muted/50" />
                        </div>
                        {offeringData.type === "service" && (
                            <div className="col-span-2 space-y-2">
                                <Label>Pricing Model</Label>
                                <Select onValueChange={(v) => handleSelectChange('pricingModel', v)} value={offeringData.pricingModel} defaultValue="fixed">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="fixed">Fixed Price</SelectItem><SelectItem value="per_hour">Per Hour</SelectItem><SelectItem value="per_unit">Per Unit</SelectItem></SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    {offeringData.type === "product" && (
                        <>
                            <Separator />
                            <h3 className="text-sm font-medium text-muted-foreground pt-2">Product Details</h3>
                            <div className="flex items-center justify-between rounded-lg border p-3"><Label htmlFor="inStock" className="flex flex-col space-y-1"><span>In Stock</span></Label><Switch id="inStock" checked={!!offeringData.inStock} onCheckedChange={(c) => handleSwitchChange('inStock', c)} /></div>
                            <div className="space-y-2"><Label htmlFor="sku">SKU (Optional)</Label><Input id="sku" name="sku" value={offeringData.sku || ''} onChange={handleInputChange} /></div>
                        </>
                    )}
                    {renderCustomFields()}
                    <Separator/>
                    <div className="flex items-center space-x-2 pt-2">
                        <Switch id="isActive" checked={!!offeringData.isActive} onCheckedChange={(c) => handleSwitchChange('isActive', c)} />
                        <Label htmlFor="isActive">Offering is active and available to customers</Label>
                    </div>
                </CardContent>
            </Card>
          </div>
        </ScrollArea>
         <DialogFooter className="p-6 border-t">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="button" onClick={handleSave} disabled={isLoading || !isChanged}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Offering
              </Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
