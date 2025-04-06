import React, { createContext, useContext } from "react";

interface AppPageContextValue {
  containerRef: React.RefObject<HTMLDivElement | null>;
  articleFixedInfoRef: React.RefObject<HTMLDivElement | null>;
}

export const AppPageContext = createContext<AppPageContextValue | undefined>(
  undefined,
);

export const useAppPage = (): AppPageContextValue => {
  const context = useContext(AppPageContext);
  if (context === undefined) {
    throw new Error("useAppPage must be used within a AppPageProvider");
  }
  return context;
};
