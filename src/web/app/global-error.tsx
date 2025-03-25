"use client";

import { createLogger } from "@web/utils/logger";
import React from "react";

const log = createLogger("global-error");

const NotFound = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element => {
  log.error(error.digest || error.message);
  return (
    <html lang="en">
      <body className="text-foreground">
        <main className="w-full p-4">
          <div className="flex flex-col h-dvh justify-center items-center">
            <h2>Error loading page</h2>
            <button onClick={() => reset()}>Try again</button>
          </div>
        </main>
      </body>
    </html>
  );
};

export default NotFound;
