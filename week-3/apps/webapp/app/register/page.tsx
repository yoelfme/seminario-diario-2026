"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ApiError, createRegistration, type RegistrationInput } from "@/lib/api";

const TICKET_TYPES = ["student", "professional", "speaker"] as const;

type FormValues = {
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  ticketType: string;
  yearsExperience: number;
  acceptCodeOfConduct: boolean;
};

type LogEntry = {
  id: number;
  at: string;
  status: string;
  ok: boolean;
  detail: string;
};

// acceptCodeOfConduct is validated client-side only; the API has no such field.
function buildPayload(value: FormValues): RegistrationInput {
  return {
    fullName: value.fullName,
    email: value.email,
    phone: value.phone,
    organization: value.organization,
    ticketType: value.ticketType,
    yearsExperience: value.yearsExperience,
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-[var(--error)]">{message}</p>;
}

export default function RegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [allowDoubleSubmit, setAllowDoubleSubmit] = useState(false);
  const [newKeyEveryRequest, setNewKeyEveryRequest] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const logIdRef = useRef(0);

  // One key per logical registration, not per HTTP request — that is the whole
  // point. Every retry of the same registration must carry the same key, so it
  // survives across submits and is only rotated when a new registration starts
  // (leaving this page, or the demo panel's reset button).
  // Lazily initialised so no throwaway UUID is generated during SSR.
  const keyRef = useRef<string | null>(null);
  const [displayKey, setDisplayKey] = useState<string | null>(null);

  function nextIdempotencyKey(): string {
    if (newKeyEveryRequest) {
      // Deliberately wrong: a fresh key per request means the server sees every
      // retry as a brand-new operation.
      const throwaway = crypto.randomUUID();
      setDisplayKey(throwaway);
      return throwaway;
    }
    if (!keyRef.current) keyRef.current = crypto.randomUUID();
    setDisplayKey(keyRef.current);
    return keyRef.current;
  }

  function resetIdempotencyKey() {
    keyRef.current = null;
    setDisplayKey(null);
  }

  function appendLog(entry: Omit<LogEntry, "id" | "at">) {
    logIdRef.current += 1;
    const next: LogEntry = {
      ...entry,
      id: logIdRef.current,
      at: new Date().toLocaleTimeString(),
    };
    setLog((prev) => [next, ...prev]);
  }

  const mutation = useMutation({
    mutationFn: (payload: RegistrationInput) =>
      createRegistration(payload, nextIdempotencyKey()),
    onSuccess: async ({ registration, replayed }) => {
      appendLog({
        status: "201",
        ok: true,
        detail: replayed
          ? `replayed — no new row, still id ${registration.id}`
          : `created registration id ${registration.id}`,
      });
      await queryClient.invalidateQueries({ queryKey: ["registrations"] });
      // Stay on the page in demo mode so every attempt can be observed.
      // Otherwise we navigate away and the key dies with the unmounted page.
      if (!allowDoubleSubmit) router.push("/attendees");
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        appendLog({
          status: String(error.status),
          ok: false,
          detail: error.message,
        });
        return;
      }
      appendLog({ status: "error", ok: false, detail: error.message });
    },
  });

  const form = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      organization: "",
      ticketType: "",
      yearsExperience: 0,
      acceptCodeOfConduct: false as boolean,
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(buildPayload(value));
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Register for Neural Horizons</h1>
        <p className="mt-2 text-[var(--muted)]">
          Frontend validation ensures a smooth experience. Try submitting with
          invalid data to see inline feedback.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (allowDoubleSubmit) {
            // Bypass the form's own submit sequencing so each click maps to
            // exactly one HTTP request.
            mutation.mutate(buildPayload(form.state.values));
            return;
          }
          void form.handleSubmit();
        }}
        className="space-y-6"
      >
        <form.Field
          name="fullName"
          validators={{
            onChange: ({ value }) => {
              if (!value.trim()) return "Full name is required";
              if (value.trim().length < 2)
                return "Name must be at least 2 characters";
              return undefined;
            },
          }}
        >
          {(field) => (
            <div>
              <label htmlFor={field.name} className="block text-sm font-medium">
                Full name
              </label>
              <input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="mt-1 w-full rounded px-3 py-2"
              />
              <FieldError message={field.state.meta.errors[0]} />
            </div>
          )}
        </form.Field>

        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) => {
              if (!value.trim()) return "Email is required";
              if (!value.includes("@")) return "Email must contain @";
              const parts = value.split("@");
              if (parts.length !== 2 || !parts[1]?.includes("."))
                return "Enter a valid email address";
              return undefined;
            },
          }}
        >
          {(field) => (
            <div>
              <label htmlFor={field.name} className="block text-sm font-medium">
                Email
              </label>
              <input
                id={field.name}
                name={field.name}
                type="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="mt-1 w-full rounded px-3 py-2"
              />
              <FieldError message={field.state.meta.errors[0]} />
            </div>
          )}
        </form.Field>

        <form.Field
          name="phone"
          validators={{
            onChange: ({ value }) => {
              if (!value.trim()) return "Phone is required";
              if (!/^\+?[\d\s\-()]{7,20}$/.test(value))
                return "Enter a valid phone number";
              return undefined;
            },
          }}
        >
          {(field) => (
            <div>
              <label htmlFor={field.name} className="block text-sm font-medium">
                Phone
              </label>
              <input
                id={field.name}
                name={field.name}
                type="tel"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="mt-1 w-full rounded px-3 py-2"
              />
              <FieldError message={field.state.meta.errors[0]} />
            </div>
          )}
        </form.Field>

        <form.Field
          name="organization"
          validators={{
            onChange: ({ value }) => {
              if (!value.trim()) return "Organization is required";
              return undefined;
            },
          }}
        >
          {(field) => (
            <div>
              <label htmlFor={field.name} className="block text-sm font-medium">
                Organization
              </label>
              <input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="mt-1 w-full rounded px-3 py-2"
              />
              <FieldError message={field.state.meta.errors[0]} />
            </div>
          )}
        </form.Field>

        <form.Field
          name="ticketType"
          validators={{
            onChange: ({ value }) => {
              if (!value) return "Select a ticket type";
              if (!TICKET_TYPES.includes(value as (typeof TICKET_TYPES)[number]))
                return "Invalid ticket type";
              return undefined;
            },
          }}
        >
          {(field) => (
            <div>
              <label htmlFor={field.name} className="block text-sm font-medium">
                Ticket type
              </label>
              <select
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="mt-1 w-full rounded px-3 py-2"
              >
                <option value="">Select…</option>
                {TICKET_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              <FieldError message={field.state.meta.errors[0]} />
            </div>
          )}
        </form.Field>

        <form.Field
          name="yearsExperience"
          validators={{
            onChange: ({ value }) => {
              if (value < 0) return "Experience cannot be negative";
              if (value > 40) return "Experience cannot exceed 40 years";
              return undefined;
            },
          }}
        >
          {(field) => (
            <div>
              <label htmlFor={field.name} className="block text-sm font-medium">
                Years of experience
              </label>
              <input
                id={field.name}
                name={field.name}
                type="number"
                min={0}
                max={40}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(Number(e.target.value))}
                className="mt-1 w-full rounded px-3 py-2"
              />
              <FieldError message={field.state.meta.errors[0]} />
            </div>
          )}
        </form.Field>

        <form.Field
          name="acceptCodeOfConduct"
          validators={{
            onChange: ({ value }) => {
              if (!value) return "You must accept the code of conduct";
              return undefined;
            },
          }}
        >
          {(field) => (
            <div>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm">
                  I accept the conference code of conduct and agree to respectful
                  participation.
                </span>
              </label>
              <FieldError message={field.state.meta.errors[0]} />
            </div>
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => {
            const pending = isSubmitting || mutation.isPending;
            return (
              <button
                type="submit"
                disabled={!canSubmit || (!allowDoubleSubmit && pending)}
                className="rounded bg-[var(--accent)] px-6 py-3 font-medium text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? "Submitting…" : "Complete registration"}
              </button>
            );
          }}
        </form.Subscribe>

        {mutation.isError && (
          <p className="text-sm text-[var(--error)]">
            Registration failed. Please try again.
          </p>
        )}
      </form>

      <section className="rounded border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-sm font-semibold">Demo controls</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Seminar instrumentation, not product UI. The API delays every{" "}
          <code>POST /registrations</code> by ~2s
          (<code>REGISTRATION_DELAY_MS</code>) so the in-flight window is wide
          enough to click through.
        </p>

        <label className="mt-4 flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={allowDoubleSubmit}
            onChange={(e) => setAllowDoubleSubmit(e.target.checked)}
            className="mt-1"
          />
          <span>
            Allow double submit
            <span className="mt-0.5 block text-xs text-[var(--muted)]">
              Keeps the button live while a request is in flight — the way an
              impatient user on a slow connection behaves. Also stays on this
              page instead of redirecting, so every attempt is visible.
            </span>
          </span>
        </label>

        <label className="mt-3 flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={newKeyEveryRequest}
            onChange={(e) => setNewKeyEveryRequest(e.target.checked)}
            className="mt-1"
          />
          <span>
            New key on every request{" "}
            <span className="text-[var(--error)]">(wrong on purpose)</span>
            <span className="mt-0.5 block text-xs text-[var(--muted)]">
              A key identifies a logical operation, not an HTTP request.
              Generating a fresh one per request makes the server treat every
              retry as a new registration — duplicates come back.
            </span>
          </span>
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-3 text-xs">
          <span className="text-[var(--muted)]">Idempotency-Key</span>
          <code className="font-mono">{displayKey ?? "— not sent yet —"}</code>
          <button
            type="button"
            onClick={resetIdempotencyKey}
            className="text-[var(--muted)] underline"
          >
            Start a new registration (rotate key)
          </button>
        </div>

        {log.length > 0 && (
          <div className="mt-5 border-t border-[var(--border)] pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Request log</h3>
              <button
                type="button"
                onClick={() => setLog([])}
                className="text-xs text-[var(--muted)] underline"
              >
                Clear
              </button>
            </div>
            <ul className="mt-2 space-y-1 font-mono text-xs">
              {log.map((entry) => (
                <li key={entry.id} className="flex gap-3">
                  <span className="text-[var(--muted)]">{entry.at}</span>
                  <span
                    className={
                      entry.ok
                        ? "text-[var(--success)]"
                        : "text-[var(--error)]"
                    }
                  >
                    {entry.status}
                  </span>
                  <span>{entry.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
