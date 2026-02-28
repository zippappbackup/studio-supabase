
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

export default function OrdersPage() {
    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
                <p className="text-muted-foreground">Manage incoming product orders from customers.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Current Orders</CardTitle>
                    <CardDescription>This feature is under construction.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="text-center py-20 border-2 border-dashed rounded-lg">
                        <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">Order Management Coming Soon</h3>
                        <p className="mt-1 text-sm text-muted-foreground">You will be able to view and manage customer orders here.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
