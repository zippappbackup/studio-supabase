"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
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
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const base64File = reader.result as string;
        uploadFile(base64File, file.name);
    };
    reader.onerror = (error) => {
        console.error("FileReader error: ", error);
        toast({ title: "File Read Error", description: "Could not read the selected file.", variant: "destructive" });
    };
  };

  const uploadFile = async (base64File: string, fileName: string) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to upload files.", variant: "destructive" });
      return;
    }
    
    setIsUploading(true);
    toast({ title: "Uploading...", description: "Your image is being uploaded securely.", variant: "info" });
    
    try {
        const functions = getFunctions();
        const uploadImage = httpsCallable(functions, 'uploadImage');
        
        // Sanitize filename and create a unique path
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const fullPath = `uploads/${user.uid}/${storagePath}/${new Date().getTime()}-${sanitizedFileName}`;

        const result: any = await uploadImage({ file: base64File, path: fullPath });
        
        if (result.data.success && result.data.url) {
            onUploadComplete(result.data.url);
            toast({ title: "Upload Successful", description: "Image has been added.", variant: "success" });
        } else {
            throw new Error(result.data.error || "Upload failed for an unknown reason.");
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
