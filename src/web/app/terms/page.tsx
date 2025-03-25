import Footer from "@web/components/Landing/Footer";
import Navbar from "@web/components/Navbar";
import React from "react";

const TermsOfService: React.FC = () => {
  return (
    <>
      <Navbar />
      <div className="w-full p-4 md:p-8">
        <div className="flex flex-col justify-center items-start max-w-2xl mx-auto">
          <h1 className="text-lg font-medium text-center">Terms of service</h1>
          <p className="text-secondary text-sm">Last updated: March 24, 2025</p>
          <div className="text-sm my-4">
            <h2 className="font-medium my-2">Acceptance of terms</h2>
            <p>
              By using Curio, you agree to these Terms of Service
              (&quot;Terms&quot;). If you do not agree, please do not use the
              service.
            </p>
            <h2 className="font-medium my-2">Use of the service</h2>
            <p>
              Curio allows users to save and organize content from the internet.
              You agree to use the service in compliance with all applicable
              laws and regulations.
            </p>
            <h2 className="font-medium my-2">Prohibited content</h2>
            <p>
              You may not use Curio to save, store, or share any content that:
            </p>
            <ul className="list-disc ml-4">
              <li>
                Violates any local, state, national, or international law.
              </li>
              <li>Infringes on intellectual property rights.</li>
              <li>
                Contains or promotes hate speech, harassment, violence, or
                discrimination.
              </li>
              <li>
                Depicts or facilitates child exploitation, non-consensual
                content, or other illegal activities.
              </li>
              <li>
                Contains malicious software, viruses, or other harmful
                components.
              </li>
              <li>Violates the privacy or rights of others.</li>
            </ul>
            <p>
              We reserve the right to remove any content that violates these
              terms and take appropriate action, including account suspension or
              termination.
            </p>
            <h2 className="font-medium my-2">User responsibilities</h2>
            <p>
              You are responsible for ensuring that any content you save on
              Curio complies with these Terms. Curio is not responsible for
              content saved by users but may act upon violations at its
              discretion.
            </p>
            <h2 className="font-medium my-2">Account termination</h2>
            <p>
              We may suspend or terminate your account if you violate these
              Terms or engage in any conduct that we deem harmful to Curio or
              its users.
            </p>
            <h2 className="font-medium my-2">Changes to these terms</h2>
            <p>
              We may update these Terms at any time. Continued use of Curio
              after changes constitute acceptance of the revised Terms.
            </p>
            <h2 className="font-medium my-2">Contact us</h2>
            <p>
              For any questions regarding these Terms, contact us at{" "}
              <a
                href="mailto:support@curi.ooo"
                className="text-success-600 hover:text-success-700"
              >
                support@curi.ooo
              </a>
              .
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TermsOfService;
