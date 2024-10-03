export const supabaseMock = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: "user1", email: "user@example.com" }, error: null },
    }),
    exchangeCodeForSession: jest.fn().mockResolvedValue({ error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  },
};
