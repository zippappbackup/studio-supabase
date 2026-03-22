
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { LogOut } from "lucide-react";
import Logo from "@/components/core/Logo";
import { useSidebar } from "../ui/sidebar";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { SearchSection } from "@/components/home/SearchSection";
import { DiscoverCategories } from "@/components/home/DiscoverCategories";
import { SearchHeader } from "@/components/search/SearchHeader";

export default function Header({ children }: { children?: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { isMobile, state } = useSidebar();
  const pathname = usePathname();
  
  const getInitials = (name?: string | null): string => {
    if (!name) return "U";
    const words = name.split(" ").filter(Boolean);
    if (words.length === 0) return "U";
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };
  
  const initials = getInitials(user?.name);
  
  const showLogoInHeader = isMobile || state === 'collapsed';

  const isHomePage = pathname === '/home';
  const isSearchPage = pathname === '/search';

  return (
    <header 
      className="sticky top-0 z-50 bg-transparent backdrop-blur-sm pb-2"
    >
        <div className="flex h-12 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
                {children}
                <div className={cn("transition-opacity duration-300 transform scale-105", showLogoInHeader ? "opacity-100" : "opacity-0")}>
                <Logo />
                </div>
            </div>

            <div className="flex items-center gap-4">
                {user && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-lg">
                        <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || ""} alt={user.name || ""} />
                        <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem onClick={logout} className="cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                )}
            </div>
        </div>
        
        {isHomePage && (
            <div>
                <SearchSection />
                <DiscoverCategories />
            </div>
        )}

        {isSearchPage && (
            <div className="px-4 sm:px-6 md:px-8">
              <SearchHeader />
            </div>
        )}

    </header>
  );
}
