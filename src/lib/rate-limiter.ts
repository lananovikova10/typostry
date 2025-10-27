/**
 * Client-side rate limiter to prevent API abuse
 * Uses a token bucket algorithm with configurable refill rate
 */

interface RateLimiterConfig {
  /** Maximum number of requests allowed in the time window */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
  /** Optional custom error message */
  errorMessage?: string
}

interface RateLimiterState {
  tokens: number
  lastRefill: number
}

/**
 * Rate limiter implementation using token bucket algorithm
 */
export class RateLimiter {
  private config: RateLimiterConfig
  private state: RateLimiterState

  constructor(config: RateLimiterConfig) {
    this.config = config
    this.state = {
      tokens: config.maxRequests,
      lastRefill: Date.now(),
    }
  }

  /**
   * Refills tokens based on elapsed time since last refill
   */
  private refillTokens(): void {
    const now = Date.now()
    const timePassed = now - this.state.lastRefill
    const tokensToAdd =
      (timePassed / this.config.windowMs) * this.config.maxRequests

    if (tokensToAdd > 0) {
      this.state.tokens = Math.min(
        this.config.maxRequests,
        this.state.tokens + tokensToAdd
      )
      this.state.lastRefill = now
    }
  }

  /**
   * Attempts to consume a token for a request
   * @returns true if request is allowed, false otherwise
   */
  public tryRequest(): boolean {
    this.refillTokens()

    if (this.state.tokens >= 1) {
      this.state.tokens -= 1
      return true
    }

    return false
  }

  /**
   * Executes a function with rate limiting
   * @throws Error if rate limit is exceeded
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.tryRequest()) {
      const errorMsg =
        this.config.errorMessage ||
        `Rate limit exceeded. Maximum ${this.config.maxRequests} requests per ${this.config.windowMs / 1000} seconds.`
      throw new Error(errorMsg)
    }

    return await fn()
  }

  /**
   * Gets the current number of available tokens
   */
  public getAvailableTokens(): number {
    this.refillTokens()
    return Math.floor(this.state.tokens)
  }

  /**
   * Gets time until next token refill in milliseconds
   */
  public getTimeUntilNextToken(): number {
    if (this.state.tokens >= 1) {
      return 0
    }

    const tokensNeeded = 1 - this.state.tokens
    const timePerToken = this.config.windowMs / this.config.maxRequests
    return Math.ceil(tokensNeeded * timePerToken)
  }

  /**
   * Resets the rate limiter state
   */
  public reset(): void {
    this.state = {
      tokens: this.config.maxRequests,
      lastRefill: Date.now(),
    }
  }
}

/**
 * Creates a rate-limited version of an async function
 */
export function withRateLimit<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  limiter: RateLimiter
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    return limiter.execute(() => fn(...args))
  }
}
