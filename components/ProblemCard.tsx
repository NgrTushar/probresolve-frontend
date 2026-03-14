import Link from "next/link";
import type { ProblemListItem } from "@/lib/types";
import { formatDate, formatIndianRupees } from "@/lib/formatting";

export default function ProblemCard({ problem }: { problem: ProblemListItem }) {
  const underReview =
    problem.report_count >= 5 && !problem.flags_cleared && !problem.is_verified;

  return (
    <div className="bg-white rounded-lg border border-brand-smoke p-4 flex gap-4 hover:border-brand-navy transition-colors">
      {/* Upvote count (display only on cards) */}
      <div className="flex-shrink-0 text-center min-w-[48px]">
        <div className="flex flex-col items-center text-brand-green">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
          <span className="text-base font-bold text-brand-green">
            {problem.upvote_count}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/problems/${problem.id}/${problem.slug}`}
          className="text-base font-semibold text-brand-ink hover:text-brand-navy line-clamp-2"
        >
          {problem.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-brand-slate">
          <span className="bg-brand-navy/10 text-brand-navy px-2 py-0.5 rounded-full">
            {problem.domain.icon} {problem.domain.name}
          </span>
          {problem.company && (
            <span className="bg-brand-navy/5 text-brand-navy px-2 py-0.5 rounded-full border border-brand-navy/10">
              🏢 {problem.company.name}
            </span>
          )}
          {problem.category && (
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {problem.category.name}
            </span>
          )}
          {problem.location_state && <span>📍 {problem.location_state}</span>}
          {problem.amount_lost != null && (
            <span>💸 {formatIndianRupees(problem.amount_lost)}</span>
          )}
          <span>{formatDate(problem.created_at)}</span>
          {problem.is_verified && (
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              ✅ Admin Verified
            </span>
          )}
          {underReview && (
            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              ⚠️ Under Review
            </span>
          )}
          {problem.is_resolved && (
            <span className="text-brand-green font-medium">✓ Resolved</span>
          )}
        </div>
      </div>
    </div>
  );
}
