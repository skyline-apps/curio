import { DEFAULT_TEST_USER_ID } from "@api/utils/test/api";
import type { SupabaseClient } from "@supabase/supabase-js"; // eslint-disable-line no-restricted-imports
import { vi } from "vitest";

export { AuthError } from "@supabase/supabase-js"; // eslint-disable-line no-restricted-imports

const signOutMock = vi.fn().mockResolvedValue({ error: null });

export const supabaseMock = {
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: {
        user: { id: DEFAULT_TEST_USER_ID, email: "user@example.com" },
      },
      error: null,
    }),
    exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
    signOut: signOutMock,
    getSession: vi.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: DEFAULT_TEST_USER_ID, email: "user@example.com" },
        },
      },
      error: null,
    }),
  },
  storage: {
    from: vi.fn(() => ({
      download: vi.fn().mockResolvedValue({ data: new Uint8Array([1, 2, 3]) }),
      upload: vi.fn().mockResolvedValue({ data: { path: "test-path" } }),
    })),
  },
} as unknown as SupabaseClient;

export const createClient = vi.fn().mockReturnValue(supabaseMock);
