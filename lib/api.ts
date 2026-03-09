import type { Category, Domain, ProblemDetail, ProblemListItem } from "./types";

// Server-side base URL (used in Server Components + Server Actions)
const API = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getDomains(): Promise<Domain[]> {
  const res = await fetch(`${API}/api/domains`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function getProblems(
  page = 1,
  domain_id?: string
): Promise<ProblemListItem[]> {
  const params = new URLSearchParams({ page: String(page) });
  if (domain_id) params.set("domain_id", domain_id);
  const res = await fetch(`${API}/api/problems?${params}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function getProblem(
  id: string,
  ip: string,
  ua: string
): Promise<ProblemDetail | null> {
  const res = await fetch(`${API}/api/problems/${id}`, {
    cache: "no-store",
    headers: {
      "X-Real-IP": ip,
      "User-Agent": ua,
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

export async function searchProblems(
  q: string,
  page = 1
): Promise<ProblemListItem[]> {
  if (!q.trim()) return [];
  const params = new URLSearchParams({ q, page: String(page) });
  const res = await fetch(`${API}/api/search?${params}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}
