"use client";
import React from "react";

import Footer from "@/components/Landing/Footer";
import Navbar from "@/components/Navbar";

interface PublicLayoutProps {
  children: React.ReactNode;
}

const LoginLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col w-full h-dvh overflow-hidden">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
};

export default LoginLayout;
