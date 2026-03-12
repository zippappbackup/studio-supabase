"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void;
  storagePath: string; // e.g., 'vendor-logos' or 'promotion-images'
  disabled?: boolean;
  maxSizeMb?: number;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export function ImageUploader({ onUploadComplete, storagePath, disabled = false, maxSizeMb = 2 }: ImageUploaderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ title: "Invalid File Type", description: "Please upload a JPG, PNG, GIF, or WebP image.", variant: "destructive" });
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      toast({ title: "File Too Large", description: `Image must be smaller than ${maxSizeMb}MB.`, variant: "destructive" });
      return;
    }
    
    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to upload files.", variant: "destructive" });
      return;
    }
    
    setIsUploading(true);
    toast({ title: "Uploading...", description: "Your image is being uploaded securely.", variant: "info" });
    
    try {
        // Sanitize filename and create a unique path
        const fileExt = file.name.split('.').pop();
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const fileName = `${user.uid}/${storagePath}/${Date.now()}-${sanitizedFileName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('uploads')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('uploads')
            .getPublicUrl(fileName);
        
        if (urlData.publicUrl) {
            onUploadComplete(urlData.publicUrl);
            toast({ title: "Upload Successful", description: "Image has been added.", variant: "success" });
        } else {
            throw new Error("Failed to get public URL for uploaded image.");
        }

    } catch (error: any) {
        console.error("Upload Error:", error);
        toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
        setIsUploading(false);
    }
  };

  const uploaderId = `file-upload-${storagePath.replace('/', '-')}`;

  return (
    <Button
        asChild
        variant="outline"
        size="icon"
        disabled={isUploading || disabled}
        className="cursor-pointer"
    >
        <label htmlFor={uploaderId}>
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span className="sr-only">Upload Image</span>
            <Input
                id={uploaderId}
                type="file"
                onChange={handleFileChange}
                disabled={isUploading || disabled}
                className="hidden"
                accept={ALLOWED_TYPES.join(',')}
            />
        </label>
    </Button>
  );
}
