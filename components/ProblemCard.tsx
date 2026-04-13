import Link from "next/link";
import type { ProblemListItem } from "@/lib/types";
import { formatDate, formatIndianRupees } from "@/lib/formatting";

export default function ProblemCard({ problem }: { problem: ProblemListItem }) {
  const underReview =
    problem.report_count >= 5 && !problem.flags_cleared && !problem.is_verified;

  return (
    <Link
      href={`/problems/${problem.id}/${problem.slug}`}
      className="group bg-dark-surface rounded-lg border border-dark-border p-4 flex gap-4 hover:border-brand-navy transition-colors cursor-pointer"
    >
      {/* Upvote count */}
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
        <span className="text-base font-semibold text-dark-pop group-hover:text-brand-green group-hover:underline underline-offset-2 line-clamp-2 transition-colors">
          {problem.title}
        </span>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-dark-muted">
          <span className="bg-brand-navy/30 text-dark-pop px-2 py-0.5 rounded-full font-medium">
            {problem.domain.icon} {problem.domain.name}
          </span>
          {problem.company && (
            <span className="bg-dark-border/50 text-dark-pop px-2 py-0.5 rounded-full border border-dark-border">
              🏢 {problem.company.name}
            </span>
          )}
          {problem.category && (
            <span className="bg-dark-border text-dark-muted px-2 py-0.5 rounded-full">
              {problem.category.name}
            </span>
          )}
          {problem.location_state && <span>📍 {problem.location_state}</span>}
          {problem.amount_lost != null && (
            <span className="text-brand-green font-medium">💸 {formatIndianRupees(problem.amount_lost)}</span>
          )}
          <span>{formatDate(problem.created_at)}</span>
          {problem.is_verified && (
            <span className="bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full font-medium">
              ✅ Admin Verified
            </span>
          )}
          {underReview && (
            <span className="bg-amber-900/30 text-amber-400 px-2 py-0.5 rounded-full font-medium">
              ⚠️ Under Review
            </span>
          )}
          {problem.is_resolved && (
            <span className="text-brand-green font-medium">✓ Resolved</span>
          )}
        </div>
      </div>

      {/* Arrow — Polymarket style */}
      <div className="flex-shrink-0 flex items-center self-center text-dark-muted group-hover:text-brand-green transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
