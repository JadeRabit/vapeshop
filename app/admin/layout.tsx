import type { Metadata } from "next";
import { requirePageAdmin } from "@/lib/auth-guards";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Admin console",
    template: "%s · Admin",
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requirePageAdmin();

  return (
    <AdminShell user={{ name: admin.name, email: admin.email }}>{children}</AdminShell>
  );
}
