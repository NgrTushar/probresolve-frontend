import Link from "next/link";
import ProblemCard from "@/components/ProblemCard";
import { searchProblems } from "@/lib/api";

type SearchParams = Promise<{ q?: string; page?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams;
  return { title: q ? `"${q}" — ProbResolve Search` : "Search — ProbResolve" };
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = "", page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);

  const problems = q.trim() ? await searchProblems(q.trim(), page) : [];

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = problems.length === 20 ? page + 1 : null;

  function pageUrl(p: number) {
    return `/search?q=${encodeURIComponent(q)}&page=${p}`;
  }

  return (
    <>
      {/* Search bar */}
      <form action="/search" method="get" className="mb-6 flex">
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search complaints…"
          autoFocus
          className="flex-1 border border-gray-300 rounded-l px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy"
        />
        <button
          type="submit"
          className="bg-brand-navy text-white px-4 py-2 text-sm rounded-r hover:bg-brand-navy/90"
        >
          Search
        </button>
      </form>

      {q.trim() ? (
        <>
          <h1 className="text-lg font-bold text-brand-navy mb-4">
            {problems.length === 0
              ? `No results for "${q}"`
              : `Results for "${q}"`}
          </h1>

          <div className="space-y-4">
            {problems.map((p) => (
              <ProblemCard key={p.id} problem={p} />
            ))}
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
                  Next →
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-400 text-sm text-center py-12">
          Enter a search term above to find complaints.
        </p>
      )}

      <div className="mt-6">
        <Link href="/" className="text-sm text-gray-400 hover:text-brand-navy">
          ← Back to all complaints
        </Link>
      </div>
    </>
  );
}
