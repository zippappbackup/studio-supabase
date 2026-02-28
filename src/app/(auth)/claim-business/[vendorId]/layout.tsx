
import "@/app/globals.css";
import Logo from "@/components/core/Logo";

export default function ClaimBusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen w-full items-start justify-center bg-transparent p-6"
    >
      <div className="mx-auto grid w-full max-w-md gap-6 z-10">
        <div className="grid gap-2 text-center">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
