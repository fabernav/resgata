import { LogoBadge } from "@/components/Logo";
import { ThemeToggle } from "@/components/theme";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-9 flex flex-col items-center gap-4">
          <LogoBadge className="h-20 w-20 rounded-[26%]" />
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-fg">Resgata</h1>
            <p className="mt-1.5 text-sm text-muted">Achados e perdidos do campus</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
