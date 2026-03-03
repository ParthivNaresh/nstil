const RATE_LIMITED = 429;

export class ApiError extends Error {
  readonly status: number;
  readonly body: string;
  readonly retryAfter: number | null;

  constructor(status: number, body: string, retryAfter: number | null = null) {
    super(`API error ${status}: ${body}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.retryAfter = retryAfter;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isRateLimited(): boolean {
    return this.status === RATE_LIMITED;
  }
}

export class NoSessionError extends Error {
  constructor() {
    super("No active session");
    this.name = "NoSessionError";
  }
}
