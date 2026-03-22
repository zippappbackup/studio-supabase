
import "@/app/globals.css";
import Logo from "@/components/core/Logo";

export default function ClaimBusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      {children}
    </div>
  );
}
