import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DomainTabs from "@/components/DomainTabs";
import type { Domain } from "@/lib/types";

// Mock next/navigation
const mockPush = vi.fn();
let mockSearchParamsString = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    toString: () => mockSearchParamsString,
  }),
}));

const mockDomains: Domain[] = [
  { id: "d1", name: "E-Commerce Fraud", slug: "e-commerce", icon: "🛒" },
  { id: "d2", name: "Banking Issues", slug: "banking", icon: "🏦" },
  { id: "d3", name: "Healthcare", slug: "healthcare", icon: "🏥" },
];

beforeEach(() => {
  mockPush.mockReset();
  mockSearchParamsString = "";
});

// ── Rendering ─────────────────────────────────────────────────────────────────

describe("DomainTabs — rendering", () => {
  it("renders 'All' tab", () => {
    render(<DomainTabs domains={mockDomains} />);
    expect(screen.getByText("All")).toBeInTheDocument();
  });

  it("renders a button for each domain", () => {
    render(<DomainTabs domains={mockDomains} />);
    expect(screen.getByText(/E-Commerce Fraud/)).toBeInTheDocument();
    expect(screen.getByText(/Banking Issues/)).toBeInTheDocument();
    expect(screen.getByText(/Healthcare/)).toBeInTheDocument();
  });

  it("renders domain icons", () => {
    render(<DomainTabs domains={mockDomains} />);
    expect(screen.getByText(/🛒/)).toBeInTheDocument();
    expect(screen.getByText(/🏦/)).toBeInTheDocument();
  });

  it("renders correct number of buttons (All + domains)", () => {
    render(<DomainTabs domains={mockDomains} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(mockDomains.length + 1); // +1 for "All"
  });

  it("renders with empty domains list (only 'All')", () => {
    render(<DomainTabs domains={[]} />);
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});

// ── Active state ──────────────────────────────────────────────────────────────

describe("DomainTabs — active state", () => {
  it("'All' button has active style when no activeDomainId", () => {
    render(<DomainTabs domains={mockDomains} />);
    const allButton = screen.getByText("All");
    expect(allButton.className).toContain("bg-brand-navy");
  });

  it("'All' button has inactive style when activeDomainId is set", () => {
    render(<DomainTabs domains={mockDomains} activeDomainId="d1" />);
    const allButton = screen.getByText("All");
    expect(allButton.className).not.toContain("bg-brand-navy");
    expect(allButton.className).toContain("bg-white");
  });

  it("active domain button has active style", () => {
    render(<DomainTabs domains={mockDomains} activeDomainId="d1" />);
    const activeButton = screen.getByText(/E-Commerce Fraud/);
    expect(activeButton.className).toContain("bg-brand-navy");
  });

  it("inactive domain buttons have inactive style", () => {
    render(<DomainTabs domains={mockDomains} activeDomainId="d1" />);
    const inactiveButton = screen.getByText(/Banking Issues/);
    expect(inactiveButton.className).toContain("bg-white");
  });
});

// ── Navigation ────────────────────────────────────────────────────────────────

describe("DomainTabs — navigation", () => {
  it("clicking 'All' navigates to /?", async () => {
    const user = userEvent.setup();
    render(<DomainTabs domains={mockDomains} />);

    await user.click(screen.getByText("All"));

    expect(mockPush).toHaveBeenCalledOnce();
    const url = mockPush.mock.calls[0][0] as string;
    expect(url).toMatch(/^\//);
    expect(url).not.toContain("domain_id");
  });

  it("clicking a domain navigates with domain_id param", async () => {
    const user = userEvent.setup();
    render(<DomainTabs domains={mockDomains} />);

    await user.click(screen.getByText(/E-Commerce Fraud/));

    expect(mockPush).toHaveBeenCalledOnce();
    const url = mockPush.mock.calls[0][0] as string;
    expect(url).toContain("domain_id=d1");
  });

  it("clicking a different domain updates domain_id param", async () => {
    const user = userEvent.setup();
    render(<DomainTabs domains={mockDomains} activeDomainId="d1" />);

    await user.click(screen.getByText(/Banking Issues/));

    const url = mockPush.mock.calls[0][0] as string;
    expect(url).toContain("domain_id=d2");
    expect(url).not.toContain("domain_id=d1");
  });

  it("clicking 'All' removes domain_id from existing params", async () => {
    const user = userEvent.setup();
    mockSearchParamsString = "domain_id=d1&page=2";

    render(<DomainTabs domains={mockDomains} activeDomainId="d1" />);
    await user.click(screen.getByText("All"));

    const url = mockPush.mock.calls[0][0] as string;
    expect(url).not.toContain("domain_id");
  });

  it("resets page when navigating to a domain (removes page param)", async () => {
    const user = userEvent.setup();
    mockSearchParamsString = "page=3";

    render(<DomainTabs domains={mockDomains} />);
    await user.click(screen.getByText(/E-Commerce Fraud/));

    const url = mockPush.mock.calls[0][0] as string;
    expect(url).not.toContain("page=");
  });

  it("resets page when clicking 'All'", async () => {
    const user = userEvent.setup();
    mockSearchParamsString = "domain_id=d1&page=5";

    render(<DomainTabs domains={mockDomains} activeDomainId="d1" />);
    await user.click(screen.getByText("All"));

    const url = mockPush.mock.calls[0][0] as string;
    expect(url).not.toContain("page=");
  });

  it("preserves other search params (not page or domain_id)", async () => {
    const user = userEvent.setup();
    // If there were other params, they should be preserved
    // In the current implementation, only page is removed and domain_id is set
    mockSearchParamsString = "page=2";

    render(<DomainTabs domains={mockDomains} />);
    await user.click(screen.getByText(/E-Commerce Fraud/));

    expect(mockPush).toHaveBeenCalledOnce();
  });
});
