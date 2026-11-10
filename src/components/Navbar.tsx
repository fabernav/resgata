"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { History, LayoutGrid, LogOut, Menu, PlusCircle, Search, X } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { LogoBadge } from "@/components/Logo";
import { ThemeToggle } from "@/components/theme";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/feed", label: "Feed Publico", icon: Search },
  { href: "/items/lost/new", label: "Registrar Perdido", icon: PlusCircle },
  { href: "/items/found/new", label: "Registrar Achado", icon: PlusCircle },
  { href: "/history", label: "Historico", icon: History },
];

export function Navbar({ matchesPendentes = 0 }: { matchesPendentes?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    setMobileOpen(false);
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-subtle bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-3.5 sm:px-10">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <LogoBadge className="h-10 w-10" />
            <span className="text-xl font-bold tracking-tight text-fg">Resgata</span>
          </Link>

          <div className="hidden items-center gap-1 xl:flex">
            {LINKS.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-brand/10 font-semibold text-brand"
                      : "text-muted hover:bg-brand/10 hover:text-fg"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                  {link.href === "/dashboard" && matchesPendentes > 0 && (
                    <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-brand-fg">
                      {matchesPendentes}
                    </span>
                  )}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
            <ThemeToggle className="ml-1" />
          </div>

          <div className="flex items-center gap-1 xl:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(true)}
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-brand/10 hover:text-fg"
              aria-label={
                matchesPendentes > 0 ? `Abrir menu (${matchesPendentes} matches)` : "Abrir menu"
              }
            >
              <Menu className="h-5 w-5" />
              {matchesPendentes > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-surface" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Fora do <header>: o backdrop-blur dele prenderia o drawer fixed a altura do header. */}
      {mobileOpen && (
        <div className="xl:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-72 max-w-[80vw] flex-col border-l border-subtle bg-surface p-5 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <LogoBadge className="h-10 w-10" />
                <span className="text-xl font-bold tracking-tight text-fg">Resgata</span>
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-brand/10 hover:text-fg"
                aria-label="Fechar menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1">
              {LINKS.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                      active ? "bg-brand/10 font-semibold text-brand" : "text-fg hover:bg-brand/10"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                    {link.href === "/dashboard" && matchesPendentes > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-brand-fg">
                        {matchesPendentes}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </aside>
        </div>
      )}
    </>
  );
}
