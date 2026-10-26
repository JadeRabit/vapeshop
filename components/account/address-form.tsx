"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createAddressAction, updateAddressAction } from "@/lib/actions/addresses";
import { initialAddressState, type AddressActionState } from "@/lib/action-result";
import type { AddressDTO } from "@/lib/data/account";

function FieldError({ id, message }: { id: string; message?: string[] }) {
  if (!message?.[0]) return null;
  return (
    <p id={id} className="text-xs text-destructive" role="alert">
      {message[0]}
    </p>
  );
}

export function AddressForm({
  address,
  onSaved,
  submitLabel,
  compact = false,
}: {
  address?: AddressDTO;
  onSaved?: (addressId: string) => void;
  submitLabel?: string;
  compact?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const prefix = useId().replace(/[:]/g, "");
  const action = address ? updateAddressAction : createAddressAction;
  const [state, formAction, pending] = useActionState<AddressActionState, FormData>(
    action,
    initialAddressState,
  );

  useEffect(() => {
    if (state.ok) {
      toast.success(address ? "Address updated." : "Address saved.");
      onSaved?.(state.addressId ?? address?.id ?? "");
      if (!address) formRef.current?.reset();
    }
  }, [state, address, onSaved]);

  const errors = state.fieldErrors;

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
      {address ? <input type="hidden" name="addressId" value={address.id} /> : null}

      {!state.ok && state.message ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className={compact ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"}>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-recipientName`}>Recipient name</Label>
          <Input
            id={`${prefix}-recipientName`}
            name="recipientName"
            required
            autoComplete="name"
            defaultValue={address?.recipientName}
            aria-invalid={Boolean(errors?.recipientName)}
            aria-describedby={errors?.recipientName ? `${prefix}-recipientName-error` : undefined}
          />
          <FieldError id={`${prefix}-recipientName-error`} message={errors?.recipientName} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-phone`}>Mobile number</Label>
          <Input
            id={`${prefix}-phone`}
            name="phone"
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder="09171234567"
            defaultValue={address?.phone}
            aria-invalid={Boolean(errors?.phone)}
            aria-describedby={errors?.phone ? `${prefix}-phone-error` : undefined}
          />
          <FieldError id={`${prefix}-phone-error`} message={errors?.phone} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}-line1`}>Street address</Label>
        <Input
          id={`${prefix}-line1`}
          name="line1"
          required
          autoComplete="address-line1"
          defaultValue={address?.line1}
          aria-invalid={Boolean(errors?.line1)}
          aria-describedby={errors?.line1 ? `${prefix}-line1-error` : undefined}
        />
        <FieldError id={`${prefix}-line1-error`} message={errors?.line1} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-line2`}>Unit / floor / landmark (optional)</Label>
          <Input
            id={`${prefix}-line2`}
            name="line2"
            autoComplete="address-line2"
            defaultValue={address?.line2 ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-barangay`}>Barangay (optional)</Label>
          <Input id={`${prefix}-barangay`} name="barangay" defaultValue={address?.barangay ?? ""} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-city`}>City / municipality</Label>
          <Input
            id={`${prefix}-city`}
            name="city"
            required
            autoComplete="address-level2"
            defaultValue={address?.city}
            aria-invalid={Boolean(errors?.city)}
            aria-describedby={errors?.city ? `${prefix}-city-error` : undefined}
          />
          <FieldError id={`${prefix}-city-error`} message={errors?.city} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-province`}>Province</Label>
          <Input
            id={`${prefix}-province`}
            name="province"
            required
            autoComplete="address-level1"
            defaultValue={address?.province}
            aria-invalid={Boolean(errors?.province)}
            aria-describedby={errors?.province ? `${prefix}-province-error` : undefined}
          />
          <FieldError id={`${prefix}-province-error`} message={errors?.province} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-postalCode`}>Postal code</Label>
          <Input
            id={`${prefix}-postalCode`}
            name="postalCode"
            required
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={4}
            defaultValue={address?.postalCode}
            aria-invalid={Boolean(errors?.postalCode)}
            aria-describedby={errors?.postalCode ? `${prefix}-postalCode-error` : undefined}
          />
          <FieldError id={`${prefix}-postalCode-error`} message={errors?.postalCode} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-label`}>Label (optional)</Label>
          <Input
            id={`${prefix}-label`}
            name="label"
            placeholder="Home, office…"
            defaultValue={address?.label ?? ""}
          />
        </div>
        <div className="flex items-end pb-3">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <Checkbox name="isDefault" defaultChecked={address?.isDefault ?? false} />
            Set as default address
          </label>
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel ?? (address ? "Save changes" : "Save address")}
      </Button>
    </form>
  );
}
