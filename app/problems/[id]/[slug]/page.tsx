import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import UpvoteButton from "@/components/UpvoteButton";
import ReportButton from "@/components/ReportButton";
import CopyLinkButton from "@/components/CopyLinkButton";
import { getProblem } from "@/lib/api";
import { formatDate, formatIndianRupees } from "@/lib/formatting";

type Props = {
  params: Promise<{ id: string; slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";
  const ua = headersList.get("user-agent") || "";
  const problem = await getProblem(id, ip, ua);
  if (!problem) return {};
  return { title: `${problem.title} — ProbResolve` };
}

export default async function ProblemDetailPage({ params }: Props) {
  const { id } = await params;
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";
  const ua = headersList.get("user-agent") || "";

  const problem = await getProblem(id, ip, ua);
  if (!problem) notFound();

  const underReview =
    problem.report_count >= 5 && !problem.flags_cleared && !problem.is_verified;

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-dark-muted mb-4">
        <Link href="/" className="hover:text-dark-pop transition-colors">
          Home
        </Link>
        {" › "}
        <Link
          href={`/?domain_id=${problem.domain.id}`}
          className="hover:text-dark-pop transition-colors"
        >
          {problem.domain.icon} {problem.domain.name}
        </Link>
      </nav>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: problem.title,
            datePublished: problem.created_at,
            description: problem.description.slice(0, 200),
          }),
        }}
      />

      <div className="bg-dark-s1 rounded-xl border border-dark-border p-6">
        {/* Header */}
        <div className="flex gap-6">
          {/* Upvote */}
          <div className="flex-shrink-0 min-w-[48px]">
            <UpvoteButton
              problemId={problem.id}
              initialCount={problem.upvote_count}
              alreadyVoted={problem.already_voted}
            />
          </div>

          {/* Title + badges */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-dark-pop leading-snug">
              {problem.title}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="bg-brand-teal/15 text-brand-teal px-2 py-1 rounded-lg font-medium">
                {problem.domain.icon} {problem.domain.name}
              </span>
              {problem.company && (
                <span className="bg-dark-s-hover text-dark-pop px-2 py-1 rounded-lg border border-dark-border font-medium">
                  🏢 {problem.company.name}
                </span>
              )}
              {problem.category && (
                <span className="bg-dark-s-hover text-dark-muted px-2 py-1 rounded-lg">
                  {problem.category.name}
                </span>
              )}
              {problem.is_verified && (
                <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded-lg font-medium">
                  ✅ Admin Verified
                </span>
              )}
              {underReview && (
                <span className="bg-amber-900/30 text-amber-400 px-2 py-1 rounded-lg font-medium">
                  ⚠️ Under Review
                </span>
              )}
              {problem.is_resolved && (
                <span className="bg-brand-green/15 text-brand-green px-2 py-1 rounded-lg font-medium">
                  ✓ Resolved
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-dark-muted italic">
              This complaint represents the poster&apos;s account and has not been
              independently verified by ProbResolve.
            </p>
          </div>
        </div>

        {/* Details grid */}
        <dl className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm border-t border-dark-border pt-4">
          {problem.location_state && (
            <div>
              <dt className="text-dark-muted text-xs uppercase tracking-wide mb-1">State</dt>
              <dd className="font-medium text-dark-pop">{problem.location_state}</dd>
            </div>
          )}
          {problem.amount_lost != null && (
            <div>
              <dt className="text-dark-muted text-xs uppercase tracking-wide mb-1">Amount Lost</dt>
              <dd className="font-bold text-brand-orange text-base">
                {formatIndianRupees(problem.amount_lost)}
              </dd>
            </div>
          )}
          {problem.date_of_incident && (
            <div>
              <dt className="text-dark-muted text-xs uppercase tracking-wide mb-1">Date of Incident</dt>
              <dd className="font-medium text-dark-pop">{formatDate(problem.date_of_incident)}</dd>
            </div>
          )}

          <div>
            <dt className="text-dark-muted text-xs uppercase tracking-wide mb-1">Posted on</dt>
            <dd className="font-medium text-dark-pop">{formatDate(problem.created_at)}</dd>
          </div>
        </dl>

        {/* Description */}
        <div className="mt-5 border-t border-dark-border pt-4">
          <h2 className="text-xs font-semibold text-dark-muted uppercase tracking-wide mb-3">
            Description
          </h2>
          <p className="whitespace-pre-wrap break-words text-sm text-dark-pop leading-relaxed">
            {problem.description}
          </p>
        </div>

        {/* Evidence */}
        {problem.evidence.length > 0 && (
          <div className="mt-5 border-t border-dark-border pt-4">
            <h2 className="text-xs font-semibold text-dark-muted uppercase tracking-wide mb-3">
              Evidence ({problem.evidence.length})
            </h2>
            <ul className="space-y-1.5">
              {problem.evidence.map((ev) => (
                <li key={ev.id} className="text-sm">
                  <a
                    href={ev.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-teal hover:underline"
                  >
                    📎 {ev.file_name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Complaint Strength */}
        <div className="mt-5 border-t border-dark-border pt-4">
          <h2 className="text-xs font-semibold text-dark-muted uppercase tracking-wide mb-3">
            Complaint Strength
          </h2>
          <ul className="space-y-1.5 text-sm">
            {[
              { ok: problem.evidence.length > 0, label: "Evidence attached" },
              { ok: problem.has_email, label: "Contact info provided" },
              { ok: !!problem.date_of_incident, label: "Date of incident specified" },
              { ok: problem.amount_lost != null, label: "Amount documented" },
              {
                ok: !!problem.location_state,
                label: problem.location_state
                  ? `Location: ${problem.location_state}`
                  : "Location: not specified",
              },
            ].map((signal, i) => (
              <li
                key={i}
                className={`flex items-center gap-2 ${signal.ok ? "text-brand-green" : "text-dark-muted"}`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${signal.ok ? "bg-brand-green/20" : "bg-dark-border"}`}>
                  {signal.ok ? "✓" : "○"}
                </span>
                {signal.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Report button */}
        <div className="mt-5 border-t border-dark-border pt-4 flex items-center justify-between">
          <span className="text-xs text-dark-muted">
            Something wrong with this complaint?
          </span>
          <div className="flex items-center gap-2">
            <CopyLinkButton />
            <ReportButton
              problemId={problem.id}
              alreadyReported={problem.already_reported}
            />
          </div>
        </div>
      </div>

      {/* Escalation card */}
      {problem.escalation_links.length > 0 && (
        <div className="mt-6 bg-dark-s1 border border-dark-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-dark-pop mb-1">
            🚨 Where to escalate this complaint
          </h2>
          <p className="text-xs text-dark-muted mb-4">
            Follow these steps in order. All links are official government portals.
          </p>
          <ol className="space-y-4">
            {problem.escalation_links.map((link, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-teal text-white text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-brand-teal hover:underline"
                  >
                    {link.name} ↗
                  </a>
                  <p className="text-xs text-dark-muted mt-0.5 leading-relaxed">{link.description}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-dark-muted italic border-t border-dark-border pt-3">
            ProbResolve is not affiliated with any of the above portals. Links are provided for consumer awareness only.
          </p>
        </div>
      )}

      <div className="mt-4">
        <Link href="/" className="text-sm text-dark-muted hover:text-dark-pop transition-colors">
          ← Back to all complaints
        </Link>
      </div>
    </div>
  );
}
