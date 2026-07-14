export function formatINR(value: number | string): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function discountPercent(price: number, original: number | null | undefined): number | null {
  if (!original || original <= price) return null;
  return Math.round(((original - price) / original) * 100);
}
