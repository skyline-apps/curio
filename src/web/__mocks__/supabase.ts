import { DEFAULT_TEST_USER_ID } from "@/utils/test/api";

export const supabaseMock = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: {
        user: { id: DEFAULT_TEST_USER_ID, email: "user@example.com" },
      },
      error: null,
    }),
    exchangeCodeForSession: jest.fn().mockResolvedValue({ error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  },
  storage: {
    from: jest.fn(() => ({
      download: jest
        .fn()
        .mockResolvedValue({ data: new Uint8Array([1, 2, 3]) }),
      upload: jest.fn().mockResolvedValue({ data: { path: "test-path" } }),
    })),
  },
};
