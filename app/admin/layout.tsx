import type { Metadata } from "next";
import { requirePageAdmin } from "@/lib/auth-guards";
import { getAdminNavBadges } from "@/lib/data/admin-analytics";
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
  const [admin, badges] = await Promise.all([requirePageAdmin(), getAdminNavBadges()]);

  return (
    <AdminShell
      user={{ name: admin.name, email: admin.email }}
      badges={badges}
    >
      {children}
    </AdminShell>
  );
}
