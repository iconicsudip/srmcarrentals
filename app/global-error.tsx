"use client";

// Replaces the root layout when it crashes, so it must define <html>/<body> and use inline styles
// (global CSS is not loaded here).
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#fff",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.28em", color: "#fcd34d", fontWeight: 700 }}>ERROR 500</div>
          <h1 style={{ fontSize: 40, lineHeight: 1.05, margin: "16px 0", fontWeight: 900, textTransform: "uppercase" }}>
            Something went wrong<span style={{ color: "#f97316" }}>.</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
            A critical error occurred. Please try again — if it keeps happening, contact us.
          </p>
          <div style={{ marginTop: 28, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => retry()}
              style={{ background: "linear-gradient(90deg,#f97316,#f59e0b)", color: "#fff", border: 0, borderRadius: 999, padding: "12px 28px", fontWeight: 800, cursor: "pointer" }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{ border: "1px solid rgba(255,255,255,0.25)", color: "#fff", borderRadius: 999, padding: "12px 28px", fontWeight: 700, textDecoration: "none" }}
            >
              Back to home
            </a>
          </div>
          {error?.digest && <p style={{ marginTop: 28, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Reference: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
