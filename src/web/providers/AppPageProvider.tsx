import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import React, { createContext, useContext, useRef } from "react";

interface AppPageContextValue {
  containerRef: React.RefObject<HTMLDivElement>;
}

const AppPageContext = createContext<AppPageContextValue | undefined>(
  undefined,
);

export const AppPageProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  return (
    <AppPageContext.Provider value={{ containerRef }}>
      <div className="w-full h-screen">
        <motion.div
          ref={containerRef}
          className="h-full p-4 overflow-y-auto"
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
