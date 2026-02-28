
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useFirestore } from "@/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import type { ZippUser } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { countries } from "@/lib/countries";
import { logActivity } from "@/lib/activity-logger";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

interface UserProfileFormProps {
    onOpenPasswordDialog: () => void;
}

export default function UserProfileForm({ onOpenPasswordDialog }: UserProfileFormProps) {
    const { user: authUser } = useAuth();
    const db = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const [user, setUser] = useState<Partial<ZippUser>>({});
    const [initialUser, setInitialUser] = useState<Partial<ZippUser>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    
    const [initialDob, setInitialDob] = useState({ day: '', month: '', year: '' });
    const [gender, setGender] = useState<ZippUser['gender']>();
    const [initialGender, setInitialGender] = useState<ZippUser['gender']>();
    const [isChanged, setIsChanged] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (authUser?.uid && db) {
                const userRef = doc(db, "users", authUser.uid);
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                    const userData = { uid: userSnap.id, ...userSnap.data() } as ZippUser;
                    setUser(userData);
                    setInitialUser(userData);
                    if (userData.dob) {
                        try {
                           const [y, m, d] = userData.dob.split('-');
                           setYear(y);
                           setMonth(m);
                           setDay(d);
                           setInitialDob({ year: y, month: m, day: d });
                        } catch (e) {
                            console.error("Error parsing DOB:", e);
                        }
                    }
                    if (userData.gender) {
                        setGender(userData.gender);
                        setInitialGender(userData.gender);
                    }
                }
                setIsLoading(false);
            }
        };

        if (authUser) {
            fetchUserData();
        }
    }, [authUser, db]);

    useEffect(() => {
        const hasChanged = 
            JSON.stringify(user) !== JSON.stringify(initialUser) ||
            day !== initialDob.day ||
            month !== initialDob.month ||
            year !== initialDob.year ||
            gender !== initialGender;
        setIsChanged(hasChanged);
    }, [user, initialUser, day, month, year, gender, initialDob, initialGender]);
    
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUser(prev => ({ ...prev, [name]: value }));
    }, []);
    
    const handleAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUser(prev => ({ 
            ...prev, 
            address: {
                ...prev.address,
                [name]: value
            }
        }));
    }, []);

    const handleCountryChange = useCallback((value: string) => {
        setUser(prev => ({
             ...prev,
             address: {
                ...prev.address,
                country: value
             },
             region: value,
        }));
    }, []);

    const handleCancel = () => {
        router.back();
    };

    const handleSave = async () => {
        if (!authUser?.uid || !db) {
            toast({ title: "Error", description: "Not logged in or database not connected.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        const userRef = doc(db, "users", authUser.uid);
        
        let dobString: string | undefined = undefined;
        if (year && month && day) {
            const parsedMonth = parseInt(month, 10);
            const parsedDay = parseInt(day, 10);
            if (parsedMonth > 0 && parsedMonth <= 12 && parsedDay > 0 && parsedDay <= 31) {
                dobString = `${year}-${String(parsedMonth).padStart(2, '0')}-${String(parsedDay).padStart(2, '0')}`;
            } else {
                 toast({ title: "Invalid Date", description: "Please enter a valid date of birth.", variant: "destructive" });
                 setIsSaving(false);
                 return;
            }
        }
        
        try {
            const dataToUpdate: Partial<ZippUser> & { updatedAt: any } = {
                name: user.name,
                phone: user.phone,
                profession: user.profession,
                address: user.address,
                region: user.region,
                dob: dobString,
                gender: gender ?? null, // Ensure undefined is not sent
                updatedAt: serverTimestamp(),
            }

            await updateDoc(userRef, dataToUpdate);
            
            const updatedUser = { ...user, dob: dobString, gender };
            setInitialUser(updatedUser);
            setInitialDob({ day, month, year });
            setInitialGender(gender);
            setIsChanged(false);

            logActivity(db, authUser.uid, 'vendor_profile_update', { fieldsUpdated: Object.keys(dataToUpdate) });

            toast({ title: "Profile Saved", description: "Your information has been updated.", variant: "success" });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ title: "Save Failed", description: errorMessage, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };


    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }
    
    const countryOptions: ComboboxOption[] = countries.map(c => ({ value: c.value, label: c.label }));
    
    return (
        <div className="space-y-6">
            <Card
              className="shadow-none bg-transparent border-none"
            >
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>View and edit your personal details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" value={user.name || ""} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" value={user.email || ""} disabled />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" name="phone" type="tel" value={user.phone || ""} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Date of Birth</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <Input 
                                    placeholder="DD" 
                                    value={day} 
                                    onChange={(e) => setDay(e.target.value)} 
                                    maxLength={2} 
                                />
                                <Input 
                                    placeholder="MM" 
                                    value={month} 
                                    onChange={(e) => setMonth(e.target.value)} 
                                    maxLength={2} 
                                />
                                <Input 
                                    placeholder="YYYY" 
                                    value={year} 
                                    onChange={(e) => setYear(e.target.value)} 
                                    maxLength={4}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                        <Label htmlFor="profession">Profession (Optional)</Label>
                        <Input id="profession" name="profession" value={user.profession || ""} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                        <Label>Gender</Label>
                            <Select onValueChange={(value) => setGender(value as any)} value={gender}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Address</Label>
                        <Input name="line1" placeholder="Address Line 1" value={user.address?.line1 || ""} onChange={handleAddressChange} />
                        <Input name="line2" placeholder="Address Line 2 (Optional)" value={user.address?.line2 || ""} onChange={handleAddressChange} />
                        <div className="grid grid-cols-2 gap-4">
                            <Combobox
                                options={countryOptions}
                                value={user.address?.country || ''}
                                onChange={handleCountryChange}
                                searchPlaceholder="Search countries..."
                                noResultsMessage="No country found."
                                placeholder="Select Country"
                            />
                            <Input name="postalCode" placeholder="Postal Code" value={user.address?.postalCode || ""} onChange={handleAddressChange} />
                        </div>
                    </div>
                    <div className="pt-2">
                        <Button onClick={onOpenPasswordDialog} variant="default">Change Your Account Password</Button>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving || !isChanged}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Changes
                </Button>
            </div>
        </div>
    );
}
