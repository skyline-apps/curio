import Footer from "@app/components/Landing/Footer";
import Navbar from "@app/components/Navbar";
import React from "react";

const Privacy: React.FC = () => {
  return (
    <>
      <Navbar />
      <div className="w-full p-4 md:p-8">
        <div className="flex flex-col justify-center items-start max-w-2xl mx-auto">
          <h1 className="text-lg font-medium text-center">Privacy policy</h1>
          <p className="text-secondary text-sm">Last updated: March 24, 2025</p>
          <div className="text-sm my-4">
            <h2 className="font-medium my-2">Information we collect</h2>
            <p>
              We collect minimal information necessary to provide and improve
              our service:
            </p>
            <ul className="list-disc ml-4">
              <li>
                Authentication data: Email address and necessary information
                from linked social accounts used for sign-in
              </li>
              <li>
                User-generated content: Articles, notes, tags, and other content
                you save or create within the application
              </li>
              <li>
                Usage data: Anonymous analytics about how you interact with our
                service, including features used and performance metrics
              </li>
              <li>
                Technical data: Device information, IP address, browser type,
                and operating system for service optimization
              </li>
            </ul>

            <h2 className="font-medium my-2">How we use your information</h2>
            <p>We use your information for the following specific purposes:</p>
            <ul className="list-disc ml-4">
              <li>Providing and maintaining our core service functionality</li>
              <li>
                Sending essential account-related notifications and security
                alerts
              </li>
              <li>
                Communicating product updates, new features, and service
                improvements (with opt-out option)
              </li>
              <li>
                Analyzing usage patterns to improve user experience and
                application performance
              </li>
              <li>Preventing fraud and ensuring platform security</li>
            </ul>

            <h2 className="font-medium my-2">Data protection</h2>
            <p>
              We do not sell, rent, or trade your personal information to third
              parties. We may share data with service providers who assist in
              operating our service, subject to strict confidentiality
              agreements.
            </p>

            <h2 className="font-medium my-2">Your privacy rights</h2>
            <p>
              You have the following rights regarding your personal information:
            </p>
            <ul className="list-disc ml-4">
              <li>Access and download your personal data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Opt-out of non-essential communications</li>
              <li>Request a copy of your data in a portable format</li>
            </ul>

            <h2 className="font-medium my-2">Contact us</h2>
            <p>
              For any privacy-related questions, please contact us at{" "}
              <a
                href="mailto:privacy@curi.ooo"
                className="text-success-600 hover:text-success-700"
              >
                privacy@curi.ooo
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

export default Privacy;
