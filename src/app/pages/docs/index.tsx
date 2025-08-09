import AppPage from "@app/components/AppPage";
import Markdown from "@app/components/Markdown";
import Navbar from "@app/components/Navbar";
import RightSidebar from "@app/components/RightSidebar";
import React, { useEffect, useRef } from "react";

import docs from "./docs";

const DocsPage: React.FC = () => {
  const headingLinksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = `Curio - Docs`;
  }, []);

  return (
    <div className="flex flex-col w-full h-dvh overflow-hidden">
      <Navbar />
      <div className="flex flex-row flex-1 relative overflow-y-auto">
        <AppPage enforceAuth={false}>
          <div className="w-full lg:w-4xl max-w-4xl self-start pl-2 py-8 mx-auto select-text">
            <h1 className="text-2xl font-medium mb-4">Curio user guide</h1>
            <Markdown
              className="select-text [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-medium [&_h4]:text-base [&_h4]:font-medium [&_h5]:text-sm [&_h5]:font-medium [&_h6]:text-sm [&_h6]:font-medium [&_p]:text-sm [&_li]:text-sm [&_blockquote]:text-sm [&_code]:text-xs [&_img]:max-w-[600px] [&_img]:max-h-[600px]"
              headingPortalRef={headingLinksRef}
            >
              {docs}
            </Markdown>
          </div>
        </AppPage>
        <RightSidebar
          content={
            // Account for navbar and fixed sidebar position on smaller screens
            <div className="flex flex-col gap p-2 overflow-y-auto h-full mt-16 lg:mt-2">
              <h2 className="text-sm font-bold text-secondary-400 mb-4">
                Table of Contents
              </h2>
              <div
                ref={headingLinksRef}
                className="flex flex-col gap-2 text-sm text-secondary-600 ml-2"
              />
            </div>
          }
        />
      </div>
    </div>
  );
};

export default DocsPage;
