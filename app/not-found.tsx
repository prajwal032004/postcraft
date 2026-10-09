import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="nf">
      <span className="eyebrow">Error 404</span>
      <h1 className="display">
        This page never <span className="italic">made the post.</span>
      </h1>
      <p className="lead" style={{ maxWidth: 520 }}>
        The address you tried does not exist. The composer and the template library are both one click away.
      </p>
      <div className="hero-ctas">
        <Link href="/compose" className="btn btn-blue">
          Open composer <span className="arrow">▸</span>
        </Link>
        <Link href="/" className="btn btn-ghost">
          Back home
        </Link>
      </div>
    </main>
  );
}
