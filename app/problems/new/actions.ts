"use server";

import { redirect } from "next/navigation";

export async function createProblem(formData: FormData) {
  const API = process.env.API_URL || "http://localhost:8000";

  // Strip empty file entries that browsers add for unselected file inputs
  // (they appear as File objects with size=0 and name="blob")
  const cleaned = new FormData();
  for (const [key, value] of formData.entries()) {
    if (value instanceof File && value.size === 0) continue;
    cleaned.append(key, value);
  }

  const res = await fetch(`${API}/api/problems`, {
    method: "POST",
    body: cleaned,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    // Return error detail for display (422 validation errors from Pydantic)
    const detail = data?.detail;
    if (Array.isArray(detail)) {
      return { error: detail.map((d: { msg: string }) => d.msg).join(". ") };
    }
    return { error: typeof detail === "string" ? detail : "Something went wrong." };
  }

  const { id, slug } = await res.json();
  redirect(`/problems/${id}/${slug}`);
}
