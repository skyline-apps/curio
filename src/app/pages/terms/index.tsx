import Footer from "@app/components/Landing/Footer";
import Navbar from "@app/components/Navbar";
import { termsOfServiceData } from "@app/utils/content/terms";
import React from "react";

const TermsOfService: React.FC = () => {
  return (
    <>
      <Navbar />
      <div className="w-full p-4 md:p-8">
        <div className="flex flex-col justify-center items-start max-w-2xl mx-auto select-text">
          <h1 className="text-lg font-medium text-center">
            {termsOfServiceData.title}
          </h1>
          <p className="text-secondary text-sm">
            Last updated: {termsOfServiceData.lastUpdated}
          </p>

          <div className="text-sm my-4 space-y-2">
            {termsOfServiceData.sections.map((section, index) => (
              <section key={index} className="space-y-2">
                <h2 className="font-semibold">{section.title}</h2>
                {section.content?.map((text, i) => <p key={i}>{text}</p>)}
                {section.items && (
                  <ul className="list-disc ml-6 space-y-1">
                    {section.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
                {section.subsections?.map((sub, i) => (
                  <div key={i}>
                    <h3 className="font-medium">{sub.title}</h3>
                    {typeof sub.content === "string" ? (
                      <p>{sub.content}</p>
                    ) : (
                      sub.content?.map((text: string, j: number) => (
                        <p key={j}>{text}</p>
                      ))
                    )}
                    {sub.items && (
                      <ul className="list-disc ml-6 space-y-1">
                        {sub.items.map((item, j) => (
                          <li key={j}>{item}</li>
                        ))}
                      </ul>
                    )}
                    {sub.outro && <p>{sub.outro}</p>}
                  </div>
                ))}
                {section.outro && <p>{section.outro}</p>}
                {section.contact && <p>{section.contact}</p>}
              </section>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TermsOfService;
