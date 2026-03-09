export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatRupees(paise: number): string {
  return new Intl.NumberFormat("en-IN").format(Math.round(paise / 100));
}
