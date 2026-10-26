"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/db";
import { addressSchema } from "@/lib/validators/address";
import type { AddressActionState } from "@/lib/action-result";

function fieldErrorsFrom(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}) {
  return Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter(
      (entry): entry is [string, string[]] => Boolean(entry[1]?.length),
    ),
  );
}

function parseAddress(formData: FormData) {
  return addressSchema.safeParse({
    label: formData.get("label") ?? "",
    recipientName: formData.get("recipientName"),
    phone: formData.get("phone"),
    line1: formData.get("line1"),
    line2: formData.get("line2") ?? "",
    barangay: formData.get("barangay") ?? "",
    city: formData.get("city"),
    province: formData.get("province"),
    postalCode: formData.get("postalCode"),
    isDefault: formData.get("isDefault") === "on" || formData.get("isDefault") === "true",
  });
}

function revalidateAddressSurfaces() {
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}

export async function createAddressAction(
  _previous: AddressActionState,
  formData: FormData,
): Promise<AddressActionState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Sign in to save an address." };

  const parsed = parseAddress(formData);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted address fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  try {
    const address = await prisma.$transaction(async (transaction) => {
      const addressCount = await transaction.address.count({ where: { userId: user.id } });
      const shouldDefault = addressCount === 0 || parsed.data.isDefault;

      if (shouldDefault) {
        await transaction.address.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });
      }

      return transaction.address.create({
        data: {
          userId: user.id,
          label: parsed.data.label || null,
          recipientName: parsed.data.recipientName,
          phone: parsed.data.phone,
          line1: parsed.data.line1,
          line2: parsed.data.line2 || null,
          barangay: parsed.data.barangay || null,
          city: parsed.data.city,
          province: parsed.data.province,
          postalCode: parsed.data.postalCode,
          country: "PH",
          isDefault: shouldDefault,
        },
      });
    });

    revalidateAddressSurfaces();
    return { ok: true, message: "Address saved.", addressId: address.id };
  } catch (error) {
    console.error("Address creation failed", error);
    return { ok: false, message: "We could not save that address. Please try again." };
  }
}

export async function updateAddressAction(
  _previous: AddressActionState,
  formData: FormData,
): Promise<AddressActionState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Sign in to update an address." };

  const addressId = String(formData.get("addressId") ?? "");
  if (!addressId) return { ok: false, message: "Missing address reference." };

  const parsed = parseAddress(formData);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted address fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  try {
    const existing = await prisma.address.findFirst({
      where: { id: addressId, userId: user.id },
      select: { id: true, isDefault: true },
    });
    if (!existing) return { ok: false, message: "Address not found." };

    await prisma.$transaction(async (transaction) => {
      if (parsed.data.isDefault) {
        await transaction.address.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });
      }

      await transaction.address.update({
        where: { id: addressId },
        data: {
          label: parsed.data.label || null,
          recipientName: parsed.data.recipientName,
          phone: parsed.data.phone,
          line1: parsed.data.line1,
          line2: parsed.data.line2 || null,
          barangay: parsed.data.barangay || null,
          city: parsed.data.city,
          province: parsed.data.province,
          postalCode: parsed.data.postalCode,
          isDefault: parsed.data.isDefault || existing.isDefault,
        },
      });
    });

    revalidateAddressSurfaces();
    return { ok: true, message: "Address updated.", addressId };
  } catch (error) {
    console.error("Address update failed", error);
    return { ok: false, message: "We could not update that address. Please try again." };
  }
}

export async function setDefaultAddressAction(addressId: string) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const, message: "Sign in to update addresses." };

  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId: user.id },
    select: { id: true },
  });
  if (!existing) return { ok: false as const, message: "Address not found." };

  await prisma.$transaction([
    prisma.address.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    }),
    prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    }),
  ]);

  revalidateAddressSurfaces();
  return { ok: true as const, message: "Default address updated." };
}

export async function deleteAddressAction(addressId: string) {
  const user = await getSessionUser();
  if (!user) return { ok: false as const, message: "Sign in to delete an address." };

  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId: user.id },
    select: { id: true, isDefault: true },
  });
  if (!existing) return { ok: false as const, message: "Address not found." };

  await prisma.$transaction(async (transaction) => {
    await transaction.address.delete({ where: { id: addressId } });

    if (existing.isDefault) {
      const nextAddress = await transaction.address.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (nextAddress) {
        await transaction.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }
  });

  revalidateAddressSurfaces();
  return { ok: true as const, message: "Address removed." };
}
