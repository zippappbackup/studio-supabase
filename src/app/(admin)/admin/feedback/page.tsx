'use client';

import { useState, useMemo } from 'react';
import { useSupabaseCollection } from '@/lib/supabase/hooks';
import { supabase } from '@/lib/supabase/client';
import type { Feedback } from '@/lib/types';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Inbox } from 'lucide-react';
import { FeedbackActions } from './FeedbackActions';
import { FeedbackSummaryDialog } from './FeedbackSummaryDialog';

export default function FeedbackPage() {
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const feedbackQuery = useMemo(
    () => () => supabase.from('feedback').select('*').order('created_at', { ascending: false }),
    [refreshKey]
  );
  const { data: feedbackItems, isLoading } = useSupabaseCollection<Feedback>(feedbackQuery);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const handleViewSummary = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setIsSummaryOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Feedback</h1>
          <p className="text-muted-foreground">Messages and feedback submitted through the contact form.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Feedback Inbox</CardTitle>
            <CardDescription>A list of all feedback received from users.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right w-[50px]"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading feedback...
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && feedbackItems?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Inbox className="h-8 w-8" />
                        <span>No feedback messages yet.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && feedbackItems?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {(item.createdAt || (item as any).created_at) && format(new Date((item as any).created_at || item.createdAt), "dd MMM yyyy, hh:mm a")}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.subject}</TableCell>
                    <TableCell className="text-right">
                      <FeedbackActions 
                        feedback={item} 
                        onViewSummary={() => handleViewSummary(item)}
                        onAction={() => setRefreshKey(k => k + 1)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <FeedbackSummaryDialog
        isOpen={isSummaryOpen}
        setIsOpen={setIsSummaryOpen}
        feedback={selectedFeedback}
      />
    </>
  );
}
