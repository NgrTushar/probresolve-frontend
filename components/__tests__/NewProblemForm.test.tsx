import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import NewProblemForm from "@/components/NewProblemForm";
import type { Domain } from "@/lib/types";

// Hoist mock so it runs before imports
vi.mock("@/app/problems/new/actions", () => ({
  createProblem: vi.fn(),
}));

import { createProblem } from "@/app/problems/new/actions";
const mockCreateProblem = createProblem as ReturnType<typeof vi.fn>;

// ── Shared fixtures ──────────────────────────────────────────────────────────

const mockDomains: Domain[] = [
  { id: "domain-1", name: "E-Commerce Fraud", slug: "ecommerce", icon: "🛒" },
];

function makeFile(name: string, sizeMB: number, type = "application/pdf"): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: sizeMB * 1024 * 1024 });
  return file;
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/title/i), "Test Fraud Title");
  await user.type(screen.getByLabelText(/what happened/i), "A".repeat(150));
  await user.type(screen.getByLabelText(/full name/i), "Test User");
  await user.type(screen.getByLabelText(/email/i), "test@example.com");
  await user.type(screen.getByLabelText(/mobile number/i), "9876543210");
}

function getFileInput(): HTMLInputElement {
  const input = document.querySelector('input[type="file"]');
  if (!input) throw new Error("File input not found in DOM");
  return input as HTMLInputElement;
}

function changeFiles(files: File[]) {
  fireEvent.change(getFileInput(), { target: { files } });
}

// ── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  mockCreateProblem.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ── A. File Size Validation ──────────────────────────────────────────────────

describe("file size validation", () => {
  it("A1: single 11 MB file → error + counter stays 0/5", () => {
    render(<NewProblemForm domains={mockDomains} />);
    const big = makeFile("big.pdf", 11);
    changeFiles([big]);
    expect(screen.getByText(/big\.pdf/)).toBeInTheDocument();
    expect(screen.getByText(/exceed 10 MB/i)).toBeInTheDocument();
    expect(screen.getByText(/0\/5/)).toBeInTheDocument();
  });

  it("A2: single 1 MB file → no error + in list + 1/5", () => {
    render(<NewProblemForm domains={mockDomains} />);
    changeFiles([makeFile("good.pdf", 1)]);
    expect(screen.queryByText(/exceed 10 MB/i)).not.toBeInTheDocument();
    expect(screen.getByText(/good\.pdf/)).toBeInTheDocument();
    expect(screen.getByText(/1\/5/)).toBeInTheDocument();
  });

  it("A3: 2 valid + 1 oversized → error names only oversized; both valid in list; 2/5", () => {
    render(<NewProblemForm domains={mockDomains} />);
    const v1 = makeFile("valid1.pdf", 1);
    const v2 = makeFile("valid2.pdf", 2);
    const big = makeFile("toobig.pdf", 15);
    changeFiles([v1, v2, big]);
    expect(screen.getByText(/toobig\.pdf/)).toBeInTheDocument();
    expect(screen.queryByText(/valid1\.pdf.*exceed/i)).not.toBeInTheDocument();
    expect(screen.getByText(/valid1\.pdf/)).toBeInTheDocument();
    expect(screen.getByText(/valid2\.pdf/)).toBeInTheDocument();
    expect(screen.getByText(/2\/5/)).toBeInTheDocument();
  });

  it("A4: all 3 oversized → error lists all 3; 0/5", () => {
    render(<NewProblemForm domains={mockDomains} />);
    changeFiles([makeFile("a.pdf", 11), makeFile("b.pdf", 12), makeFile("c.pdf", 20)]);
    expect(screen.getByText(/a\.pdf/)).toBeInTheDocument();
    expect(screen.getByText(/b\.pdf/)).toBeInTheDocument();
    expect(screen.getByText(/c\.pdf/)).toBeInTheDocument();
    expect(screen.getByText(/0\/5/)).toBeInTheDocument();
  });

  it("A5: error cleared when next batch has only valid files", () => {
    render(<NewProblemForm domains={mockDomains} />);
    changeFiles([makeFile("bad.pdf", 11)]);
    expect(screen.getByText(/exceed 10 MB/i)).toBeInTheDocument();
    // Now add a valid file — error IS cleared (stale error removed for good UX)
    changeFiles([makeFile("good.pdf", 1)]);
    expect(screen.queryByText(/exceed 10 MB/i)).not.toBeInTheDocument();
  });

  it("A6: error replaced when next batch has different rejection", () => {
    render(<NewProblemForm domains={mockDomains} />);
    changeFiles([makeFile("a.pdf", 11)]);
    expect(screen.getByText(/a\.pdf/)).toBeInTheDocument();
    changeFiles([makeFile("b.pdf", 15)]);
    expect(screen.getByText(/b\.pdf/)).toBeInTheDocument();
    expect(screen.queryByText(/a\.pdf.*exceed/i)).not.toBeInTheDocument();
  });
});

// ── B. File Deduplication ────────────────────────────────────────────────────

describe("file deduplication", () => {
  it("B1: same name + size added twice → appears once + 1/5", () => {
    render(<NewProblemForm domains={mockDomains} />);
    const f1 = makeFile("dup.pdf", 1);
    changeFiles([f1]);
    // Input is remounted; select the new one
    const f2 = makeFile("dup.pdf", 1);
    changeFiles([f2]);
    expect(screen.getByText(/1\/5/)).toBeInTheDocument();
    // Only one list item with this name
    const items = screen.getAllByText(/dup\.pdf/);
    expect(items).toHaveLength(1);
  });

  it("B2: same name, different size → treated as distinct + 2/5", () => {
    render(<NewProblemForm domains={mockDomains} />);
    changeFiles([makeFile("same.pdf", 1)]);
    changeFiles([makeFile("same.pdf", 2)]);
    expect(screen.getByText(/2\/5/)).toBeInTheDocument();
  });
});

// ── C. MAX_FILES Cap ─────────────────────────────────────────────────────────

describe("file count cap", () => {
  it("C1: 6 valid files at once → 5/5 + input disabled", () => {
    render(<NewProblemForm domains={mockDomains} />);
    const files = Array.from({ length: 6 }, (_, i) => makeFile(`f${i}.pdf`, 1));
    changeFiles(files);
    expect(screen.getByText(/5\/5/)).toBeInTheDocument();
    expect(getFileInput()).toBeDisabled();
  });

  it("C2: 3 then 3 more → 5/5; 6th dropped", () => {
    render(<NewProblemForm domains={mockDomains} />);
    const batch1 = [makeFile("a.pdf", 1), makeFile("b.pdf", 1), makeFile("c.pdf", 1)];
    changeFiles(batch1);
    const batch2 = [makeFile("d.pdf", 1), makeFile("e.pdf", 1), makeFile("f.pdf", 1)];
    changeFiles(batch2);
    expect(screen.getByText(/5\/5/)).toBeInTheDocument();
  });

  it("C3: 5 valid + 1 oversized at once → 5/5 + error + input disabled", () => {
    render(<NewProblemForm domains={mockDomains} />);
    const files = Array.from({ length: 5 }, (_, i) => makeFile(`v${i}.pdf`, 1));
    files.push(makeFile("toobig.pdf", 11));
    changeFiles(files);
    expect(screen.getByText(/5\/5/)).toBeInTheDocument();
    expect(screen.getByText(/exceed 10 MB/i)).toBeInTheDocument();
    expect(getFileInput()).toBeDisabled();
  });
});

// ── D. Remove File ───────────────────────────────────────────────────────────

describe("remove file", () => {
  it("D1: remove only file → 0/5 + item gone + input reappears", async () => {
    const user = userEvent.setup();
    render(<NewProblemForm domains={mockDomains} />);
    changeFiles([makeFile("solo.pdf", 1)]);
    const removeBtn = screen.getByRole("button", { name: /remove/i });
    await user.click(removeBtn);
    expect(screen.queryByText(/solo\.pdf/)).not.toBeInTheDocument();
    expect(screen.getByText(/0\/5/)).toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).toBeInTheDocument();
  });

  it("D2: remove middle of 3 → others remain + 2/5", async () => {
    const user = userEvent.setup();
    render(<NewProblemForm domains={mockDomains} />);
    // Add 3 files one by one (each change remounts input)
    changeFiles([makeFile("first.pdf", 1)]);
    changeFiles([makeFile("middle.pdf", 2)]);
    changeFiles([makeFile("last.pdf", 3)]);

    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    await user.click(removeButtons[1]); // remove middle

    expect(screen.getByText(/first\.pdf/)).toBeInTheDocument();
    expect(screen.queryByText(/middle\.pdf/)).not.toBeInTheDocument();
    expect(screen.getByText(/last\.pdf/)).toBeInTheDocument();
    expect(screen.getByText(/2\/5/)).toBeInTheDocument();
  });

  it("D3: remove one from 5/5 → input re-enabled + 4/5", async () => {
    const user = userEvent.setup();
    render(<NewProblemForm domains={mockDomains} />);
    const files = Array.from({ length: 5 }, (_, i) => makeFile(`f${i}.pdf`, 1));
    changeFiles(files);
    expect(getFileInput()).toBeDisabled();

    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    await user.click(removeButtons[0]);
    expect(getFileInput()).not.toBeDisabled();
    expect(screen.getByText(/4\/5/)).toBeInTheDocument();
  });
});

// ── E. File Input Visibility ─────────────────────────────────────────────────

describe("file input visibility", () => {
  it("E1: initial render → input present", () => {
    render(<NewProblemForm domains={mockDomains} />);
    expect(document.querySelector('input[type="file"]')).toBeInTheDocument();
  });

  it("E2: after 5 files → input disabled", () => {
    render(<NewProblemForm domains={mockDomains} />);
    changeFiles(Array.from({ length: 5 }, (_, i) => makeFile(`f${i}.pdf`, 1)));
    expect(getFileInput()).toBeDisabled();
  });

  it("E3: at 4 files → input present", () => {
    render(<NewProblemForm domains={mockDomains} />);
    changeFiles(Array.from({ length: 4 }, (_, i) => makeFile(`f${i}.pdf`, 1)));
    expect(document.querySelector('input[type="file"]')).toBeInTheDocument();
  });
});

// ── F. Description Validation ────────────────────────────────────────────────

describe("description validation", () => {
  it("F1: < 150 non-space chars → error + createProblem not called", async () => {
    const user = userEvent.setup();
    render(<NewProblemForm domains={mockDomains} />);
    await user.type(screen.getByLabelText(/title/i), "Title");
    await user.type(screen.getByLabelText(/what happened/i), "Short desc");
    await user.type(screen.getByLabelText(/full name/i), "Name");
    await user.type(screen.getByLabelText(/email/i), "a@b.com");
    await user.type(screen.getByLabelText(/mobile number/i), "9876543210");
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => {
      expect(screen.getByText(/at least 150 characters/i)).toBeInTheDocument();
    });
    expect(mockCreateProblem).not.toHaveBeenCalled();
  });

  it("F2: exactly 150 chars → no description error + phone validation proceeds", async () => {
    const user = userEvent.setup();
    render(<NewProblemForm domains={mockDomains} />);
    await user.type(screen.getByLabelText(/title/i), "Title");
    await user.type(screen.getByLabelText(/what happened/i), "A".repeat(150));
    await user.type(screen.getByLabelText(/full name/i), "Name");
    await user.type(screen.getByLabelText(/email/i), "a@b.com");
    await user.type(screen.getByLabelText(/mobile number/i), "9876543210");
    mockCreateProblem.mockResolvedValueOnce(undefined);
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => {
      expect(screen.queryByText(/at least 150 characters/i)).not.toBeInTheDocument();
    });
  });

  it("F3: 200 spaces + 10 real chars → description error (trim too short)", async () => {
    const user = userEvent.setup();
    render(<NewProblemForm domains={mockDomains} />);
    await user.type(screen.getByLabelText(/title/i), "Title");
    await user.type(screen.getByLabelText(/what happened/i), " ".repeat(200) + "A".repeat(10));
    await user.type(screen.getByLabelText(/full name/i), "Name");
    await user.type(screen.getByLabelText(/email/i), "a@b.com");
    await user.type(screen.getByLabelText(/mobile number/i), "9876543210");
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => {
      expect(screen.getByText(/at least 150 characters/i)).toBeInTheDocument();
    });
  });

  it("F4: fix description and resubmit → description error cleared", async () => {
    const user = userEvent.setup();
    render(<NewProblemForm domains={mockDomains} />);
    await user.type(screen.getByLabelText(/title/i), "Title");
    await user.type(screen.getByLabelText(/what happened/i), "Short");
    await user.type(screen.getByLabelText(/full name/i), "Name");
    await user.type(screen.getByLabelText(/email/i), "a@b.com");
    await user.type(screen.getByLabelText(/mobile number/i), "9876543210");
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => {
      expect(screen.getByText(/at least 150 characters/i)).toBeInTheDocument();
    });
    // Fix description
    const textarea = screen.getByLabelText(/what happened/i) as HTMLTextAreaElement;
    await user.clear(textarea);
    await user.type(textarea, "A".repeat(150));
    mockCreateProblem.mockResolvedValueOnce(undefined);
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => {
      expect(screen.queryByText(/at least 150 characters/i)).not.toBeInTheDocument();
    });
  });
});

// ── G. Phone Validation ──────────────────────────────────────────────────────

describe("phone validation", () => {
  async function submitWithPhone(phone: string) {
    const user = userEvent.setup();
    render(<NewProblemForm domains={mockDomains} />);
    await fillRequiredFields(user);
    // Replace phone value
    const phoneInput = screen.getByLabelText(/mobile number/i) as HTMLInputElement;
    await user.clear(phoneInput);
    if (phone) await user.type(phoneInput, phone);
    mockCreateProblem.mockResolvedValueOnce(undefined);
    fireEvent.submit(document.querySelector("form")!);
  }

  const PHONE_ERROR = /valid 10-digit Indian mobile number/i;

  it("G1: 9876543210 → valid; createProblem called", async () => {
    await submitWithPhone("9876543210");
    await waitFor(() => expect(mockCreateProblem).toHaveBeenCalledOnce());
    expect(screen.queryByText(PHONE_ERROR)).not.toBeInTheDocument();
  });

  it("G2: 6123456789 → valid", async () => {
    await submitWithPhone("6123456789");
    await waitFor(() => expect(mockCreateProblem).toHaveBeenCalledOnce());
  });

  it("G3: +919876543210 → valid (+91 stripped)", async () => {
    await submitWithPhone("+919876543210");
    await waitFor(() => expect(mockCreateProblem).toHaveBeenCalledOnce());
  });

  it("G4: 09876543210 → valid (0 prefix stripped)", async () => {
    await submitWithPhone("09876543210");
    await waitFor(() => expect(mockCreateProblem).toHaveBeenCalledOnce());
  });

  it("G5: 5123456789 → error (starts with 5)", async () => {
    await submitWithPhone("5123456789");
    await waitFor(() => expect(screen.getByText(PHONE_ERROR)).toBeInTheDocument());
    expect(mockCreateProblem).not.toHaveBeenCalled();
  });

  it("G6: 1234567890 → error (starts with 1)", async () => {
    await submitWithPhone("1234567890");
    await waitFor(() => expect(screen.getByText(PHONE_ERROR)).toBeInTheDocument());
  });

  it("G7: 987654321 (9 digits) → error", async () => {
    await submitWithPhone("987654321");
    await waitFor(() => expect(screen.getByText(PHONE_ERROR)).toBeInTheDocument());
  });

  it("G8: 98765432101 (11 digits) → error", async () => {
    await submitWithPhone("98765432101");
    await waitFor(() => expect(screen.getByText(PHONE_ERROR)).toBeInTheDocument());
  });

  it("G9: empty string → error", async () => {
    await submitWithPhone("");
    await waitFor(() => expect(screen.getByText(PHONE_ERROR)).toBeInTheDocument());
  });

  it("G10: 919876543210 (no + but 91 prefix) → valid", async () => {
    await submitWithPhone("919876543210");
    await waitFor(() => expect(mockCreateProblem).toHaveBeenCalledOnce());
  });
});

// ── H. Server Action Integration ─────────────────────────────────────────────

describe("server action", () => {
  it("H1: createProblem returns { error: 'Duplicate...' } → error banner shown", async () => {
    const user = userEvent.setup();
    render(<NewProblemForm domains={mockDomains} />);
    await fillRequiredFields(user);
    mockCreateProblem.mockResolvedValueOnce({ error: "Duplicate problem detected." });
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => {
      expect(screen.getByText(/Duplicate problem detected\./i)).toBeInTheDocument();
    });
  });

  it("H2: createProblem returns undefined (success) → no error; called once", async () => {
    const user = userEvent.setup();
    render(<NewProblemForm domains={mockDomains} />);
    await fillRequiredFields(user);
    mockCreateProblem.mockResolvedValueOnce(undefined);
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => expect(mockCreateProblem).toHaveBeenCalledOnce());
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it("H3: files passed correctly in formData", async () => {
    const user = userEvent.setup();
    render(<NewProblemForm domains={mockDomains} />);
    await fillRequiredFields(user);
    const f1 = makeFile("doc1.pdf", 1);
    const f2 = makeFile("doc2.pdf", 2);
    changeFiles([f1]);
    changeFiles([f2]);
    mockCreateProblem.mockResolvedValueOnce(undefined);
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => expect(mockCreateProblem).toHaveBeenCalledOnce());
    const formData: FormData = mockCreateProblem.mock.calls[0][0];
    const passedFiles = formData.getAll("files") as File[];
    expect(passedFiles).toHaveLength(2);
    const names = passedFiles.map((f) => f.name);
    expect(names).toContain("doc1.pdf");
    expect(names).toContain("doc2.pdf");
  });

  it("H4: submit button disabled while pending", async () => {
    const user = userEvent.setup();
    render(<NewProblemForm domains={mockDomains} />);
    await fillRequiredFields(user);
    // Never resolves — button stays disabled
    mockCreateProblem.mockReturnValue(new Promise(() => {}));
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /submitting/i })).toBeDisabled();
    });
  });
});

// ── I. Error Banner ──────────────────────────────────────────────────────────

describe("error banner", () => {
  it("I1: initial render → no error div", () => {
    render(<NewProblemForm domains={mockDomains} />);
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it("I2: error element has text-red-700 class", async () => {
    render(<NewProblemForm domains={mockDomains} />);
    changeFiles([makeFile("big.pdf", 11)]);
    const el = screen.getByText(/exceed 10 MB/i);
    expect(el.closest("div")).toHaveClass("text-red-700");
  });

  it("I3: submit clears previous error and shows new one", async () => {
    const user = userEvent.setup();
    render(<NewProblemForm domains={mockDomains} />);
    await user.type(screen.getByLabelText(/title/i), "Title");
    await user.type(screen.getByLabelText(/what happened/i), "Short");
    await user.type(screen.getByLabelText(/full name/i), "Name");
    await user.type(screen.getByLabelText(/email/i), "a@b.com");
    await user.type(screen.getByLabelText(/mobile number/i), "9876543210");
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => expect(screen.getByText(/at least 150 characters/i)).toBeInTheDocument());
    // Fix and resubmit
    const textarea = screen.getByLabelText(/what happened/i) as HTMLTextAreaElement;
    await user.clear(textarea);
    await user.type(textarea, "A".repeat(150));
    mockCreateProblem.mockResolvedValueOnce(undefined);
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => {
      expect(screen.queryByText(/at least 150 characters/i)).not.toBeInTheDocument();
    });
  });

  it("I4: submit error overwrites file error", async () => {
    const user = userEvent.setup();
    render(<NewProblemForm domains={mockDomains} />);
    // Trigger file error
    changeFiles([makeFile("bad.pdf", 11)]);
    expect(screen.getByText(/exceed 10 MB/i)).toBeInTheDocument();
    // Submit with short description (submit clears error first, then sets new one)
    await user.type(screen.getByLabelText(/title/i), "Title");
    await user.type(screen.getByLabelText(/what happened/i), "Short");
    await user.type(screen.getByLabelText(/full name/i), "Name");
    await user.type(screen.getByLabelText(/email/i), "a@b.com");
    await user.type(screen.getByLabelText(/mobile number/i), "9876543210");
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => {
      expect(screen.getByText(/at least 150 characters/i)).toBeInTheDocument();
      expect(screen.queryByText(/exceed 10 MB/i)).not.toBeInTheDocument();
    });
  });
});

// ── J. Category Cascade ──────────────────────────────────────────────────────

describe("domain/category cascade", () => {
  it("J1: select domain → categories fetched + category option appears", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: "cat-1", name: "Fake Products", slug: "fake-products" }],
    });
    vi.stubGlobal("fetch", mockFetch);
    render(<NewProblemForm domains={mockDomains} />);
    await user.selectOptions(screen.getByRole("combobox", { name: /category of fraud/i }), "domain-1");
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/domains/domain-1/categories"
      );
      expect(screen.getByRole("option", { name: /Fake Products/i })).toBeInTheDocument();
    });
  });

  it("J2: select blank → categories cleared + fetch not called", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: "cat-1", name: "Fake Products", slug: "fake-products" }],
    });
    vi.stubGlobal("fetch", mockFetch);
    render(<NewProblemForm domains={mockDomains} />);
    // Select domain first
    await user.selectOptions(screen.getByRole("combobox", { name: /category of fraud/i }), "domain-1");
    await waitFor(() => expect(screen.getByRole("option", { name: /Fake Products/i })).toBeInTheDocument());
    mockFetch.mockClear();
    // Select blank
    await user.selectOptions(screen.getByRole("combobox", { name: /category of fraud/i }), "");
    await waitFor(() => {
      expect(screen.queryByRole("option", { name: /Fake Products/i })).not.toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("J3: fetch fails (ok: false) → no category options; no crash", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: false }));
    render(<NewProblemForm domains={mockDomains} />);
    await user.selectOptions(screen.getByRole("combobox", { name: /category of fraud/i }), "domain-1");
    await waitFor(() => {
      expect(screen.queryByRole("option", { name: /Fake Products/i })).not.toBeInTheDocument();
    });
  });
});
