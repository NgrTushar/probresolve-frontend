import { Suspense } from "react";
import Link from "next/link";
import ProblemCard from "@/components/ProblemCard";
import DomainTabs from "@/components/DomainTabs";
import { getDomains, getProblems } from "@/lib/api";

export const metadata = {
  title: "ProbResolve — Consumer Complaints India",
};

type SearchParams = Promise<{ domain_id?: string; page?: string }>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const { domain_id, page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);

  const [domains, problems] = await Promise.all([
    getDomains(),
    getProblems(page, domain_id),
  ]);

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = problems.length === 20 ? page + 1 : null;

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (domain_id) params.set("domain_id", domain_id);
    params.set("page", String(p));
    return `/?${params.toString()}`;
  }

  return (
    <>
      {/* Hero section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-pop mb-2">Consumer Complaint Board</h1>
        <p className="text-dark-muted text-sm mb-6">
          Browse fraud reports from across India. Upvote to amplify. Hold companies accountable.
        </p>
        <form action="/search" method="get" className="flex max-w-xl mb-4">
          <input
            name="q"
            type="search"
            placeholder="Search company names, fraud types…"
            className="flex-1 bg-dark-surface border border-dark-border rounded-l-lg px-4 py-3 text-sm text-dark-pop placeholder:text-dark-muted focus:outline-none focus:ring-1 focus:ring-brand-navy"
          />
          <button
            type="submit"
            className="bg-brand-navy text-white px-5 py-3 text-sm font-medium rounded-r-lg hover:bg-brand-navy/90"
          >
            Search
          </button>
        </form>
        <Link
          href="/scoreboard"
          className="text-brand-green hover:text-brand-green/80 text-sm font-medium"
        >
          View Scoreboard →
        </Link>
      </div>

      {/* Domain filter tabs */}
      <Suspense fallback={null}>
        <DomainTabs domains={domains} activeDomainId={domain_id} />
      </Suspense>

      {/* Problem list */}
      <div className="space-y-4">
        {problems.length === 0 ? (
          <p className="text-dark-muted py-12 text-center">
            No complaints yet.{" "}
            <Link href="/problems/new" className="text-brand-orange hover:underline">
              Be the first to post one.
            </Link>
          </p>
        ) : (
          problems.map((p) => <ProblemCard key={p.id} problem={p} />)
        )}
      </div>

      {/* Pagination */}
      {(prevPage || nextPage) && (
        <div className="mt-8 flex justify-center gap-4">
          {prevPage && (
            <Link
              href={pageUrl(prevPage)}
              className="bg-dark-surface border border-dark-border text-dark-pop px-6 py-2 rounded hover:bg-dark-border/50 text-sm"
            >
              ← Previous
            </Link>
          )}
          {nextPage && (
            <Link
              href={pageUrl(nextPage)}
              className="bg-dark-surface border border-dark-border text-dark-pop px-6 py-2 rounded hover:bg-dark-border/50 text-sm"
            >
              Load more →
            </Link>
          )}
        </div>
      )}
    </>
  );
}
