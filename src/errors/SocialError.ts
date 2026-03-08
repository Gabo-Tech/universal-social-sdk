import type { Platform } from "../types.js";

export class SocialError extends Error {
  public readonly platform: Platform;
  public readonly endpoint: string;
  public readonly statusCode?: number;
  public readonly details?: unknown;
  public readonly cause?: unknown;

  constructor(params: {
    platform: Platform;
    endpoint: string;
    message: string;
    statusCode?: number;
    details?: unknown;
    cause?: unknown;
  }) {
    super(params.message);
    this.name = "SocialError";
    this.platform = params.platform;
    this.endpoint = params.endpoint;
    this.statusCode = params.statusCode;
    this.details = params.details;
    this.cause = params.cause;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      platform: this.platform,
      endpoint: this.endpoint,
      statusCode: this.statusCode,
      details: this.details
    };
  }

  static normalize(params: {
    platform: Platform;
    endpoint: string;
    error: unknown;
  }): SocialError {
    const { platform, endpoint, error } = params;
    if (error instanceof SocialError) {
      return error;
    }
    if (error && typeof error === "object") {
      const maybeAny = error as Record<string, unknown>;
      const response = maybeAny.response as
        | { status?: number; data?: unknown }
        | undefined;
      const message =
        (maybeAny.message as string | undefined) ??
        "Unknown platform SDK error";

      return new SocialError({
        platform,
        endpoint,
        message,
        statusCode: response?.status,
        details:
          response && typeof response === "object"
            ? {
                data: response.data,
                status: response.status,
                headers: (maybeAny as { response?: { headers?: unknown } }).response
                  ?.headers
              }
            : error,
        cause: error
      });
    }

    return new SocialError({
      platform,
      endpoint,
      message: String(error ?? "Unknown error"),
      cause: error
    });
  }
}
