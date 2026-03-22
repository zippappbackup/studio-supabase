"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CalendarIcon } from "lucide-react";
import type { Promotion } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageUploader } from "@/components/core/ImageUploader";

const promotionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  description: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  startAt: z.date({ required_error: "Start date is required." }),
  endAt: z.date({ required_error: "End date is required." }),
  terms: z.string().optional(),
  quota: z.coerce.number().int().positive().optional(),
}).refine(data => data.endAt > data.startAt, {
    message: "End date must be after the start date.",
    path: ["endAt"],
});

type PromotionFormData = z.infer<typeof promotionSchema>;

interface PromotionEditDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  promotion?: Promotion;
  onSaved?: () => void;
}

export function PromotionEditDialog({ isOpen, setIsOpen, promotion, onSaved }: PromotionEditDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm<PromotionFormData>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {}
  });

  const imageUrl = watch("imageUrl");
  const isEditing = !!promotion;

  useEffect(() => {
    if (isOpen) {
      if (promotion) {
        reset({
          ...promotion,
          startAt: new Date(promotion.startAt),
          endAt: new Date(promotion.endAt),
        });
      } else {
        reset({
          title: "",
          description: "",
          imageUrl: "",
          startAt: new Date(),
          endAt: new Date(new Date().setDate(new Date().getDate() + 30)),
          terms: "",
          quota: undefined,
        });
      }
    }
  }, [promotion, isOpen, reset]);

  const onSubmit = async (data: PromotionFormData) => {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
        return;
    }
    const vendorId = (user as any).vendor_id || user.vendorId || user.uid;
    setIsLoading(true);
    
    const finalData: Omit<Promotion, 'redemptionType'> & { redemptionType?: string } = {
        ...data,
        id: promotion?.id || uuidv4(),
        vendorId: vendorId,
        createdBy: user.uid,
        updatedAt: new Date(),
        createdAt: promotion?.createdAt || new Date(),
    };
    if (!finalData.redemptionType) {
        finalData.redemptionType = "in-store";
    }

    try {
        // Fetch current vendor data to get existing promotions
        const { data: currentVendor, error: fetchError } = await supabase
            .from('vendors')
            .select('promotions')
            .eq('vendor_id', vendorId)
            .single();
        
        if (fetchError) throw fetchError;

        let updatedPromotions: Promotion[];
        
        if (isEditing) {
            // Remove old promotion and add updated one
            const existingPromotions = currentVendor.promotions || [];
            const filteredPromotions = existingPromotions.filter((p: Promotion) => p.id !== promotion!.id);
            updatedPromotions = [...filteredPromotions, finalData];
        } else {
            // Add new promotion to array
            updatedPromotions = [...(currentVendor.promotions || []), finalData];
        }

        // Update vendor with new promotions array
        const { error: updateError } = await supabase
            .from('vendors')
            .update({ promotions: updatedPromotions })
            .eq('vendor_id', vendorId);
        
        if (updateError) throw updateError;
        
        toast({ title: promotion ? "Promotion Updated" : "Promotion Created", description: `"${data.title}" has been saved.`, variant: "success" });
        onSaved?.();
        setIsOpen(false);
    } catch(e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleImageUpload = (url: string) => {
    setValue("imageUrl", url, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl p-0 flex flex-col h-[90vh]">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="text-2xl font-bold">{promotion ? "Edit Promotion" : "Create New Promotion"}</DialogTitle>
          <DialogDescription>Fill in the details for your new promotion below.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" {...register("title")} />
                      {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" {...register("description")} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                      <div className="flex items-center gap-2">
                        <Input id="imageUrl" {...register("imageUrl")} placeholder="https://example.com/image.png"/>
                        <ImageUploader onUploadComplete={handleImageUpload} storagePath="promotion-images" maxSizeMb={3} />
                      </div>
                      {errors.imageUrl && <p className="text-sm text-destructive">{errors.imageUrl.message}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Controller
                          name="startAt"
                          control={control}
                          render={({ field }) => (
                              <div className="space-y-2">
                                  <Label>Start Date</Label>
                                  <Popover>
                                      <PopoverTrigger asChild>
                                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                      </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                  </Popover>
                                  {errors.startAt && <p className="text-sm text-destructive">{errors.startAt.message}</p>}
                              </div>
                          )}
                      />
                      <Controller
                          name="endAt"
                          control={control}
                          render={({ field }) => (
                              <div className="space-y-2">
                                  <Label>End Date</Label>
                                  <Popover>
                                      <PopoverTrigger asChild>
                                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                      </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                  </Popover>
                                  {errors.endAt && <p className="text-sm text-destructive">{errors.endAt.message}</p>}
                              </div>
                          )}
                      />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="terms">Terms & Conditions</Label>
                      <Textarea id="terms" {...register("terms")} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="quota">Max Redemptions (Optional)</Label>
                      <Input id="quota" type="number" {...register("quota")} />
                  </div>
              </CardContent>
            </Card>

             <DialogFooter className="pt-4 !justify-end">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                  Save Promotion
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
