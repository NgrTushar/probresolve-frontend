import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getDomains, getProblems, getProblem, searchProblems } from "@/lib/api";

// Mock fetch globally
const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
  mockFetch.mockReset();
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function mockOkResponse(data: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => data,
  });
}

function mockErrorResponse(status = 500) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ detail: "Error" }),
  });
}

const mockDomains = [
  { id: "d1", name: "E-Commerce Fraud", slug: "e-commerce", icon: "🛒" },
  { id: "d2", name: "Banking", slug: "banking", icon: "🏦" },
];

const mockProblemList = [
  {
    id: "p1",
    title: "Test Problem 1",
    slug: "test-problem-1",
    domain: { id: "d1", name: "E-Commerce Fraud", slug: "e-commerce", icon: "🛒" },
    category: null,
    company: null,
    is_resolved: false,
    is_verified: false,
    flags_cleared: false,
    upvote_count: 5,
    report_count: 0,
    amount_lost: 10000,
    poster_name: "Test User",
    location_state: "Maharashtra",
    date_of_incident: null,
    created_at: "2026-01-15T10:00:00Z",
  },
];

const mockProblemDetail = {
  ...mockProblemList[0],
  description: "Detailed description of the problem for the detail page.",
  evidence: [],
  has_email: true,
  already_voted: false,
  already_reported: false,
  escalation_links: [
    { name: "Consumer Helpline", url: "https://consumerhelpline.gov.in", description: "File a complaint" },
  ],
};

// ── getDomains ────────────────────────────────────────────────────────────────

describe("getDomains", () => {
  it("returns array of domains on success", async () => {
    mockOkResponse(mockDomains);
    const result = await getDomains();
    expect(result).toEqual(mockDomains);
  });

  it("returns empty array on server error", async () => {
    mockErrorResponse(500);
    const result = await getDomains();
    expect(result).toEqual([]);
  });

  it("returns empty array on 404", async () => {
    mockErrorResponse(404);
    const result = await getDomains();
    expect(result).toEqual([]);
  });

  it("calls the correct endpoint", async () => {
    mockOkResponse([]);
    await getDomains();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/domains");
  });

  it("uses cache: no-store", async () => {
    mockOkResponse([]);
    await getDomains();
    const [, options] = mockFetch.mock.calls[0];
    expect(options?.cache).toBe("no-store");
  });

  it("returns empty array when network throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    // getDomains doesn't have a try/catch, so this would throw
    // We test the error is propagated (or caught at call site)
    await expect(getDomains()).rejects.toThrow("Network error");
  });
});

// ── getProblems ───────────────────────────────────────────────────────────────

describe("getProblems", () => {
  it("returns problem list on success", async () => {
    mockOkResponse(mockProblemList);
    const result = await getProblems();
    expect(result).toEqual(mockProblemList);
  });

  it("returns empty array on server error", async () => {
    mockErrorResponse(500);
    const result = await getProblems();
    expect(result).toEqual([]);
  });

  it("includes page parameter in URL", async () => {
    mockOkResponse([]);
    await getProblems(2);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("page=2");
  });

  it("defaults to page 1", async () => {
    mockOkResponse([]);
    await getProblems();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("page=1");
  });

  it("includes domain_id when provided", async () => {
    mockOkResponse([]);
    await getProblems(1, "domain-uuid-123");
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("domain_id=domain-uuid-123");
  });

  it("omits domain_id when not provided", async () => {
    mockOkResponse([]);
    await getProblems(1);
    const [url] = mockFetch.mock.calls[0];
    expect(url).not.toContain("domain_id");
  });

  it("calls /api/problems endpoint", async () => {
    mockOkResponse([]);
    await getProblems();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/problems");
  });
});

// ── getProblem ────────────────────────────────────────────────────────────────

describe("getProblem", () => {
  it("returns problem detail on success", async () => {
    mockOkResponse(mockProblemDetail);
    const result = await getProblem("p1", "1.2.3.4", "TestAgent");
    expect(result).toEqual(mockProblemDetail);
  });

  it("returns null on 404", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) });
    const result = await getProblem("nonexistent", "1.2.3.4", "TestAgent");
    expect(result).toBeNull();
  });

  it("returns null on other server errors", async () => {
    mockErrorResponse(500);
    const result = await getProblem("p1", "1.2.3.4", "TestAgent");
    expect(result).toBeNull();
  });

  it("sends X-Real-IP header", async () => {
    mockOkResponse(mockProblemDetail);
    await getProblem("p1", "10.0.0.1", "TestAgent");
    const [, options] = mockFetch.mock.calls[0];
    expect(options?.headers?.["X-Real-IP"]).toBe("10.0.0.1");
  });

  it("sends User-Agent header", async () => {
    mockOkResponse(mockProblemDetail);
    await getProblem("p1", "1.2.3.4", "Mozilla/5.0 Firefox");
    const [, options] = mockFetch.mock.calls[0];
    expect(options?.headers?.["User-Agent"]).toBe("Mozilla/5.0 Firefox");
  });

  it("calls the correct URL with problem ID", async () => {
    mockOkResponse(mockProblemDetail);
    await getProblem("abc-123", "1.2.3.4", "Agent");
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/problems/abc-123");
  });

  it("uses cache: no-store", async () => {
    mockOkResponse(mockProblemDetail);
    await getProblem("p1", "1.2.3.4", "Agent");
    const [, options] = mockFetch.mock.calls[0];
    expect(options?.cache).toBe("no-store");
  });
});

// ── searchProblems ────────────────────────────────────────────────────────────

describe("searchProblems", () => {
  it("returns search results on success", async () => {
    mockOkResponse(mockProblemList);
    const result = await searchProblems("fraud");
    expect(result).toEqual(mockProblemList);
  });

  it("returns empty array for empty query without fetching", async () => {
    const result = await searchProblems("");
    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns empty array for whitespace-only query without fetching", async () => {
    const result = await searchProblems("   ");
    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns empty array on server error", async () => {
    mockErrorResponse(500);
    const result = await searchProblems("test");
    expect(result).toEqual([]);
  });

  it("includes query param in URL", async () => {
    mockOkResponse([]);
    await searchProblems("flipkart fraud");
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("q=flipkart+fraud");
  });

  it("includes page param in URL", async () => {
    mockOkResponse([]);
    await searchProblems("test", 3);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("page=3");
  });

  it("defaults to page 1", async () => {
    mockOkResponse([]);
    await searchProblems("test");
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("page=1");
  });

  it("calls /api/search endpoint", async () => {
    mockOkResponse([]);
    await searchProblems("test");
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/search");
  });
});
