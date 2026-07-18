import { AxiosError } from "axios";

interface ApiErrorPayload {
  message?: string;
  errors?: Record<string, string[] | string>;
}

/**
 * Extract a human-readable message from an API error for display to users.
 *
 * Precedence:
 * 1. First field-level validation message (e.g. "The email has already been
 *    taken.") — the Laravel envelope buries these under `errors` while
 *    `message` is just "Validation failed.", which is useless to users.
 * 2. The envelope's top-level `message`, unless it's the generic
 *    "Validation failed."
 * 3. A network-specific message when the request never got a response.
 * 4. The caller-provided fallback.
 */
export function getApiErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as ApiErrorPayload | undefined;

    if (data?.errors && typeof data.errors === "object") {
      const first = Object.values(data.errors).flat().find(
        (m): m is string => typeof m === "string" && m.length > 0
      );
      if (first) return first;
    }

    if (
      typeof data?.message === "string" &&
      data.message.length > 0 &&
      data.message !== "Validation failed."
    ) {
      return data.message;
    }

    // Request was sent but no response came back (offline, server down, CORS).
    if (err.request && !err.response) {
      return "Unable to reach the server. Please check your internet connection and try again.";
    }
  }

  return fallback;
}
