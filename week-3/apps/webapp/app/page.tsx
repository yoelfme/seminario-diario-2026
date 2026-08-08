"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { fetchConference } from "@/lib/api";

export default function ConferencePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["conference"],
    queryFn: fetchConference,
  });

  if (isLoading) {
    return <p className="text-[var(--muted)]">Loading conference details…</p>;
  }

  if (isError || !data) {
    return (
      <p className="text-[var(--error)]">
        Could not load conference. Is the API running on port 3001?
      </p>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <p className="font-mono text-xs tracking-widest text-[var(--accent)] uppercase">
          AI Conference 2026
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">{data.title}</h1>
        <p className="mt-3 max-w-2xl text-lg text-[var(--muted)]">
          {data.subtitle}
        </p>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium text-[var(--muted)] uppercase">
            Date
          </h2>
          <p className="mt-1 text-lg">{data.date}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-[var(--muted)] uppercase">
            Venue
          </h2>
          <p className="mt-1 text-lg">{data.venue}</p>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-[var(--muted)] uppercase">
          About
        </h2>
        <p className="mt-2 leading-relaxed">{data.description}</p>
      </section>

      <section>
        <h2 className="text-sm font-medium text-[var(--muted)] uppercase">
          Tracks
        </h2>
        <ul className="mt-3 space-y-2">
          {data.tracks.map((track) => (
            <li
              key={track}
              className="border-l-2 border-[var(--accent)] pl-4 text-[var(--text)]"
            >
              {track}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-medium text-[var(--muted)] uppercase">
          Featured Speakers
        </h2>
        <ul className="mt-3 space-y-2">
          {data.speakers.map((speaker) => (
            <li key={speaker} className="text-[var(--muted)]">
              {speaker}
            </li>
          ))}
        </ul>
      </section>

      <Link
        href="/register"
        className="inline-block rounded bg-[var(--accent)] px-6 py-3 font-medium text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)]"
      >
        Register now
      </Link>
    </div>
  );
}
