import type { CategoryScore } from "@/lib/types";
import { formatIndianRupees } from "@/lib/formatting";

export default function CategoryBreakdown({
  categories,
  loading,
}: {
  categories: CategoryScore[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="px-4 pb-4 pt-1">
        <div className="flex items-center gap-2 text-dark-muted text-xs">
          <span className="inline-block w-3 h-3 border-2 border-dark-muted border-t-transparent rounded-full animate-spin" />
          Loading breakdown…
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="px-4 pb-4 pt-1">
        <p className="text-dark-muted text-xs">No category data available.</p>
      </div>
    );
  }

  const maxCount = categories[0].complaint_count; // Already sorted desc

  return (
    <div className="px-4 pb-4 pt-1 border-t border-dark-border">
      <p className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-2">
        Complaint Breakdown
      </p>
      <div className="flex flex-col gap-1.5">
        {categories.map((cat) => {
          const pct = maxCount > 0 ? (cat.complaint_count / maxCount) * 100 : 0;
          return (
            <div key={cat.id ?? "uncategorized"}>
              {/* Bar row */}
              <div className="flex items-center gap-2">
                {/* Bar */}
                <div className="flex-1 h-5 bg-dark-bg rounded overflow-hidden relative">
                  <div
                    className="h-full bg-brand-navy/60 rounded transition-all duration-500 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-2 text-[11px] text-dark-pop font-medium truncate">
                    {cat.name}
                  </span>
                </div>
                {/* Count */}
                <span className="text-brand-orange font-bold text-xs w-8 text-right flex-shrink-0">
                  {cat.complaint_count}
                </span>
                {/* Amount */}
                <span className="text-brand-green text-[11px] w-16 text-right flex-shrink-0">
                  {cat.total_amount_lost > 0
                    ? formatIndianRupees(cat.total_amount_lost)
                    : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
