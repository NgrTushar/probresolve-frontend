import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProbResolve — Consumer Complaint Board for India",
  description: "A consumer complaint board for India. Post and browse fraud complaints across banking, e-commerce, real estate, and more.",
  openGraph: {
    images: [{ url: "/stacked_logo.jpg" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-brand-mist text-brand-ink min-h-screen flex flex-col">
        {/* Nav */}
        <nav className="bg-white border-b border-brand-smoke sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16">
            <Link href="/" className="flex-shrink-0">
              <Image src="/primary_logo.svg" alt="ProbResolve" width={240} height={68} className="h-12 w-auto" />
            </Link>
            <div className="flex items-center gap-4">
              <form action="/search" method="get" className="hidden sm:flex">
                <input
                  name="q"
                  type="search"
                  placeholder="Search complaints…"
                  className="border border-brand-smoke rounded-l px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy"
                />
                <button
                  type="submit"
                  className="bg-brand-navy text-white px-3 py-1.5 text-sm rounded-r hover:bg-brand-navy/90"
                >
                  Search
                </button>
              </form>
              <Link
                href="/problems/new"
                className="bg-brand-orange text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-brand-orange/90"
              >
                + Post Complaint
              </Link>
            </div>
          </div>
        </nav>

        {/* Main */}
        <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">{children}</main>

        {/* Footer */}
        <footer className="bg-brand-navy mt-16 py-6 text-center text-sm text-white/50">
          ProbResolve &mdash; Consumer Complaint Board for India
        </footer>
      </body>
    </html>
  );
}
