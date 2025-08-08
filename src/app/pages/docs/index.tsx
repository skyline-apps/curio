import Footer from "@app/components/Landing/Footer";
import Markdown from "@app/components/Markdown";
import Navbar from "@app/components/Navbar";
import React, { useEffect } from "react";

import docs from "./docs";

const DocsPage: React.FC = () => {
  useEffect(() => {
    document.title = `Curio - Docs`;
  }, []);

  return (
    <>
      <Navbar />
      <div className="w-full p-4 md:p-8">
        <div className="flex flex-col justify-center items-start max-w-2xl mx-auto select-text">
          <h1 className="text-lg font-medium text-center mb-4">
            Curio user guide
          </h1>
          <Markdown className="[&_*]:text-sm select-text">{docs}</Markdown>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default DocsPage;
