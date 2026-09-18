/**
 * Configuration comes from the environment, never from a committed file
 * (SRS BE-007). This is a thin, dependency-free reader — no config value is
 * ever hard-coded as a fallback for anything security- or tenant-relevant;
 * callers decide what's required vs. optional.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function optionalEnv(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}
