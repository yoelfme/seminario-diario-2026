import { z } from "zod";

const TICKET_TYPES = ["student", "professional", "speaker"] as const;

export const registrationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters"),
  email: z.email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s\-()]{7,20}$/, "Enter a valid phone number"),
  organization: z.string().trim().min(1, "Organization is required"),
  ticketType: z.enum(TICKET_TYPES, {
    error: "Invalid ticket type",
  }),
  yearsExperience: z
    .number()
    .int("Years of experience must be a whole number")
    .min(0, "Experience cannot be negative")
    .max(40, "Experience cannot exceed 40 years"),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

const optionalFilterParam = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === "" ? undefined : value));

export const registrationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  email: optionalFilterParam,
  organization: optionalFilterParam,
  fullName: optionalFilterParam,
});

export type RegistrationsQuery = z.infer<typeof registrationsQuerySchema>;
