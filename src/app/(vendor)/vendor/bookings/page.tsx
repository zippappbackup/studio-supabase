
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

export default function BookingsPage() {
    return (
        <div className="flex flex-col gap-8">
             <div>
                <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
                <p className="text-muted-foreground">Manage your appointment and service schedule.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Bookings</CardTitle>
                     <CardDescription>This feature is under construction.</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="text-center py-20 border-2 border-dashed rounded-lg">
                        <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">Booking System Coming Soon</h3>
                        <p className="mt-1 text-sm text-muted-foreground">You will be able to manage your schedule and appointments here.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
