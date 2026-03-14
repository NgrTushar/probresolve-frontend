import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ReportButton from "@/components/ReportButton";

const PROBLEM_ID = "report-test-problem-uuid";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

function mockReportSuccess() {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ report_count: 1, already_reported: true }),
  });
}

function mockReportError() {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: false,
    json: async () => ({}),
  });
}

// ── Initial render ────────────────────────────────────────────────────────────

describe("ReportButton — initial render", () => {
  it("shows '🚩 Report' button when not reported", () => {
    render(<ReportButton problemId={PROBLEM_ID} alreadyReported={false} />);
    expect(screen.getByText(/🚩 Report/)).toBeInTheDocument();
  });

  it("shows '🚩 Reported' text when already reported", () => {
    render(<ReportButton problemId={PROBLEM_ID} alreadyReported={true} />);
    expect(screen.getByText(/🚩 Reported/)).toBeInTheDocument();
  });

  it("does not show form initially", () => {
    render(<ReportButton problemId={PROBLEM_ID} alreadyReported={false} />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("does not show submit button initially", () => {
    render(<ReportButton problemId={PROBLEM_ID} alreadyReported={false} />);
    expect(screen.queryByText(/Submit/)).not.toBeInTheDocument();
  });
});

// ── Show/hide form ────────────────────────────────────────────────────────────

describe("ReportButton — form toggle", () => {
  it("shows form after clicking '🚩 Report'", async () => {
    const user = userEvent.setup();
    render(<ReportButton problemId={PROBLEM_ID} alreadyReported={false} />);

    await user.click(screen.getByText(/🚩 Report/));

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Submit")).toBeInTheDocument();
  });

  it("shows Cancel button in form", async () => {
    const user = userEvent.setup();
    render(<ReportButton problemId={PROBLEM_ID} alreadyReported={false} />);

    await user.click(screen.getByText(/🚩 Report/));

    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("hides form when Cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<ReportButton problemId={PROBLEM_ID} alreadyReported={false} />);

    await user.click(screen.getByText(/🚩 Report/));
    expect(screen.getByRole("combobox")).toBeInTheDocument();

    await user.click(screen.getByText("Cancel"));
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("shows '🚩 Report' button again after Cancel", async () => {
    const user = userEvent.setup();
    render(<ReportButton problemId={PROBLEM_ID} alreadyReported={false} />);

    await user.click(screen.getByText(/🚩 Report/));
    await user.click(screen.getByText("Cancel"));

    expect(screen.getByText(/🚩 Report/)).toBeInTheDocument();
  });
});

// ── Reason selection ──────────────────────────────────────────────────────────

describe("ReportButton — reason dropdown", () => {
  it("shows all 4 reason options", async () => {
    const user = userEvent.setup();
    render(<ReportButton problemId={PROBLEM_ID} alreadyReported={false} />);

    await user.click(screen.getByText(/🚩 Report/));

    expect(screen.getByText("Fake complaint")).toBeInTheDocument();
    expect(screen.getByText("Defamatory content")).toBeInTheDocument();
    expect(screen.getByText("Duplicate post")).toBeInTheDocument();
    expect(screen.getByText("Other")).toBeInTheDocument();
  });

  it("defaults to 'fake' reason", async () => {
    const user = userEvent.setup();
    render(<ReportButton problemId={PROBLEM_ID} alreadyReported={false} />);

    await user.click(screen.getByText(/🚩 Report/));

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("fake");
  });

  it("can change reason to 'duplicate'", async () => {
    const user = userEvent.setup();
    render(<ReportButton problemId={PROBLEM_ID} alreadyReported={false} />);

    await user.click(screen.getByText(/🚩 Report/));
    await user.selectOptions(screen.getByRole("combobox"), "duplicate");

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("duplicate");
  });

  it("can change reason to 'defamatory'", async () => {
    const user = userEvent.setup();
    render(<ReportButton problemId={PROBLEM_ID} alreadyReported={false} />);

    await user.click(screen.getByText(/🚩 Report/));
    await user.selectOptions(screen.getByRole("combobox"), "defamatory");

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("defamatory");
  });
});

// ── Submission ────────────────────────────────────────────────────────────────

describe("ReportButton — submission", () => {
  it("calls the report API on Submit click", async () => {
    const user = userEvent.setup();
    mockReportSuccess();
    render(<ReportButton problemId={PROBLEM_ID} alreadyReported={false} />);

    await user.click(screen.getByText(/🚩 Report/));
    await user.click(screen.getByText("Submit"));

    expect(global.fetch).toHaveBeenCalledOnce();
    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain(`/api/problems/${PROBLEM_ID}/report`);
    expect(opts?.method).toBe("POST");
  });

  it("sends the selected reason in the request body", async () => {
    const user = userEvent.setup();
    mockReportSuccess();
    render(<ReportButton problemId={PROBLEM_ID} alreadyReported={false} />);

    await user.click(screen.getByText(/🚩 Report/));
    await user.selectOptions(screen.getByRole("combobox"), "other");
    await user.click(screen.getByText("Submit"));

    const [, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(opts?.body).toContain("reason=other");
  });

  it("sends Content-Type application/x-www-form-urlencoded", async () => {
    const user = userEvent.setup();
    mockReportSuccess();
    render(<ReportButton problemId={PROBLEM_ID} alreadyReported={false} />);

    await user.click(screen.getByText(/🚩 Report/));
    await user.click(screen.getByText("Submit"));

    const [, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(opts?.headers?.["Content-Type"]).toBe("application/x-www-form-urlencoded");
  });

  it("shows '🚩 Reported' after successful submission", async () => {
    const user = userEvent.setup();
    mockReportSuccess();
    render(<ReportButton problemId={PROBLEM_ID} alreadyReported={false} />);

    await user.click(screen.getByText(/🚩 Report/));
    await user.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(screen.getByText(/🚩 Reported/)).toBeInTheDocument();
    });
  });

  it("hides form after successful submission", async () => {
    const user = userEvent.setup();
    mockReportSuccess();
    render(<ReportButton problemId={PROBLEM_ID} alreadyReported={false} />);

    await user.click(screen.getByText(/🚩 Report/));
    await user.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    });
  });

  it("does not update state on failed submission", async () => {
    const user = userEvent.setup();
    mockReportError();
    render(<ReportButton problemId={PROBLEM_ID} alreadyReported={false} />);

    await user.click(screen.getByText(/🚩 Report/));
    await user.click(screen.getByText("Submit"));

    await waitFor(() => {
      // Submit button re-enabled after failure
      expect(screen.getByText("Submit")).toBeInTheDocument();
    });

    expect(screen.queryByText(/🚩 Reported/)).not.toBeInTheDocument();
  });

  it("submit button shows 'Submitting…' during loading", async () => {
    const user = userEvent.setup();
    // Delay the response
    let resolve: (v: unknown) => void;
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      new Promise((res) => { resolve = res; })
    );

    render(<ReportButton problemId={PROBLEM_ID} alreadyReported={false} />);

    await user.click(screen.getByText(/🚩 Report/));
    await user.click(screen.getByText("Submit"));

    expect(screen.getByText("Submitting…")).toBeInTheDocument();

    // Resolve the fetch
    resolve!({ ok: true, json: async () => ({ report_count: 1, already_reported: true }) });
  });

  it("submit button is disabled during loading", async () => {
    const user = userEvent.setup();
    let resolve: (v: unknown) => void;
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      new Promise((res) => { resolve = res; })
    );

    render(<ReportButton problemId={PROBLEM_ID} alreadyReported={false} />);

    await user.click(screen.getByText(/🚩 Report/));
    await user.click(screen.getByText("Submit"));

    expect(screen.getByText("Submitting…")).toBeDisabled();

    resolve!({ ok: false });
  });
});

// ── Already reported state ────────────────────────────────────────────────────

describe("ReportButton — already reported state", () => {
  it("does not render a clickable button when already reported", () => {
    render(<ReportButton problemId={PROBLEM_ID} alreadyReported={true} />);
    // The "Reported" state is a span, not a button
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("has cursor-default on reported state (non-interactive)", () => {
    render(<ReportButton problemId={PROBLEM_ID} alreadyReported={true} />);
    const span = screen.getByText(/🚩 Reported/);
    expect(span.className).toContain("cursor-default");
  });
});
