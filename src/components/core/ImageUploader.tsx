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
  storagePath: string;
  disabled?: boolean;
  maxSizeMb?: number;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const COMPRESS_THRESHOLD_MB = 1;
const MAX_DIMENSION = 800;
const QUALITY = 0.7;

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressed = new File([blob], file.name, { type: "image/jpeg" });
            resolve(compressed);
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        QUALITY
      );
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
}

export function ImageUploader({ onUploadComplete, storagePath, disabled = false, maxSizeMb = 2 }: ImageUploaderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ title: "Invalid File Type", description: "Please upload a JPG, PNG, GIF, or WebP image.", variant: "destructive" });
      return;
    }

    // Silently compress if over 1MB
    let fileToUpload = file;
    if (file.size > COMPRESS_THRESHOLD_MB * 1024 * 1024) {
      fileToUpload = await compressImage(file);
    }

    uploadFile(fileToUpload);
  };

  const uploadFile = async (file: File) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to upload files.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    toast({ title: "Uploading...", description: "Your image is being uploaded securely.", variant: "info" });

    try {
      // Get session token for API auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      // Build form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('storagePath', storagePath);

      // Upload via API route to R2
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload failed');

      onUploadComplete(result.url);
      toast({ title: "Upload Successful", description: "Image has been added.", variant: "success" });

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
