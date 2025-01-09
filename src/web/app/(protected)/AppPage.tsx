"use client";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import React, { useContext } from "react";

import Spinner from "@/components/Spinner";
import { UserContext } from "@/providers/UserProvider";

interface AppPageProps {
  children: React.ReactNode;
}

const AppPage: React.FC<AppPageProps> = ({ children }) => {
  const { user } = useContext(UserContext);
  const pathname = usePathname();

  return (
    <div className="w-full h-screen">
      {user.id ? (
        <motion.div
          className="h-full"
          key={pathname}
          initial={{ opacity: 0.8, x: -2 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      ) : (
        <Spinner centered />
      )}
    </div>
  );
};

export default AppPage;
