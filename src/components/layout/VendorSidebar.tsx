
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserCircle,
  Package,
  Ticket,
} from "lucide-react";
import Logo from "@/components/core/Logo";
import { cn } from "@/lib/utils";
import { Sidebar, useSidebar } from "@/components/ui/sidebar";

const navItems = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/profile", label: "Business Profile", icon: UserCircle },
  { href: "/vendor/offerings", label: "Catalogue", icon: Package },
  { href: "/vendor/promotions", label: "Promotions", icon: Ticket },
];

export function VendorSidebar() {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const content = (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <Logo />
      </div>
      <nav className="flex-1 flex flex-col gap-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-all",
                isActive && "bg-accent text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <Sidebar className="w-64 flex-col border-r hidden md:flex">
      {content}
    </Sidebar>
  );
}
