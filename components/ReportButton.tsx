"use client";

import { useState } from "react";

const REASONS = [
  { value: "fake", label: "Fake complaint" },
  { value: "defamatory", label: "Defamatory content" },
  { value: "duplicate", label: "Duplicate post" },
  { value: "other", label: "Other" },
];

export default function ReportButton({
  problemId,
  alreadyReported,
}: {
  problemId: string;
  alreadyReported: boolean;
}) {
  const [reported, setReported] = useState(alreadyReported);
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("fake");
  const [loading, setLoading] = useState(false);

  async function handleReport() {
    if (loading) return;
    setLoading(true);
    try {
      const body = new URLSearchParams({ reason });
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/problems/${problemId}/report`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        }
      );
      if (res.ok) {
        setReported(true);
        setShowForm(false);
      }
    } finally {
      setLoading(false);
    }
  }

  if (reported) {
    return (
      <span className="text-sm text-gray-400 cursor-default">🚩 Reported</span>
    );
  }

  if (showForm) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy"
        >
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleReport}
          disabled={loading}
          className="bg-brand-orange text-white px-3 py-1 rounded text-sm hover:bg-brand-orange/90 disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit"}
        </button>
        <button
          onClick={() => setShowForm(false)}
          className="text-gray-400 hover:text-brand-slate text-sm"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="text-sm text-gray-400 hover:text-brand-orange transition-colors"
    >
      🚩 Report
    </button>
  );
}
