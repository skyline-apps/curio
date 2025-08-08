import Footer from "@app/components/Landing/Footer";
import Markdown from "@app/components/Markdown";
import Navbar from "@app/components/Navbar";
import React, { useEffect, useRef } from "react";

import docs from "./docs";

const DocsPage: React.FC = () => {
  const headingLinksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = `Curio - Docs`;
  }, []);

  return (
    <>
      <Navbar />
      <div className="w-full p-4 md:p-8">
        <div className="flex gap-8 max-w-6xl mx-auto">
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-16">
              <h2 className="text-sm font-semibold text-secondary mb-4">
                Table of Contents
              </h2>
              <div
                ref={headingLinksRef}
                className="flex flex-col gap-2 text-sm"
              />
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="max-w-2xl select-text">
              <h1 className="text-lg font-medium mb-4">Curio user guide</h1>
              <Markdown
                className="select-text [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-medium [&_h4]:text-base [&_h4]:font-medium [&_h5]:text-sm [&_h5]:font-medium [&_h6]:text-sm [&_h6]:font-medium [&_p]:text-sm [&_li]:text-sm [&_blockquote]:text-sm [&_code]:text-xs"
                headingPortalRef={headingLinksRef}
              >
                {docs}
              </Markdown>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default DocsPage;
