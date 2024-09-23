import React from "react";

import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://TODO-my-site.com"),
  title: "TODO page title",
  description: "TODO page description",
};

interface RootLayoutProps extends React.PropsWithChildren {}

const RootLayout: React.FC<RootLayoutProps> = ({
  children,
}: RootLayoutProps) => {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
