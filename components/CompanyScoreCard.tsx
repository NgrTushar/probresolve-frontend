"use client";

import { useState, useTransition } from "react";
import type { CompanyScoreEntry, CategoryScore } from "@/lib/types";
import { formatIndianRupees } from "@/lib/formatting";
import { fetchCategoryBreakdown } from "@/app/scoreboard/actions";
import CategoryBreakdown from "./CategoryBreakdown";

export default function CompanyScoreCard({
  company,
  rank,
}: {
  company: CompanyScoreEntry;
  rank: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [categories, setCategories] = useState<CategoryScore[] | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    if (!expanded && categories === null) {
      // First expand — fetch data via Server Action
      startTransition(async () => {
        const data = await fetchCategoryBreakdown(company.id);
        setCategories(data);
      });
    }
    setExpanded((prev) => !prev);
  }

  return (
    <div className="bg-dark-surface border border-dark-border rounded-lg flex flex-col hover:border-brand-navy transition-colors relative">
      {/* Main card body */}
      <div className="p-4 flex flex-col gap-3">
        {/* Rank badge */}
        <span className="absolute top-3 right-3 text-dark-muted text-xs font-mono">
          #{rank}
        </span>

        {/* Domain pill */}
        {company.domain && (
          <span className="bg-dark-bg text-dark-muted text-xs px-2 py-0.5 rounded-full truncate mr-6">
            {company.domain.icon} {company.domain.name}
          </span>
        )}

        {/* Company name */}
        <h3 className="text-dark-pop font-bold text-sm line-clamp-2 leading-snug">
          {company.name}
        </h3>

        {/* Stats */}
        <div className="border-t border-dark-border pt-3 grid grid-cols-2 gap-2 mt-auto">
          <div>
            <p className="text-dark-muted text-xs">Complaints</p>
            <p className="text-brand-orange font-bold text-lg leading-none mt-0.5">
              {company.complaint_count}
            </p>
          </div>
          <div>
            <p className="text-dark-muted text-xs">₹ Lost</p>
            <p className="text-brand-green font-bold text-lg leading-none mt-0.5">
              {company.total_amount_lost > 0
                ? formatIndianRupees(company.total_amount_lost)
                : "—"}
            </p>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={handleToggle}
          className="flex items-center gap-1 text-[11px] text-dark-muted hover:text-dark-pop transition-colors mt-1 self-start"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-3 h-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {expanded ? "Hide breakdown" : "View breakdown"}
        </button>
      </div>

      {/* Expandable breakdown panel */}
      {expanded && (
        <CategoryBreakdown categories={categories ?? []} loading={isPending} />
      )}
    </div>
  );
}
