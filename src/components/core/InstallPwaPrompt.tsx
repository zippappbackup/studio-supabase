
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Define the interface for the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPwaPrompt() {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const { toast } = useToast();
  const pathname = usePathname();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setInstallPromptEvent(promptEvent);
      
      const allowedPaths = ['/home', '/vendor/dashboard'];

      // Only show the toast if the user is on one of the allowed pages.
      if (allowedPaths.includes(pathname)) {
        toast({
          title: "Install the Zipp Super App",
          description: "Get the full app experience on your device.",
          action: (
            <Button
              size="sm"
              onClick={() => handleInstallClick(promptEvent)}
            >
              Install Now
            </Button>
          ),
          duration: 20000, 
        });
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [toast, pathname]);

  const handleInstallClick = (promptEvent: BeforeInstallPromptEvent | null) => {
    if (!promptEvent) {
      return;
    }

    promptEvent.prompt();
    promptEvent.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setInstallPromptEvent(null);
    });
  };

  return null;
}
