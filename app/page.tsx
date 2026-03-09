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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-navy">Recent Complaints</h1>
        <p className="text-brand-slate text-sm mt-1">
          Browse fraud reports from across India. Upvote to amplify.
        </p>
      </div>

      {/* Domain filter tabs */}
      <Suspense fallback={null}>
        <DomainTabs domains={domains} activeDomainId={domain_id} />
      </Suspense>

      {/* Problem list */}
      <div className="space-y-4">
        {problems.length === 0 ? (
          <p className="text-gray-500 py-12 text-center">
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
              className="bg-white border border-brand-smoke text-brand-navy px-6 py-2 rounded hover:bg-brand-mist text-sm"
            >
              ← Previous
            </Link>
          )}
          {nextPage && (
            <Link
              href={pageUrl(nextPage)}
              className="bg-white border border-brand-smoke text-brand-navy px-6 py-2 rounded hover:bg-brand-mist text-sm"
            >
              Load more →
            </Link>
          )}
        </div>
      )}
    </>
  );
}
