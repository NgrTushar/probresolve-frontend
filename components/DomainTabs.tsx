"use client";

import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Domain } from "@/lib/types";

export default function DomainTabs({
  domains,
  activeDomainId,
  basePath = "/",
}: {
  domains: Domain[];
  activeDomainId?: string;
  basePath?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);

  function navigate(domainId?: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (domainId) {
      params.set("domain_id", domainId);
    } else {
      params.delete("domain_id");
    }
    router.push(`${basePath}?${params.toString()}`);
  }

  function scroll(dir: "left" | "right") {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  }

  const btnBase = "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap";
  const btnActive = "bg-brand-navy text-white";
  const btnInactive = "bg-dark-surface border border-dark-border text-dark-muted hover:border-brand-navy hover:text-dark-pop";

  return (
    <div className="relative flex items-center gap-1 mb-6">
      {/* Left arrow */}
      <button
        onClick={() => scroll("left")}
        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-dark-surface border border-dark-border text-dark-muted hover:text-dark-pop hover:border-brand-navy transition-colors"
        aria-label="Scroll left"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Scrollable tabs */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide"
      >
        <button
          onClick={() => navigate()}
          className={`${btnBase} ${!activeDomainId ? btnActive : btnInactive}`}
        >
          All
        </button>
        {domains.map((d) => (
          <button
            key={d.id}
            onClick={() => navigate(d.id)}
            className={`${btnBase} ${activeDomainId === d.id ? btnActive : btnInactive}`}
          >
            {d.icon} {d.name}
          </button>
        ))}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll("right")}
        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-dark-surface border border-dark-border text-dark-muted hover:text-dark-pop hover:border-brand-navy transition-colors"
        aria-label="Scroll right"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
