import React from "react";
import Script from "next/script";

import Navbar from "@/components/Navbar";
import Providers from "@/providers";

import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://curi.ooo"),
  title: "Curio",
  description: "Curate your inspirations",
};

interface RootLayoutProps extends React.PropsWithChildren {}

const RootLayout: React.FC<RootLayoutProps> = ({
  children,
}: RootLayoutProps) => {
  return (
    <html lang="en">
      <head></head>
      <body>
        <Providers>
          <Navbar />
          <main className="w-full p-4">{children}</main>
        </Providers>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
};

export default RootLayout;
