import React from "react";
import { Noto_Sans, Noto_Serif, Noto_Sans_Mono } from 'next/font/google'


import Navbar from "@/components/Navbar";
import Providers from "@/providers";

import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://curi.ooo"),
  title: "Curio",
  description: "Curate your inspirations",
};

interface RootLayoutProps extends React.PropsWithChildren { }

const sans = Noto_Sans({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-sans',
})

const serif = Noto_Serif({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-serif',
})

const mono = Noto_Sans_Mono({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-mono',
})

const RootLayout: React.FC<RootLayoutProps> = ({
  children,
}: RootLayoutProps) => {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <head></head>
      <body className="text-foreground">
        <Providers>
          <Navbar />
          <main className="w-full p-4">{children}</main>
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
