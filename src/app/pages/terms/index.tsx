import Footer from "@app/components/Landing/Footer";
import Navbar from "@app/components/Navbar";
import React from "react";

const TermsOfService: React.FC = () => {
  return (
    <>
      <Navbar />
      <div className="w-full p-4 md:p-8">
        <div className="flex flex-col justify-center items-start max-w-2xl mx-auto select-text">
          <h1 className="text-lg font-medium text-center">Terms of service</h1>
          <p className="text-secondary text-sm">Last updated: May 31, 2025</p>

          <div className="text-sm my-4 space-y-2">
            <section className="space-y-2">
              <h2 className="font-semibold">1. Acceptance of Terms</h2>
              <p>
                These Terms of Service ("Terms", "Agreement") govern your use of
                the Curio application and services (collectively, the "Service")
                operated by Curio ("us", "we", or "our"). By accessing or using
                our Service, you agree to be bound by these Terms. If you
                disagree with any part of these terms, you may not access the
                Service.
              </p>
              <p>
                You must be at least 13 years old to use this Service. By using
                the Service, you represent and warrant that you meet this age
                requirement.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold">2. Description of Service</h2>
              <p>
                Curio is a content organization platform that allows users to
                save, organize, and manage content from the internet. The
                Service includes both free and premium features, with premium
                features available through paid subscription plans.
              </p>
              <p>
                We reserve the right to modify, suspend, or discontinue any
                aspect of the Service at any time, with or without notice,
                though we will make reasonable efforts to provide advance notice
                of significant changes.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold">
                3. User Accounts and Registration
              </h2>
              <p>
                To access certain features of the Service, you must create an
                account. You agree to:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>
                  Provide accurate, current, and complete information during
                  registration
                </li>
                <li>Maintain and promptly update your account information</li>
                <li>
                  Maintain the security and confidentiality of your login
                  credentials
                </li>
                <li>
                  Accept responsibility for all activities under your account
                </li>
                <li>
                  Notify us immediately of any unauthorized use of your account
                </li>
              </ul>
              <p>
                You may not create accounts using automated means or create
                multiple accounts for the purpose of circumventing Service
                limitations.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold">
                4. Subscription Plans and Billing
              </h2>

              <h3 className="font-medium">4.1 Premium Subscription</h3>
              <p>
                Curio offers premium subscription plans ("Premium Subscription")
                that provide enhanced features and functionality. Premium
                Subscriptions are available on monthly or annual billing cycles.
              </p>

              <h3 className="font-medium">4.2 Billing and Payment</h3>
              <ul className="list-disc ml-6 space-y-1">
                <li>
                  Subscription fees are billed in advance on a recurring basis
                </li>
                <li>
                  Monthly subscriptions are billed every month on the date you
                  first subscribed
                </li>
                <li>
                  Annual subscriptions are billed every year on the date you
                  first subscribed
                </li>
                <li>
                  All fees are non-refundable except as expressly stated in
                  these Terms
                </li>
                <li>
                  You authorize us to charge your chosen payment method for all
                  applicable fees
                </li>
                <li>
                  If payment fails, we may suspend your Premium Subscription
                  after reasonable notice
                </li>
              </ul>

              <h3 className="font-medium">4.3 Cancellation and Refunds</h3>
              <p>
                You may cancel your Premium Subscription at any time through
                your account settings. Cancellation will take effect at the end
                of your current billing period.
              </p>
              <p>
                Refunds may be available at our discretion. To request a refund,
                please contact us at{" "}
                <a
                  href="mailto:support@curi.ooo"
                  className="text-success-600 hover:text-success-700"
                >
                  support@curi.ooo
                </a>{" "}
                with your request and reason. For subscriptions purchased
                through the Apple App Store, you may also request refunds
                directly through Apple's refund process in accordance with
                Apple's Terms of Service.
              </p>

              <h3 className="font-medium">4.4 Free Trial</h3>
              <p>
                We may offer free trial periods for Premium Subscriptions. If
                you do not cancel before the trial period ends, you will be
                automatically charged for the subscription. We reserve the right
                to limit trial eligibility and modify trial terms.
              </p>
            </section>

            <section>
              <h2 className="font-semibold">5. Acceptable Use Policy</h2>
              <p>
                You agree to use the Service in compliance with all applicable
                laws and regulations. You may not:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>
                  Use the Service for any unlawful purpose or in violation of
                  these Terms
                </li>
                <li>
                  Interfere with or disrupt the Service or servers connected to
                  the Service
                </li>
                <li>
                  Attempt to gain unauthorized access to any part of the Service
                </li>
                <li>Use automated scripts or bots to access the Service</li>
                <li>
                  Reverse engineer, decompile, or disassemble any part of the
                  Service
                </li>
                <li>Transmit viruses, malware, or other malicious code</li>
                <li>Impersonate others or provide false information</li>
                <li>Violate the intellectual property rights of others</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold">6. Prohibited Content</h2>
              <p>
                You may not use Curio to save, store, or share content that:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>
                  Violates any local, state, national, or international law
                </li>
                <li>
                  Infringes on intellectual property rights or proprietary
                  rights of others
                </li>
                <li>
                  Contains or promotes hate speech, harassment, violence, or
                  discrimination
                </li>
                <li>Depicts or facilitates child exploitation or abuse</li>
                <li>
                  Contains non-consensual intimate imagery or facilitates
                  revenge sharing
                </li>
                <li>Promotes illegal activities, drugs, or weapons</li>
                <li>
                  Contains malicious software, viruses, or other harmful
                  components
                </li>
                <li>Violates the privacy or rights of others</li>
                <li>Is defamatory, libelous, or fraudulent</li>
                <li>Constitutes spam or unsolicited commercial content</li>
              </ul>
              <p>
                We reserve the right to remove any content that violates these
                Terms and take appropriate action, including account suspension
                or termination, with or without notice.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold">
                7. Content and Intellectual Property
              </h2>
              <p>
                Curio allows you to save and organize references to web content.
                All saved content remains the property of its respective owners
                and creators. You are solely responsible for ensuring you have
                the right to save and access any content through the Service.
              </p>
              <p>
                You represent and warrant that: (a) you have the necessary
                rights to save and access content through the Service; (b) your
                use of the Service does not infringe upon the intellectual
                property rights of others; and (c) you will comply with all
                applicable copyright laws and terms of service of third-party
                websites.
              </p>
              <p>
                We do not claim ownership of any third-party content saved
                through the Service. We act as a neutral platform and do not
                endorse or verify the legality of saved content. If you believe
                content saved through our Service infringes your rights, please
                contact us immediately.
              </p>
              <p>
                We reserve the right to remove any saved content upon notice of
                alleged infringement or at our discretion, and may terminate
                accounts of repeat infringers.
              </p>
              <p>
                The Service itself, including its software, design, and
                functionality, is owned by us and protected by copyright,
                trademark, and other intellectual property laws.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold">8. Privacy and Data Protection</h2>
              <p>
                Your privacy is important to us. Our collection and use of
                personal information is governed by our Privacy Policy, which is
                incorporated into these Terms by reference. By using the
                Service, you consent to the collection and use of information as
                described in our Privacy Policy.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold">9. Account Termination</h2>
              <p>
                We may suspend or terminate your account and access to the
                Service immediately, without prior notice, for any reason,
                including if you:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Violate these Terms</li>
                <li>Engage in conduct harmful to the Service or other users</li>
                <li>Fail to pay applicable fees</li>
                <li>Provide false or misleading information</li>
              </ul>
              <p>
                You may terminate your account at any time by contacting us.
                Upon termination, your right to use the Service will cease
                immediately, though certain provisions of these Terms will
                survive termination.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold">
                10. Disclaimers and Limitation of Liability
              </h2>
              <p>
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
                WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DISCLAIM ALL
                WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR
                PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE
                FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
                PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR USE,
                ARISING OUT OF YOUR USE OF THE SERVICE.
              </p>
              <p>
                OUR TOTAL LIABILITY TO YOU SHALL NOT EXCEED THE AMOUNT YOU PAID
                TO US IN THE TWELVE MONTHS PRECEDING THE CLAIM.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold">11. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Curio and its
                officers, directors, employees, and agents from any claims,
                liabilities, damages, losses, and expenses arising out of your
                use of the Service, violation of these Terms, or infringement of
                any rights of others.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold">12. Dispute Resolution</h2>
              <p>
                Any disputes arising from these Terms or your use of the Service
                shall be resolved through binding arbitration in accordance with
                the rules of the American Arbitration Association. You waive any
                right to participate in class action lawsuits or class-wide
                arbitrations.
              </p>
              <p>
                This arbitration clause does not apply to disputes that may be
                brought in small claims court or requests for injunctive relief.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold">13. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance
                with the laws of the State of California, without regard to
                conflict of law principles. Any legal action shall be brought in
                the courts of San Francisco County, California.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold">14. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will
                notify users of material changes by email or through the Service
                at least 30 days before the changes take effect. Your continued
                use of the Service after changes become effective constitutes
                acceptance of the revised Terms.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold">15. Severability</h2>
              <p>
                If any provision of these Terms is found to be unenforceable or
                invalid, the remaining provisions will remain in full force and
                effect, and the unenforceable provision will be replaced with an
                enforceable provision that most closely matches the intent of
                the original.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold">16. Entire Agreement</h2>
              <p>
                These Terms, together with our Privacy Policy, constitute the
                entire agreement between you and Curio regarding the Service and
                supersede all prior agreements and understandings.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold">17. Contact Information</h2>
              <p>
                For any questions regarding these Terms or the Service, please
                contact us at{" "}
                <a
                  href="mailto:support@curi.ooo"
                  className="text-success-600 hover:text-success-700"
                >
                  support@curi.ooo
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TermsOfService;
