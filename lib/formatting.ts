export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatRupees(rupees: number): string {
  return new Intl.NumberFormat("en-IN").format(rupees);
}
