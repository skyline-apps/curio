import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import React, { createContext, useContext, useRef } from "react";

import { useSettings } from "@/providers/SettingsProvider";
import { cn } from "@/utils/cn";

interface AppPageContextValue {
  containerRef: React.RefObject<HTMLDivElement>;
  articleFixedInfoRef: React.RefObject<HTMLDivElement>;
}

const AppPageContext = createContext<AppPageContextValue | undefined>(
  undefined,
);

export const AppPageProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const articleFixedInfoRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const {
    appLayout: { rightSidebarOpen },
  } = useSettings();

  return (
    <AppPageContext.Provider value={{ containerRef, articleFixedInfoRef }}>
      <div className="relative w-full h-screen">
        <motion.div
          ref={containerRef}
          className="h-full p-2 overflow-y-auto grow"
          key={pathname}
          initial={{ opacity: 0.8, x: -2 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            scrollBehavior: "smooth",
          }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {children}
        </motion.div>
        <motion.div
          className={cn(
            "fixed text-right top-0 right-0 lg:right-80 w-80 flex flex-col gap-1 p-2 text-xs max-h-96 overflow-x-hidden",
            rightSidebarOpen ? "lg:right-80" : "lg:right-16",
          )}
          ref={articleFixedInfoRef}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 0 }}
          whileHover={{ opacity: 0.5, x: 0 }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </AppPageContext.Provider>
  );
};

export const useAppPage = (): AppPageContextValue => {
  const context = useContext(AppPageContext);
  if (context === undefined) {
    throw new Error("useAppPage must be used within a AppPageProvider");
  }
  return context;
};
