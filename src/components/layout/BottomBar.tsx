
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import Image from "next/image";

const navItems = [
  { href: "/home", label: "Home", icon: "/icons/Home.svg" },
  { href: "/search", label: "Explore", icon: "/icons/Explore.svg" },
  { href: "/favourites", label: "Zipp Hub", icon: "/icons/Zipp Hub.svg" },
  { href: "/profile", label: "Profile", icon: "/icons/Profile.svg" },
];

export default function BottomBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (user?.role === "admin" || user?.role === "vendor") return null;

  if (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/claim-business" ||
    pathname.startsWith("/claim-business")
  )
    return null;

  return (
    <footer className="h-12 md:hidden w-full shrink-0">
      <nav className="h-full grid grid-cols-4 bg-transparent backdrop-blur-sm">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-end gap-0.5 pb-0",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Image
                src={item.icon}
                alt={item.label}
                width={20}
                height={20}
                className={cn(
                  "h-5 w-5",
                  "filter-primary-foreground", // Apply the consistent color filter
                  !isActive && "opacity-60" // Make inactive icons slightly transparent
                )}
              />
              <span className="text-xs leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <style jsx global>{`
        .filter-primary-foreground {
          filter: invert(15%) sepia(21%) saturate(1455%) hue-rotate(174deg) brightness(97%) contrast(91%);
        }
      `}</style>
    </footer>
  );
}
