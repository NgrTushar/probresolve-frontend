import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createProblem } from "@/app/problems/new/actions";

// Mock next/navigation so `redirect()` doesn't throw a real navigation error.
// In Next.js, redirect() throws an error with a special type — we capture it.
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    // Simulate the error Next.js throws (so callers can catch it)
    throw Object.assign(new Error("NEXT_REDIRECT"), { digest: `NEXT_REDIRECT;replace;${url};303;` });
  },
}));

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockRedirect.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
  mockFetch.mockReset();
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeFormData(overrides: Record<string, string | File> = {}): FormData {
  const fd = new FormData();
  fd.append("domain_id", "domain-uuid-001");
  fd.append("title", "Test Complaint Title");
  fd.append("description", "A".repeat(200));
  fd.append("poster_name", "Test User");
  fd.append("poster_email", "test@example.com");
  fd.append("poster_phone", "9876543210");
  for (const [key, value] of Object.entries(overrides)) {
    fd.append(key, value);
  }
  return fd;
}

function mockSuccessResponse(id = "abc-123", slug = "test-problem") {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ id, slug }),
  });
}

function mockErrorResponse(status: number, detail: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ detail }),
  });
}

// ── Successful submission ─────────────────────────────────────────────────────

describe("createProblem — successful submission", () => {
  it("calls fetch with POST method to /api/problems", async () => {
    mockSuccessResponse();

    try {
      await createProblem(makeFormData());
    } catch {
      // redirect throws — expected
    }

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/problems");
    expect(opts?.method).toBe("POST");
  });

  it("redirects to /problems/{id}/{slug} on success", async () => {
    mockSuccessResponse("prob-id-1", "my-complaint");

    try {
      await createProblem(makeFormData());
    } catch {
      // redirect throws — expected
    }

    expect(mockRedirect).toHaveBeenCalledWith("/problems/prob-id-1/my-complaint");
  });

  it("sends FormData as body (not JSON)", async () => {
    mockSuccessResponse();

    try {
      await createProblem(makeFormData());
    } catch {
      // redirect throws
    }

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts?.body).toBeInstanceOf(FormData);
  });
});

// ── Empty file stripping ──────────────────────────────────────────────────────

describe("createProblem — strips empty file entries", () => {
  it("removes File entries with size=0 from FormData", async () => {
    mockSuccessResponse();

    const fd = makeFormData();
    const emptyFile = new File([], "blob", { type: "application/octet-stream" });
    Object.defineProperty(emptyFile, "size", { value: 0 });
    fd.append("files", emptyFile);

    try {
      await createProblem(fd);
    } catch {
      // redirect
    }

    // The body passed to fetch should not contain the empty file
    const [, opts] = mockFetch.mock.calls[0];
    const cleanedFd = opts?.body as FormData;
    const files = cleanedFd.getAll("files");
    // All remaining file entries must have size > 0
    for (const file of files) {
      if (file instanceof File) {
        expect(file.size).toBeGreaterThan(0);
      }
    }
  });

  it("keeps non-empty File entries", async () => {
    mockSuccessResponse();

    const fd = makeFormData();
    const realFile = new File(["content"], "proof.pdf", { type: "application/pdf" });
    fd.append("files", realFile);

    try {
      await createProblem(fd);
    } catch {
      // redirect
    }

    const [, opts] = mockFetch.mock.calls[0];
    const cleanedFd = opts?.body as FormData;
    const files = cleanedFd.getAll("files");
    expect(files.length).toBeGreaterThan(0);
  });

  it("keeps non-File form fields (strings)", async () => {
    mockSuccessResponse();

    // Use location_state which is not set by makeFormData's base payload
    const fd = makeFormData({ location_state: "Maharashtra" });

    try {
      await createProblem(fd);
    } catch {
      // redirect
    }

    const [, opts] = mockFetch.mock.calls[0];
    const cleanedFd = opts?.body as FormData;
    expect(cleanedFd.get("location_state")).toBe("Maharashtra");
  });
});

// ── Error handling — string detail ───────────────────────────────────────────

describe("createProblem — 422 string detail", () => {
  it("returns { error } with string detail", async () => {
    mockErrorResponse(422, "Enter a valid 10-digit Indian mobile number");

    const result = await createProblem(makeFormData());

    expect(result).toEqual({ error: "Enter a valid 10-digit Indian mobile number" });
  });

  it("does not redirect on error", async () => {
    mockErrorResponse(422, "Some validation error");

    await createProblem(makeFormData());

    expect(mockRedirect).not.toHaveBeenCalled();
  });
});

// ── Error handling — array detail ────────────────────────────────────────────

describe("createProblem — 422 array detail", () => {
  it("joins array detail messages with '. '", async () => {
    mockErrorResponse(422, [
      { msg: "title cannot be empty" },
      { msg: "Please describe in more detail" },
    ]);

    const result = await createProblem(makeFormData());

    expect(result).toEqual({ error: "title cannot be empty. Please describe in more detail" });
  });

  it("returns single message for single-item array", async () => {
    mockErrorResponse(422, [{ msg: "Full name is required" }]);

    const result = await createProblem(makeFormData());

    expect(result).toEqual({ error: "Full name is required" });
  });
});

// ── Error handling — unknown/missing detail ───────────────────────────────────

describe("createProblem — fallback error", () => {
  it("returns generic message when detail is missing", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const result = await createProblem(makeFormData());

    expect(result).toEqual({ error: "Something went wrong." });
  });

  it("returns generic message when detail is a non-string/array type", async () => {
    mockErrorResponse(500, 12345);

    const result = await createProblem(makeFormData());

    expect(result).toEqual({ error: "Something went wrong." });
  });

  it("handles JSON parse failure gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => { throw new Error("JSON parse error"); },
    });

    const result = await createProblem(makeFormData());

    expect(result).toEqual({ error: "Something went wrong." });
  });
});

// ── API URL ──────────────────────────────────────────────────────────────────

describe("createProblem — API URL", () => {
  it("posts to http://localhost:8000/api/problems by default", async () => {
    mockSuccessResponse();

    try {
      await createProblem(makeFormData());
    } catch {
      // redirect
    }

    const [url] = mockFetch.mock.calls[0];
    expect(url).toMatch(/http:\/\/localhost:8000\/api\/problems/);
  });
});
