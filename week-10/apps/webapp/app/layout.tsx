import Link from "next/link";
import ThemeToggle from "./components/theme-toggle";
import "./globals.css";

export const metadata = {
  title: "Semana 10 — Tiempo real",
  description: "Polling, long polling, webhooks, SSE y WebSockets con Hono y Next.js",
};

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/polling", label: "Polling" },
  { href: "/long-polling", label: "Long polling" },
  { href: "/webhooks", label: "Webhooks" },
  { href: "/sse", label: "SSE" },
  { href: "/websockets", label: "WebSockets" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("seminario-semana-10-theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}else if(window.matchMedia("(prefers-color-scheme: light)").matches){document.documentElement.setAttribute("data-theme","light");}else{document.documentElement.setAttribute("data-theme","dark");}}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`,
          }}
        />
      </head>
      <body>
        <header className="border-b border-[var(--border)] bg-[var(--surface)]">
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
            <Link
              href="/"
              className="font-mono text-sm font-medium tracking-wider text-[var(--accent)] uppercase"
            >
              Semana 10
            </Link>
            <div className="flex flex-wrap items-center gap-5 text-sm">
              {LINKS.slice(1).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[var(--muted)] transition hover:text-[var(--text)]"
                >
                  {link.label}
                </Link>
              ))}
              <ThemeToggle />
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
