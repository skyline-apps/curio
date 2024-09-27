/* eslint-disable no-console */
interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

export const createLogger = (name: string): Logger => ({
  debug: (message: string, ...args: unknown[]): void =>
    console.debug(`[${name}] ${message}`, ...args),
  info: (message: string, ...args: unknown[]): void =>
    console.info(`[${name}] ${message}`, ...args),
  warn: (message: string, ...args: unknown[]): void =>
    console.warn(`[${name}] ${message}`, ...args),
  error: (message: string, ...args: unknown[]): void =>
    console.error(`[${name}] ${message}`, ...args),
});
