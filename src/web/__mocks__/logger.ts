export const createLogger = jest.fn(() => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // eslint-disable-next-line no-console
  error: console.error,
}));
