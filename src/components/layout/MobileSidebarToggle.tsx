
"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";

export function MobileSidebarToggle() {
    const { toggleSidebar } = useSidebar();
    
    return (
        <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={toggleSidebar}
        >
            <PanelLeft />
            <span className="sr-only">Toggle Sidebar</span>
        </Button>
    )
}
