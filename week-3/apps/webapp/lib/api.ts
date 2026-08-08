export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type Conference = {
  title: string;
  subtitle: string;
  date: string;
  venue: string;
  description: string;
  tracks: string[];
  speakers: string[];
};

export type Registration = {
  id: number;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  organization: string | null;
  ticket_type: string | null;
  years_experience: number | null;
  created_at: string;
};

export type RegistrationInput = {
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  ticketType: string;
  yearsExperience: number;
};

export type PaginatedRegistrations = {
  data: Registration[];
  page: number;
  pageSize: number;
  total: number;
};

export async function fetchConference(): Promise<Conference> {
  const res = await fetch(`${API_URL}/conference`);
  if (!res.ok) throw new Error("Failed to fetch conference");
  return res.json() as Promise<Conference>;
}

export type RegistrationFilters = {
  email?: string;
  organization?: string;
  fullName?: string;
};

export async function fetchRegistrations(params?: {
  page?: number;
  pageSize?: number;
} & RegistrationFilters): Promise<PaginatedRegistrations> {
  const searchParams = new URLSearchParams();
  if (params?.page != null) searchParams.set("page", String(params.page));
  if (params?.pageSize != null) {
    searchParams.set("pageSize", String(params.pageSize));
  }
  if (params?.email) searchParams.set("email", params.email);
  if (params?.organization) {
    searchParams.set("organization", params.organization);
  }
  if (params?.fullName) searchParams.set("fullName", params.fullName);

  const query = searchParams.toString();
  const url = query
    ? `${API_URL}/registrations?${query}`
    : `${API_URL}/registrations`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch registrations");
  return res.json() as Promise<PaginatedRegistrations>;
}

/** Carries the API's status and error body so callers can tell 400/409/422 apart. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: { error?: string; detail?: string; issues?: unknown[] } | null;

  constructor(
    status: number,
    body: ApiError["body"],
    fallbackMessage: string,
  ) {
    super(body?.error ?? fallbackMessage);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export type CreateRegistrationResult = {
  registration: Registration;
  /** True when the API returned a cached response instead of inserting a row. */
  replayed: boolean;
};

export async function createRegistration(
  input: RegistrationInput,
  idempotencyKey: string,
): Promise<CreateRegistrationResult> {
  const res = await fetch(`${API_URL}/registrations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body, "Failed to create registration");
  }

  return {
    registration: (await res.json()) as Registration,
    replayed: res.headers.get("Idempotency-Replayed") === "true",
  };
}
