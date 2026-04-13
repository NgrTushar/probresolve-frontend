"use client";

import { useState } from "react";

export default function UpvoteButton({
  problemId,
  initialCount,
  alreadyVoted,
}: {
  problemId: string;
  initialCount: number;
  alreadyVoted: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState(alreadyVoted);
  const [loading, setLoading] = useState(false);

  async function handleUpvote() {
    if (voted || loading) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/problems/${problemId}/upvote`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        setCount(data.upvote_count);
        setVoted(data.already_voted);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleUpvote}
      disabled={voted || loading}
      className={`flex flex-col items-center transition-colors ${
        voted ? "text-brand-green cursor-default" : "text-dark-muted hover:text-brand-green"
      }`}
      title={voted ? "You voted" : "Upvote"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6"
        fill={voted ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
      <span className="text-sm font-bold text-brand-green">{count}</span>
      <span className={`text-xs mt-0.5 ${voted ? "text-brand-green" : ""}`}>
        {voted ? "Voted" : "Upvote"}
      </span>
    </button>
  );
}
