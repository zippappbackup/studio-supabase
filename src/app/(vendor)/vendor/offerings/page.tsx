
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Offering, Vendor } from "@/lib/types";
import { OfferingEditDialog } from "./OfferingEditDialog";
import { Badge } from "@/components/ui/badge";
import { OfferingActions } from "./OfferingActions";

export default function OfferingsPage() {
    const { user } = useAuth();
    const db = useFirestore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedOffering, setSelectedOffering] = useState<Offering | undefined>(undefined);

    const vendorId = user?.vendorId || user?.uid;

    const vendorRef = useMemoFirebase(() => (vendorId && db ? doc(db, "vendors", vendorId) : null), [vendorId, db]);
    const { data: vendor, isLoading } = useDoc<Vendor>(vendorRef);
    
    const offerings = vendor?.offerings || [];

    const handleAdd = () => {
        setSelectedOffering(undefined);
        setIsDialogOpen(true);
    };

    const handleEdit = (offering: Offering) => {
        setSelectedOffering(offering);
        setIsDialogOpen(true);
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Catalogue</h1>
                </div>
                <Button onClick={handleAdd}>
                    Add New Offering
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Offerings</CardTitle>
                    <CardDescription>A list of all products and services for your business.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && <TableRow><TableCell colSpan={5} className="text-center h-24">Loading your offerings...</TableCell></TableRow>}
                            {!isLoading && offerings?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        <h3 className="font-semibold">No offerings yet</h3>
                                        <p className="text-muted-foreground text-sm">Click "Add New Offering" to create your first product or service.</p>
                                    </TableCell>
                                </TableRow>
                            )}
                            {!isLoading && offerings?.map(offering => (
                                <TableRow key={offering.id}>
                                    <TableCell className="font-medium">{offering.name}</TableCell>
                                    <TableCell className="capitalize">{offering.type}</TableCell>
                                    <TableCell>{new Intl.NumberFormat('en-SG', { style: 'currency', currency: offering.currency }).format(offering.price)}</TableCell>
                                    <TableCell>
                                        <Badge variant={offering.isActive ? 'default' : 'outline'}>
                                            {offering.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <OfferingActions offering={offering} onEdit={() => handleEdit(offering)} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <OfferingEditDialog
                isOpen={isDialogOpen}
                setIsOpen={setIsDialogOpen}
                offering={selectedOffering}
            />
        </div>
    );
}
