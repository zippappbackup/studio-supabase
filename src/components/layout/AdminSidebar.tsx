
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Shapes,
  Users,
  DatabaseZap,
  Settings,
  UserCheck,
  ShieldAlert,
  HardDrive,
  MessageSquare,
} from "lucide-react";
import Logo from "@/components/core/Logo";
import { cn } from "@/lib/utils";
import { Sidebar, useSidebar } from "@/components/ui/sidebar";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/data-management", label: "Data Management", icon: HardDrive },
  { href: "/admin/categories", label: "Categories", icon: Shapes },
  { href: "/admin/vendors", label: "Vendor Approvals", icon: UserCheck },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
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
