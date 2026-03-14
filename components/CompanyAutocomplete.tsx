"use client";

import { useState, useEffect } from "react";
import type { Company } from "@/lib/types";

interface Props {
  domainId: string | null;
  key?: string | number;
}

export default function CompanyAutocomplete({ domainId }: Props) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [query, setQuery] = useState("");
  const disabled = !domainId;

  useEffect(() => {
    setQuery("");
    setCompanies([]);
  }, [domainId]);

  useEffect(() => {
    if (!domainId) return;
    const timeout = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query, domain_id: domainId });
        const url = `${process.env.NEXT_PUBLIC_API_URL || ""}/api/companies?${params}`;
        const res = await fetch(url);
        if (res.ok) setCompanies(await res.json());
      } catch {
        // ignore fetch errors
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [query, domainId]);

  return (
    <div>
      <label
        htmlFor="company_name"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Target Entity / Company
      </label>
      <input
        type="text"
        name="company_name"
        id="company_name"
        list="company-list"
        disabled={disabled}
        placeholder={
          disabled
            ? "Select a domain first"
            : "e.g. Amazon India, HDFC Bank..."
        }
        className={`w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy ${disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />
      <datalist id="company-list">
        {companies.map((c) => (
          <option key={c.id} value={c.name} />
        ))}
        {query.trim() &&
          !companies.find(
            (c) => c.name.toLowerCase() === query.trim().toLowerCase()
          ) && (
            <option value={query.trim()}>
              Add &quot;{query.trim()}&quot; as a new company
            </option>
          )}
      </datalist>
      <p className="mt-1 text-xs text-gray-500">
        {disabled
          ? "Choose a domain above to see relevant companies."
          : "Leave blank if not applicable. Search or type the name manually."}
      </p>
    </div>
  );
}
