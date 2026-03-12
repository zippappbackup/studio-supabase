'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Feedback } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

interface FeedbackSummaryDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  feedback: Feedback | null;
}

const SummaryItem = ({ label, value }: { label: string; value: string | undefined }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-1 py-2.5 text-sm">
    <dt className="font-semibold text-muted-foreground md:col-span-1">{label}</dt>
    <dd className="md:col-span-3 break-words">{value || 'N/A'}</dd>
  </div>
);

export function FeedbackSummaryDialog({ isOpen, setIsOpen, feedback }: FeedbackSummaryDialogProps) {
  if (!feedback) return null;

  const formattedDate = feedback.createdAt
    ? format(new Date(feedback.createdAt), 'dd MMM yyyy, hh:mm a')
    : 'N/A';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Feedback from: {feedback.name}</DialogTitle>
          <DialogDescription>
            Subject: {feedback.subject}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <SummaryItem label="From" value={feedback.name} />
          <SummaryItem label="Email" value={feedback.email} />
          <SummaryItem label="Date" value={formattedDate} />
          <Separator />
          <div className="space-y-2">
            <h4 className="font-semibold">Message</h4>
            <div className="p-4 border rounded-md bg-muted/50 max-h-64 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{feedback.message}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
