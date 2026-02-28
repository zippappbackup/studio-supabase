
"use client";

import "@/app/globals.css";
import BottomBar from "@/components/layout/BottomBar";
import Header from "@/components/layout/Header";
import { UserSidebar } from "@/components/layout/UserSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserLayoutClient } from "./UserLayoutClient";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex w-full h-screen overflow-hidden">
        {/* SIDEBAR */}
        <UserSidebar />

        {/* MAIN COLUMN */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* HEADER — fixed height */}
          <Header />

          {/* SCROLLABLE CONTENT — includes sticky page elements */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
            <UserLayoutClient>
              <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
                {children}
              </div>
            </UserLayoutClient>
          </main>

          {/* BOTTOM BAR — fixed at bottom */}
          <div className="h-[48px] flex-shrink-0">
            <BottomBar />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
