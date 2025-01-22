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
};
