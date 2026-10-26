export const MAX_LINE_QUANTITY = 99;

export function clampCartQuantity(quantity: number, stock: number) {
  const ceiling = Math.min(Math.max(stock, 0), MAX_LINE_QUANTITY);
  if (ceiling <= 0) return 0;
  return Math.min(Math.max(Math.floor(quantity), 1), ceiling);
}

export function cartItemCount(lines: Array<{ quantity: number }>) {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

export function cartSubtotalCentavos(
  lines: Array<{ unitPriceCentavos: number; quantity: number }>,
) {
  return lines.reduce((total, line) => total + line.unitPriceCentavos * line.quantity, 0);
}

export function lineWarning(line: { stock: number; quantity: number }) {
  if (line.stock <= 0) return "Out of stock";
  if (line.quantity > line.stock) return `Only ${line.stock} left`;
  return null;
}
