const phpFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats integer centavos as Philippine pesos. */
export function formatPhp(centavos: number): string {
  return phpFormatter.format(Math.round(centavos) / 100);
}

/** Parses a peso input into integer centavos without binary floating point. */
export function pesosToCentavos(input: string | number): number {
  const normalized = String(input).trim().replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Enter a valid peso amount with up to two decimal places.");
  }
  const [pesoPart, centavoPart = ""] = normalized.split(".");
  return Number(pesoPart) * 100 + Number(centavoPart.padEnd(2, "0"));
}

export function centavosToPesoInput(centavos: number): string {
  return (centavos / 100).toFixed(2);
}

export function calculateShipping(subtotalCentavos: number, threshold: number, fee: number) {
  if (subtotalCentavos <= 0) return 0;
  return subtotalCentavos >= threshold ? 0 : fee;
}
