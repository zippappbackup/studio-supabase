
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import Logo from '@/components/core/Logo';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function ContactPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pathname = usePathname();
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/partners", label: "Partners" },
    { href: "/signup", label: "Sign Up" },
    { href: "/contact", label: "Contact" },
  ];


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) {
      toast({ title: 'Error', description: 'Database connection not available.', variant: 'destructive' });
      return;
    }
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({ title: 'Missing Fields', description: 'Please fill out all fields.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const feedbackCollection = collection(db, 'feedback');
      await addDoc(feedbackCollection, {
        ...formData,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Feedback Sent!', description: "Thank you for your message. We'll get back to you soon.", variant: 'success' });
      setFormData({ name: '', email: '', subject: '', message: '' }); // Clear form
    } catch (error: any) {
      toast({ title: 'Submission Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      <section className="space-y-4 text-center">
        <h1 className="text-3xl font-bold leading-tight tracking-tighter">
          Get In Touch With Us
        </h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Have a question, feedback, or need support? We're here to help. Reach out to us through the form below.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
        {/* Contact Form */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Send Us a Message</CardTitle>
              <CardDescription>We'll get back to you as soon as possible.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input id="name" placeholder="John Doe" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Your Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="e.g., Feedback about a vendor" value={formData.subject} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Your Message</Label>
                  <Textarea id="message" placeholder="Type your message here..." rows={6} value={formData.message} onChange={handleInputChange} required />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="pb-4">
            <Separator style={{ backgroundColor: 'hsl(212, 71%, 85.3%)' }} />
        </div>
       <section className="space-y-4">
        <h2 className="text-2xl font-bold text-center">Check out Zipp on our Social Media</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-center">Follow us to see what our community is saying, get the latest updates on new features, and stay connected with the Zipp team!</p>
        <div className="flex justify-center gap-6 pt-2">
          <Link href="https://www.facebook.com/share/1Ah9cGwFNy/" target="_blank" rel="noopener noreferrer" className="bg-black rounded-md p-1.5">
            <Image
              src="/icons/facebook.svg"
              alt="Facebook"
              width={28}
              height={28}
              className="h-7 w-7 filter invert"
            />
          </Link>
          <Link href="https://www.tiktok.com/@zippsg?_r=1&_t=ZS-92uxz5bHYVY" target="_blank" rel="noopener noreferrer" className="bg-black rounded-md p-1.5">
            <Image
              src="/icons/tiktok.svg"
              alt="TikTok"
              width={28}
              height={28}
              className="h-7 w-7 filter invert"
            />
          </Link>
        </div>
      </section>
    </div>
  );
}
