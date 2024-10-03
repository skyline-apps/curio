import { createUsernameSlug, usernameError } from "./username";

describe("createUsernameSlug", () => {
  it("should create a valid username slug from an email", () => {
    const email = "test.user@example.com";
    const slug = createUsernameSlug(email);

    expect(slug).toMatch(/^testuser[a-z0-9]{1,7}$/);
  });

  it("should handle emails with special characters", () => {
    const email = "test.user+alias@example.com";
    const slug = createUsernameSlug(email);

    expect(slug).toMatch(/^testuseralias[a-z0-9]{1,7}$/);
  });

  it("should create unique slugs for the same email", () => {
    const email = "same@example.com";
    const slug1 = createUsernameSlug(email);
    const slug2 = createUsernameSlug(email);

    expect(slug1).not.toBe(slug2);
  });

  it("should handle empty local part of email", () => {
    const email = "@example.com";
    const slug = createUsernameSlug(email);

    expect(slug).toMatch(/^[a-z0-9]{1,7}$/);
  });
});

describe("usernameError", () => {
  it("should return empty string for valid usernames", () => {
    expect(usernameError("validuser")).toBe("");
    expect(usernameError("valid_user_123")).toBe("");
  });

  it("should return error for empty username", () => {
    expect(usernameError("")).toBe("Username cannot be empty.");
  });

  it("should return error for username shorter than 2 characters", () => {
    expect(usernameError("a")).toBe("Username must be at least 2 characters.");
  });

  it("should return error for username longer than 20 characters", () => {
    expect(usernameError("a".repeat(21))).toBe(
      "Username must be 20 characters or less.",
    );
  });

  it("should return error for username with invalid characters", () => {
    expect(usernameError("user@name")).toBe(
      "Username must contain only alphanumeric characters or underscores.",
    );
    expect(usernameError("user-name")).toBe(
      "Username must contain only alphanumeric characters or underscores.",
    );
    expect(usernameError("user.name")).toBe(
      "Username must contain only alphanumeric characters or underscores.",
    );
  });

  it("should allow underscores in username", () => {
    expect(usernameError("valid_user_name")).toBe("");
  });

  it("should allow numbers in username", () => {
    expect(usernameError("user123")).toBe("");
  });
});
