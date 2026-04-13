import { Suspense } from "react";
import Link from "next/link";
import DomainTabs from "@/components/DomainTabs";
import CompanyScoreCard from "@/components/CompanyScoreCard";
import { getDomains, getScoreboard } from "@/lib/api";

export const metadata = {
  title: "Company Scoreboard — ProbResolve",
  description: "See which companies have the most consumer complaints and total losses reported on ProbResolve.",
};

type SearchParams = Promise<{ domain_id?: string; sort?: string }>;

export default async function ScoreboardPage({ searchParams }: { searchParams: SearchParams }) {
  const { domain_id, sort = "complaints" } = await searchParams;
  const validSort = sort === "amount" ? "amount" : "complaints";

  const [domains, companies] = await Promise.all([
    getDomains(),
    getScoreboard(domain_id, validSort as "complaints" | "amount"),
  ]);

  function sortUrl(newSort: string) {
    const params = new URLSearchParams();
    if (domain_id) params.set("domain_id", domain_id);
    params.set("sort", newSort);
    return `/scoreboard?${params.toString()}`;
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark-pop mb-2">Company Scoreboard</h1>
        <p className="text-dark-muted text-sm mb-4">
          Companies ranked by consumer complaints. Hold them accountable.
        </p>

        {/* Sort toggle */}
        <div className="flex gap-3 text-sm">
          <Link
            href={sortUrl("complaints")}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
              validSort === "complaints"
                ? "bg-brand-navy text-white"
                : "bg-dark-surface border border-dark-border text-dark-muted hover:text-dark-pop"
            }`}
          >
            By Complaints
          </Link>
          <Link
            href={sortUrl("amount")}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
              validSort === "amount"
                ? "bg-brand-navy text-white"
                : "bg-dark-surface border border-dark-border text-dark-muted hover:text-dark-pop"
            }`}
          >
            By ₹ Lost
          </Link>
        </div>
      </div>

      {/* Domain filter */}
      <Suspense fallback={null}>
        <DomainTabs domains={domains} activeDomainId={domain_id} basePath="/scoreboard" />
      </Suspense>

      {/* Grid */}
      {companies.length === 0 ? (
        <p className="text-dark-muted text-center py-12">
          No companies found for this filter.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((c, i) => (
            <CompanyScoreCard key={c.id} company={c} rank={i + 1} />
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link href="/" className="text-sm text-dark-muted hover:text-dark-pop">
          ← Back to complaints
        </Link>
      </div>
    </>
  );
}
