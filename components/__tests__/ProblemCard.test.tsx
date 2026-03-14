import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ProblemCard from "@/components/ProblemCard";
import type { ProblemListItem } from "@/lib/types";

// next/link needs to render as a plain anchor in tests
vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

const baseProblem: ProblemListItem = {
  id: "problem-uuid-001",
  title: "Amazon Seller Sent Wrong Product",
  slug: "amazon-seller-sent-wrong-product",
  domain: { id: "d1", name: "E-Commerce Fraud", slug: "e-commerce", icon: "🛒" },
  category: { id: "cat1", name: "Product Delivery", slug: "product-delivery" },
  company: { id: "c1", name: "Amazon India" },
  is_resolved: false,
  is_verified: false,
  flags_cleared: false,
  upvote_count: 12,
  report_count: 0,
  amount_lost: 45000,
  poster_name: "Rahul Kumar",
  location_state: "Maharashtra",
  date_of_incident: "2026-01-10",
  created_at: "2026-01-15T10:00:00Z",
};

// ── Basic rendering ───────────────────────────────────────────────────────────

describe("ProblemCard — basic rendering", () => {
  it("renders the problem title", () => {
    render(<ProblemCard problem={baseProblem} />);
    expect(screen.getByText("Amazon Seller Sent Wrong Product")).toBeInTheDocument();
  });

  it("renders the upvote count", () => {
    render(<ProblemCard problem={baseProblem} />);
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders the domain name", () => {
    render(<ProblemCard problem={baseProblem} />);
    expect(screen.getByText(/E-Commerce Fraud/)).toBeInTheDocument();
  });

  it("renders the domain icon", () => {
    render(<ProblemCard problem={baseProblem} />);
    expect(screen.getByText(/🛒/)).toBeInTheDocument();
  });

  it("renders the category name", () => {
    render(<ProblemCard problem={baseProblem} />);
    expect(screen.getByText("Product Delivery")).toBeInTheDocument();
  });

  it("renders the company name", () => {
    render(<ProblemCard problem={baseProblem} />);
    expect(screen.getByText(/Amazon India/)).toBeInTheDocument();
  });

  it("renders the location state", () => {
    render(<ProblemCard problem={baseProblem} />);
    expect(screen.getByText(/Maharashtra/)).toBeInTheDocument();
  });

  it("renders the formatted amount", () => {
    render(<ProblemCard problem={baseProblem} />);
    // Amount 45000 should be formatted as ₹45,000
    expect(screen.getByText(/45,000/)).toBeInTheDocument();
  });

  it("renders the created_at date", () => {
    render(<ProblemCard problem={baseProblem} />);
    // Some date representation should be present
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });
});

// ── Link construction ─────────────────────────────────────────────────────────

describe("ProblemCard — link construction", () => {
  it("links to /problems/{id}/{slug}", () => {
    render(<ProblemCard problem={baseProblem} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/problems/problem-uuid-001/amazon-seller-sent-wrong-product");
  });

  it("title is inside the link", () => {
    render(<ProblemCard problem={baseProblem} />);
    const link = screen.getByRole("link");
    expect(link).toHaveTextContent("Amazon Seller Sent Wrong Product");
  });
});

// ── Optional fields ───────────────────────────────────────────────────────────

describe("ProblemCard — optional fields", () => {
  it("omits company when null", () => {
    render(<ProblemCard problem={{ ...baseProblem, company: null }} />);
    expect(screen.queryByText(/Amazon India/)).not.toBeInTheDocument();
  });

  it("omits category when null", () => {
    render(<ProblemCard problem={{ ...baseProblem, category: null }} />);
    expect(screen.queryByText("Product Delivery")).not.toBeInTheDocument();
  });

  it("omits amount when null", () => {
    render(<ProblemCard problem={{ ...baseProblem, amount_lost: null }} />);
    expect(screen.queryByText(/45,000/)).not.toBeInTheDocument();
  });

  it("omits location when null", () => {
    render(<ProblemCard problem={{ ...baseProblem, location_state: null }} />);
    expect(screen.queryByText(/Maharashtra/)).not.toBeInTheDocument();
  });
});

// ── Status badges ─────────────────────────────────────────────────────────────

describe("ProblemCard — status badges", () => {
  it("shows 'Admin Verified' badge when is_verified=true", () => {
    render(<ProblemCard problem={{ ...baseProblem, is_verified: true }} />);
    expect(screen.getByText(/Admin Verified/)).toBeInTheDocument();
  });

  it("does not show 'Admin Verified' when is_verified=false", () => {
    render(<ProblemCard problem={{ ...baseProblem, is_verified: false }} />);
    expect(screen.queryByText(/Admin Verified/)).not.toBeInTheDocument();
  });

  it("shows 'Resolved' badge when is_resolved=true", () => {
    render(<ProblemCard problem={{ ...baseProblem, is_resolved: true }} />);
    expect(screen.getByText(/Resolved/)).toBeInTheDocument();
  });

  it("does not show 'Resolved' badge when is_resolved=false", () => {
    render(<ProblemCard problem={{ ...baseProblem, is_resolved: false }} />);
    expect(screen.queryByText(/✓ Resolved/)).not.toBeInTheDocument();
  });

  it("shows 'Under Review' badge when report_count>=5 and not flags_cleared and not verified", () => {
    const problem = {
      ...baseProblem,
      report_count: 5,
      flags_cleared: false,
      is_verified: false,
    };
    render(<ProblemCard problem={problem} />);
    expect(screen.getByText(/Under Review/)).toBeInTheDocument();
  });

  it("does not show 'Under Review' when report_count<5", () => {
    const problem = {
      ...baseProblem,
      report_count: 4,
      flags_cleared: false,
      is_verified: false,
    };
    render(<ProblemCard problem={problem} />);
    expect(screen.queryByText(/Under Review/)).not.toBeInTheDocument();
  });

  it("does not show 'Under Review' when flags_cleared=true", () => {
    const problem = {
      ...baseProblem,
      report_count: 10,
      flags_cleared: true,
      is_verified: false,
    };
    render(<ProblemCard problem={problem} />);
    expect(screen.queryByText(/Under Review/)).not.toBeInTheDocument();
  });

  it("does not show 'Under Review' when is_verified=true", () => {
    const problem = {
      ...baseProblem,
      report_count: 10,
      flags_cleared: false,
      is_verified: true,
    };
    render(<ProblemCard problem={problem} />);
    expect(screen.queryByText(/Under Review/)).not.toBeInTheDocument();
  });

  it("can show both 'Verified' and 'Resolved' badges simultaneously", () => {
    render(<ProblemCard problem={{ ...baseProblem, is_verified: true, is_resolved: true }} />);
    expect(screen.getByText(/Admin Verified/)).toBeInTheDocument();
    expect(screen.getByText(/Resolved/)).toBeInTheDocument();
  });
});

// ── upvote_count edge cases ───────────────────────────────────────────────────

describe("ProblemCard — upvote count", () => {
  it("renders 0 upvotes", () => {
    render(<ProblemCard problem={{ ...baseProblem, upvote_count: 0 }} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders large upvote count", () => {
    render(<ProblemCard problem={{ ...baseProblem, upvote_count: 999 }} />);
    expect(screen.getByText("999")).toBeInTheDocument();
  });
});
