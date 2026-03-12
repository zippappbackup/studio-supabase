'use client';

import type { Review } from "@/lib/types";
import { MoreVertical, Pencil, Star, Trash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ReviewItem({
  review,
  isCurrentUser,
  isDeleting,
  onEdit,
  onDelete,
}: {
  review: Review;
  isCurrentUser: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {

  const getSubmissionDate = (): Date | null => {
    // Google review time is in seconds since epoch
    if (review.time) {
      return new Date(review.time * 1000);
    }
    // Supabase/ISO timestamp
    if (review.createdAt) {
      const date = new Date(review.createdAt as any);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return null;
  }
      
  const submissionDate = getSubmissionDate();
  const displayName = review.userName || review.author_name || 'A Reviewer';
  
  const getInitials = (name?: string | null): string => {
    if (!name) return "U";
    const words = name.split(" ").filter(Boolean);
    if (words.length === 0) return "U";
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(displayName);
      
  return (
    <div className="py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarImage src={review.userAvatar} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3">
                <p className="font-semibold">{displayName}</p>
                {submissionDate && (
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(submissionDate, { addSuffix: true })}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
             <p className="mt-2 text-sm text-muted-foreground">{review.text}</p>
          </div>
        </div>
        {isCurrentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isDeleting}>
                <span className="sr-only">Open menu</span>
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onEdit} disabled={isDeleting}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} disabled={isDeleting}>
                 <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
