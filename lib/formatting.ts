export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatIndianRupees(
  amount: number | null | undefined,
  options: { showSymbol?: boolean; fallback?: string } = {}
): string {
  const { showSymbol = true, fallback = "N/A" } = options;
  if (amount === null || amount === undefined) return fallback;
  const rupees = Math.trunc(amount); // amount is already in rupees — no / 100
  return new Intl.NumberFormat("en-IN", {
    style: showSymbol ? "currency" : "decimal",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees);
}

/** @deprecated use formatIndianRupees */
export function formatRupees(amount: number): string {
  return formatIndianRupees(amount, { showSymbol: false, fallback: "—" });
}

export function formatIndianNumber(amount: number | null | undefined): string {
  return formatIndianRupees(amount, { showSymbol: false, fallback: "—" });
}
