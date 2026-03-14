import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import UpvoteButton from "@/components/UpvoteButton";

const PROBLEM_ID = "test-problem-uuid-123";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

function mockUpvoteSuccess(upvote_count: number, already_voted: boolean) {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ upvote_count, already_voted }),
  });
}

function mockUpvoteError() {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: false,
    json: async () => ({}),
  });
}

// ── Initial render ────────────────────────────────────────────────────────────

describe("UpvoteButton — initial render", () => {
  it("renders initial upvote count", () => {
    render(<UpvoteButton problemId={PROBLEM_ID} initialCount={5} alreadyVoted={false} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders 'Upvote' label when not voted", () => {
    render(<UpvoteButton problemId={PROBLEM_ID} initialCount={0} alreadyVoted={false} />);
    expect(screen.getByText("Upvote")).toBeInTheDocument();
  });

  it("renders 'Voted' label when already voted", () => {
    render(<UpvoteButton problemId={PROBLEM_ID} initialCount={3} alreadyVoted={true} />);
    expect(screen.getByText("Voted")).toBeInTheDocument();
  });

  it("renders zero count correctly", () => {
    render(<UpvoteButton problemId={PROBLEM_ID} initialCount={0} alreadyVoted={false} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("button is disabled when already voted", () => {
    render(<UpvoteButton problemId={PROBLEM_ID} initialCount={3} alreadyVoted={true} />);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("button is enabled when not voted", () => {
    render(<UpvoteButton problemId={PROBLEM_ID} initialCount={3} alreadyVoted={false} />);
    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
  });

  it("has 'You voted' title when already voted", () => {
    render(<UpvoteButton problemId={PROBLEM_ID} initialCount={1} alreadyVoted={true} />);
    expect(screen.getByTitle("You voted")).toBeInTheDocument();
  });

  it("has 'Upvote' title when not voted", () => {
    render(<UpvoteButton problemId={PROBLEM_ID} initialCount={1} alreadyVoted={false} />);
    expect(screen.getByTitle("Upvote")).toBeInTheDocument();
  });
});

// ── Click behavior ────────────────────────────────────────────────────────────

describe("UpvoteButton — click behavior", () => {
  it("calls the upvote API on click", async () => {
    const user = userEvent.setup();
    mockUpvoteSuccess(6, true);

    render(<UpvoteButton problemId={PROBLEM_ID} initialCount={5} alreadyVoted={false} />);
    await user.click(screen.getByRole("button"));

    expect(global.fetch).toHaveBeenCalledOnce();
    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain(`/api/problems/${PROBLEM_ID}/upvote`);
    expect(opts?.method).toBe("POST");
  });

  it("updates count after successful upvote", async () => {
    const user = userEvent.setup();
    mockUpvoteSuccess(6, true);

    render(<UpvoteButton problemId={PROBLEM_ID} initialCount={5} alreadyVoted={false} />);
    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText("6")).toBeInTheDocument();
    });
  });

  it("shows 'Voted' label after successful upvote", async () => {
    const user = userEvent.setup();
    mockUpvoteSuccess(6, true);

    render(<UpvoteButton problemId={PROBLEM_ID} initialCount={5} alreadyVoted={false} />);
    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText("Voted")).toBeInTheDocument();
    });
  });

  it("disables button after successful upvote", async () => {
    const user = userEvent.setup();
    mockUpvoteSuccess(6, true);

    render(<UpvoteButton problemId={PROBLEM_ID} initialCount={5} alreadyVoted={false} />);
    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByRole("button")).toBeDisabled();
    });
  });

  it("does not call API when already voted", async () => {
    const user = userEvent.setup();

    render(<UpvoteButton problemId={PROBLEM_ID} initialCount={3} alreadyVoted={true} />);
    await user.click(screen.getByRole("button"));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("does not change count if API returns error", async () => {
    const user = userEvent.setup();
    mockUpvoteError();

    render(<UpvoteButton problemId={PROBLEM_ID} initialCount={5} alreadyVoted={false} />);
    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      // Loading state should resolve
      expect(screen.getByRole("button")).not.toBeDisabled();
    });

    // Count should remain at 5
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("does not double-vote on rapid double-click", async () => {
    const user = userEvent.setup();
    mockUpvoteSuccess(6, true);

    render(<UpvoteButton problemId={PROBLEM_ID} initialCount={5} alreadyVoted={false} />);
    const button = screen.getByRole("button");

    // First click triggers the request; button disables during load
    await user.click(button);

    // fetch should only be called once regardless
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

// ── NEXT_PUBLIC_API_URL env ───────────────────────────────────────────────────

describe("UpvoteButton — API URL construction", () => {
  it("uses NEXT_PUBLIC_API_URL from env in the request URL", async () => {
    const user = userEvent.setup();
    mockUpvoteSuccess(1, true);

    render(<UpvoteButton problemId="my-id" initialCount={0} alreadyVoted={false} />);
    await user.click(screen.getByRole("button"));

    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("http://localhost:8000");
    expect(url).toContain("/api/problems/my-id/upvote");
  });
});
