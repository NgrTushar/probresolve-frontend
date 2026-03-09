"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Domain } from "@/lib/types";

export default function DomainTabs({
  domains,
  activeDomainId,
}: {
  domains: Domain[];
  activeDomainId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(domainId?: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page"); // reset to page 1 on filter change
    if (domainId) {
      params.set("domain_id", domainId);
    } else {
      params.delete("domain_id");
    }
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => navigate()}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          !activeDomainId
            ? "bg-brand-navy text-white"
            : "bg-white border border-gray-200 text-gray-600 hover:border-brand-navy hover:text-brand-navy"
        }`}
      >
        All
      </button>
      {domains.map((d) => (
        <button
          key={d.id}
          onClick={() => navigate(d.id)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeDomainId === d.id
              ? "bg-brand-navy text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:border-brand-navy hover:text-brand-navy"
          }`}
        >
          {d.icon} {d.name}
        </button>
      ))}
    </div>
  );
}
