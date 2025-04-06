import { useAppLayout } from "@app/providers/AppLayout";
import { cn } from "@app/utils/cn";
import { motion } from "framer-motion";
import React, { useRef } from "react";
import { useLocation } from "react-router-dom";

import { AppPageContext } from "./";

export const AppPageProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const articleFixedInfoRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const {
    appLayout: { rightSidebarOpen },
  } = useAppLayout();

  return (
    <AppPageContext.Provider value={{ containerRef, articleFixedInfoRef }}>
      <div className="relative w-full h-dvh">
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
            "fixed text-right top-0 right-0 lg:right-80 w-80 flex flex-col items-end gap-1 p-2 text-xs max-h-96 overflow-x-hidden overflow-y-auto text-secondary-600 *:bg-background-700 *:shrink-0",
            rightSidebarOpen ? "lg:right-80" : "lg:right-16",
          )}
          ref={articleFixedInfoRef}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 0 }}
          whileHover={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </AppPageContext.Provider>
  );
};
