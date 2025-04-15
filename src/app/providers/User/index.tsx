import { createContext, useContext } from "react";

export type User = {
  id: string | null;
  email: string | null;
};

export type UserContextType = {
  user: User;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  clearUser: () => void;
  handleLogout: () => Promise<void>;
};

export const UserContext = createContext<UserContextType>({
  user: {
    id: null,
    email: null,
  },
  isLoading: true,
  refreshUser: () => Promise.resolve(),
  clearUser: () => {},
  handleLogout: () => Promise.resolve(),
});

export const useUser = (): UserContextType => {
  return useContext(UserContext);
};
