import type { Metadata } from "next";
import { requirePageUser } from "@/lib/auth-guards";
import { getAddresses } from "@/lib/data/account";
import { AddressManager } from "@/components/account/address-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Addresses",
  robots: { index: false, follow: false },
};

export default async function AccountAddressesPage() {
  const user = await requirePageUser();
  const addresses = await getAddresses(user.id);

  return (
    <section aria-labelledby="addresses-heading">
      <div>
        <h2 id="addresses-heading" className="text-2xl font-semibold">
          Delivery addresses
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage where we deliver. Your default address is preselected at checkout.
        </p>
      </div>
      <div className="mt-6">
        <AddressManager addresses={addresses} />
      </div>
    </section>
  );
}
