export function createUsernameSlug(email: string): string {
  const username = email.split("@")[0];
  const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, "");

  // Add a random suffix to ensure uniqueness
  const uniqueSuffix = Math.random().toString(36).substring(7);
  const uniqueUsernameSlug = cleanUsername + uniqueSuffix;

  return uniqueUsernameSlug;
}

// Returns an empty string if OK, or a reason if invalid.
export function isValidUsername(username: string): string {
  const allowedCharacters = /^[a-zA-Z0-9_]+$/;
  if (!username) {
    return "Username cannot be empty.";
  }
  if (username.length < 2) {
    return "Username must be at least 2 characters.";
  }
  if (username.length > 20) {
    return "Username must be 20 characters or less.";
  }
  if (!allowedCharacters.test(username)) {
    return "Username must contain only alphanumeric characters or underscores.";
  }
  return "";
}
