"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, User, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/core/Logo";
import { Sidebar, useSidebar } from "@/components/ui/sidebar";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/search", label: "Explore", icon: Compass },
  { href: "/favourites", label: "Zipp Hub", icon: Archive },
  { href: "/profile", label: "Profile", icon: User },
];

export function UserSidebar() {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleLinkClick = (href: string, label: string) => {
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
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => handleLinkClick(item.href, item.label)}
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
    <Sidebar className="w-60 flex-col border-r hidden md:flex">
      {content}
    </Sidebar>
  );
}
