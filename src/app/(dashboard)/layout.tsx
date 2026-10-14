import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const matchesPendentes = await prisma.match.count({
    where: {
      status: { in: ["SUGGESTED", "VERIFIED"] },
      OR: [{ lostItem: { userId: session.userId } }, { foundItem: { userId: session.userId } }],
    },
  });

  return (
    <div className="min-h-screen">
      <Navbar matchesPendentes={matchesPendentes} />
      <main className="mx-auto max-w-6xl px-6 py-8 sm:px-10 sm:py-10">{children}</main>
    </div>
  );
}
