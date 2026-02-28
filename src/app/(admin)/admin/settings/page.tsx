
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useToast } from "@/hooks/use-toast";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Loader2, Info, BrainCircuit } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ALL_USER_ACTIVITY_TYPES, ALL_VENDOR_ACTIVITY_TYPES, type AdminConfig, type ActivityLogConfig, type ActivityType } from "@/lib/types";
import { Separator } from "@/components/ui/separator";


export default function SettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const configRef = useMemoFirebase(() => db ? doc(db, "adminConfig", "global") : null, [db]);
  const { data: configData, isLoading: isConfigLoading } = useDoc<AdminConfig>(configRef);
  
  const [apiKeySecret, setApiKeySecret] = useState("");
  const [stripeSecret, setStripeSecret] = useState("");
  const [googleTtl, setGoogleTtl] = useState(30);
  const [serperTtl, setSerperTtl] = useState(14);
  const [activityLogConfig, setActivityLogConfig] = useState<ActivityLogConfig>({});
  
  const [isSavingApi, setIsSavingApi] = useState(false);
  const [isSavingTtl, setIsSavingTtl] = useState(false);
  const [isSavingLogs, setIsSavingLogs] = useState(false);
  
  useEffect(() => {
    if (configData) {
      setApiKeySecret(configData.googlePlacesApiKeyName || "GOOGLE_PLACES_API_KEY");
      setStripeSecret(configData.stripeSecretKeyName || "STRIPE_SECRET_KEY");
      if (configData.cacheTTLs) {
        setGoogleTtl(configData.cacheTTLs.googlePlacesDays || 30);
        setSerperTtl(configData.cacheTTLs.serperDays || 14);
      }
      setActivityLogConfig(configData.activityLogConfig || {});
    }
  }, [configData]);

  const handleApiSave = async () => {
    if (!db) return;
    setIsSavingApi(true);
    const dataToSave = {
        googlePlacesApiKeyName: apiKeySecret,
        stripeSecretKeyName: stripeSecret,
        updatedAt: serverTimestamp(),
    };
    
    const globalConfigRef = doc(db, "adminConfig", "global");
    setDocumentNonBlocking(globalConfigRef, dataToSave, { merge: true });
    toast({ title: "API Settings Saved", description: "Secret names have been updated.", variant: "success" });
    setIsSavingApi(false);
  };
  
  const handleTtlSave = async () => {
    if (!db) return;
    setIsSavingTtl(true);
    const dataToSave = {
        cacheTTLs: {
            googlePlacesDays: Number(googleTtl),
            serperDays: Number(serperTtl),
        },
        updatedAt: serverTimestamp(),
    };
     
    const globalConfigRef = doc(db, "adminConfig", "global");
    setDocumentNonBlocking(globalConfigRef, dataToSave, { merge: true });
    toast({ title: "Cache TTLs Saved", description: "Cache durations have been updated.", variant: "success" });
    setIsSavingTtl(false);
  };

  const handleLogToggle = (activity: ActivityType, checked: boolean) => {
    setActivityLogConfig(prev => ({ ...prev, [activity]: checked }));
  };

  const handleLogSave = async () => {
    if (!db) return;
    setIsSavingLogs(true);
    const dataToSave = { activityLogConfig, updatedAt: serverTimestamp() };
    const globalConfigRef = doc(db, "adminConfig", "global");
    setDocumentNonBlocking(globalConfigRef, dataToSave, { merge: true });
    toast({ title: "Activity Log Settings Saved", description: "Your logging preferences have been updated.", variant: "success" });
    setIsSavingLogs(false);
  };

  const handleApiKeySecretChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setApiKeySecret(e.target.value), []);
  const handleStripeSecretChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setStripeSecret(e.target.value), []);
  const handleGoogleTtlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setGoogleTtl(Number(e.target.value)), []);
  const handleSerperTtlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSerperTtl(Number(e.target.value)), []);

  if (isConfigLoading) {
      return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Global Settings</h1>
        <p className="text-muted-foreground">Manage system-wide configurations and API integrations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log Settings</CardTitle>
          <CardDescription>
            Control which user and vendor activities are logged to Firestore to manage database writes and costs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">User Activity Logs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {ALL_USER_ACTIVITY_TYPES.map(activity => (
                  <div key={activity} className="flex items-center justify-between">
                    <Label htmlFor={`log-${activity}`} className="capitalize font-normal text-sm">{activity.replace(/_/g, " ")}</Label>
                    <Switch
                      id={`log-${activity}`}
                      checked={!!activityLogConfig[activity]}
                      onCheckedChange={(checked) => handleLogToggle(activity, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator style={{ backgroundColor: '#d6eafa' }} className="my-6"/>

            <div>
              <h3 className="text-lg font-semibold mb-3">Vendor Activity Logs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {ALL_VENDOR_ACTIVITY_TYPES.map(activity => (
                  <div key={activity} className="flex items-center justify-between">
                    <Label htmlFor={`log-${activity}`} className="capitalize font-normal text-sm">{activity.replace(/_/g, " ")}</Label>
                    <Switch
                      id={`log-${activity}`}
                      checked={!!activityLogConfig[activity]}
                      onCheckedChange={(checked) => handleLogToggle(activity, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleLogSave} disabled={isSavingLogs}>
                  {isSavingLogs && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                  Save Log Settings
              </Button>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Keys & Secrets</CardTitle>
          <CardDescription>
            Configure the names of secrets stored in Google Secret Manager. These values are references, not the keys themselves.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="googlePlacesApiKey">Google Places API Key Secret</Label>
              <Input id="googlePlacesApiKey" value={apiKeySecret} onChange={handleApiKeySecretChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripeSecretKey">Stripe Secret Key Secret</Label>
              <Input id="stripeSecretKey" value={stripeSecret} onChange={handleStripeSecretChange} />
            </div>
            <Button onClick={handleApiSave} disabled={isSavingApi}>
                {isSavingApi && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Save API Settings
            </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Cache TTLs</CardTitle>
          <CardDescription>
            Set the Time-to-Live (in days) for cached API responses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="googleTtl">Google Places Cache (days)</Label>
              <Input id="googleTtl" type="number" value={googleTtl} onChange={handleGoogleTtlChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serperTtl">Serper.dev Cache (days)</Label>
              <Input id="serperTtl" type="number" value={serperTtl} onChange={handleSerperTtlChange} />
            </div>
            <Button onClick={handleTtlSave} disabled={isSavingTtl}>
                {isSavingTtl && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Save TTLs
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
