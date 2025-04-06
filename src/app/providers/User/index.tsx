import { createContext, useContext } from "react";

export type User = {
  id: string | null;
  username: string | null;
  email: string | null;
  newsletterEmail: string | null;
};

export type UserContextType = {
  user: User;
  clearUser: () => void;
  changeUsername: (username: string) => Promise<void>;
  updateNewsletterEmail: () => Promise<void>;
  handleLogout: () => Promise<void>;
};
export const UserContext = createContext<UserContextType>({
  user: {
    id: null,
    username: null,
    email: null,
    newsletterEmail: null,
  },
  clearUser: () => {},
  changeUsername: (_username: string) => Promise.resolve(),
  updateNewsletterEmail: () => Promise.resolve(),
  handleLogout: () => Promise.resolve(),
});

export const useUser = (): UserContextType => {
  return useContext(UserContext);
};
