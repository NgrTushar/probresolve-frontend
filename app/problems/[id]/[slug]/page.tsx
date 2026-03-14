import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import UpvoteButton from "@/components/UpvoteButton";
import ReportButton from "@/components/ReportButton";
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
      <nav className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-brand-navy">
          Home
        </Link>
        {" › "}
        <Link
          href={`/?domain_id=${problem.domain.id}`}
          className="hover:text-brand-navy"
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

      <div className="bg-white rounded-lg border border-brand-smoke p-6">
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
            <h1 className="text-xl font-bold text-gray-900 leading-snug">
              {problem.title}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="bg-brand-navy/10 text-brand-navy px-2 py-1 rounded-full">
                {problem.domain.icon} {problem.domain.name}
              </span>
              {problem.company && (
                <span className="bg-brand-navy/5 text-brand-navy px-2 py-1 rounded-full border border-brand-navy/10 font-medium">
                  🏢 {problem.company.name}
                </span>
              )}
              {problem.category && (
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {problem.category.name}
                </span>
              )}
              {problem.is_verified && (
                <span
                  className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium"
                  title="Our team has reviewed evidence for this complaint and confirmed the poster provided contact information and the described incident is specific and checkable."
                >
                  ✅ Admin Verified
                </span>
              )}
              {underReview && (
                <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                  ⚠️ Under Review
                </span>
              )}
              {problem.is_resolved && (
                <span className="bg-brand-green/10 text-brand-green px-2 py-1 rounded-full font-medium">
                  ✓ Resolved
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-400 italic">
              This complaint represents the poster&apos;s account and has not been
              independently verified by ProbResolve. ProbResolve does not determine the guilt of
              any party.
            </p>
          </div>
        </div>

        {/* Details grid */}
        <dl className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm border-t border-gray-100 pt-4">
          {problem.location_state && (
            <div>
              <dt className="text-brand-slate text-xs uppercase tracking-wide">State</dt>
              <dd className="font-medium">{problem.location_state}</dd>
            </div>
          )}
          {problem.amount_lost != null && (
            <div>
              <dt className="text-brand-slate text-xs uppercase tracking-wide">
                Amount Lost
              </dt>
              <dd className="font-medium text-brand-orange">
                {formatIndianRupees(problem.amount_lost)}
              </dd>
            </div>
          )}
          {problem.date_of_incident && (
            <div>
              <dt className="text-brand-slate text-xs uppercase tracking-wide">
                Date of Incident
              </dt>
              <dd className="font-medium">{formatDate(problem.date_of_incident)}</dd>
            </div>
          )}
          {problem.poster_name && (
            <div>
              <dt className="text-brand-slate text-xs uppercase tracking-wide">
                Posted by
              </dt>
              <dd className="font-medium">{problem.poster_name}</dd>
            </div>
          )}
          <div>
            <dt className="text-brand-slate text-xs uppercase tracking-wide">Posted on</dt>
            <dd className="font-medium">{formatDate(problem.created_at)}</dd>
          </div>
        </dl>

        {/* Description */}
        <div className="mt-5 border-t border-gray-100 pt-4">
          <h2 className="text-sm font-semibold text-brand-slate uppercase tracking-wide mb-2">
            Description
          </h2>
          <p className="whitespace-pre-wrap break-words text-sm text-gray-700">
            {problem.description}
          </p>
        </div>

        {/* Evidence */}
        {problem.evidence.length > 0 && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <h2 className="text-sm font-semibold text-brand-slate uppercase tracking-wide mb-2">
              Evidence ({problem.evidence.length})
            </h2>
            <ul className="space-y-1">
              {problem.evidence.map((ev) => (
                <li key={ev.id} className="text-sm">
                  <a
                    href={ev.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-navy hover:text-brand-orange hover:underline"
                  >
                    📎 {ev.file_name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Credibility panel */}
        <div className="mt-5 border-t border-gray-100 pt-4">
          <h2 className="text-sm font-semibold text-brand-slate uppercase tracking-wide mb-2">
            Complaint Strength
          </h2>
          <ul className="space-y-1 text-sm">
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
                className={signal.ok ? "text-brand-green" : "text-gray-400"}
              >
                {signal.ok ? "✓" : "○"} {signal.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Report button */}
        <div className="mt-5 border-t border-brand-smoke pt-4 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Something wrong with this complaint?
          </span>
          <ReportButton
            problemId={problem.id}
            alreadyReported={problem.already_reported}
          />
        </div>
      </div>

      {/* Escalation card */}
      {problem.escalation_links.length > 0 && (
        <div className="mt-6 bg-brand-navy/5 border border-brand-smoke rounded-lg p-5">
          <h2 className="text-sm font-bold text-brand-navy mb-1">
            🚨 Where to escalate this complaint
          </h2>
          <p className="text-xs text-brand-slate mb-4">
            Follow these steps in order. All links are official government portals.
          </p>
          <ol className="space-y-4">
            {problem.escalation_links.map((link, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-navy text-white text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-brand-navy hover:text-brand-orange hover:underline"
                  >
                    {link.name} ↗
                  </a>
                  <p className="text-xs text-brand-slate mt-0.5 leading-relaxed">{link.description}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-gray-400 italic border-t border-brand-smoke pt-3">
            ProbResolve is not affiliated with any of the above portals. Links are provided for consumer awareness only.
          </p>
        </div>
      )}

      <div className="mt-4">
        <Link href="/" className="text-sm text-gray-400 hover:text-brand-navy">
          ← Back to all complaints
        </Link>
      </div>
    </div>
  );
}
