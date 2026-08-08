import Link from "next/link";
import ThemeToggle from "./components/theme-toggle";
import Providers from "./providers";
import "./globals.css";

export const metadata = {
  title: "Neural Horizons 2026",
  description: "AI Conference Registration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("neural-horizons-theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}else if(window.matchMedia("(prefers-color-scheme: light)").matches){document.documentElement.setAttribute("data-theme","light");}else{document.documentElement.setAttribute("data-theme","dark");}}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`,
          }}
        />
      </head>
      <body>
        <Providers>
          <header className="border-b border-[var(--border)] bg-[var(--surface)]">
            <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
              <Link
                href="/"
                className="font-mono text-sm font-medium tracking-wider text-[var(--accent)] uppercase"
              >
                Neural Horizons
              </Link>
              <div className="flex items-center gap-6 text-sm">
                <Link
                  href="/"
                  className="text-[var(--muted)] transition hover:text-[var(--text)]"
                >
                  Conference
                </Link>
                <Link
                  href="/register"
                  className="text-[var(--muted)] transition hover:text-[var(--text)]"
                >
                  Register
                </Link>
                <Link
                  href="/attendees"
                  className="text-[var(--muted)] transition hover:text-[var(--text)]"
                >
                  Attendees
                </Link>
                <ThemeToggle />
              </div>
            </nav>
          </header>
          <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
