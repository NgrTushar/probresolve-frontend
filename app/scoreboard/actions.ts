"use server";

import type { CategoryScore } from "@/lib/types";

const API = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchCategoryBreakdown(companyId: string): Promise<CategoryScore[]> {
  try {
    const res = await fetch(`${API}/api/scoreboard/${companyId}/categories`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
