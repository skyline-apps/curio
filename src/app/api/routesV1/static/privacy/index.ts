import { EnvBindings } from "@app/api/utils/env";
import { Hono } from "hono";

const staticPrivacyRouter = new Hono<EnvBindings>();

// eslint-disable-next-line @local/eslint-local-rules/api-middleware,@local/eslint-local-rules/api-validation,@local/eslint-local-rules/response-parse
staticPrivacyRouter.get("/", async (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - Curio</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
        }
        h1 {
            font-size: 1.5rem;
            font-weight: 500;
            text-align: center;
            margin-bottom: 8px;
        }
        h2 {
            font-size: 1rem;
            font-weight: 600;
            margin-top: 24px;
            margin-bottom: 8px;
        }
        h3 {
            font-size: 0.9rem;
            font-weight: 500;
            margin-top: 16px;
            margin-bottom: 8px;
        }
        p {
            font-size: 0.875rem;
            margin-bottom: 8px;
        }
        ul {
            font-size: 0.875rem;
            margin-left: 24px;
            margin-bottom: 8px;
        }
        li {
            margin-bottom: 4px;
        }
        .last-updated {
            font-size: 0.875rem;
            color: #666;
            margin-bottom: 32px;
        }
        a {
            color: #059669;
            text-decoration: none;
        }
        a:hover {
            color: #047857;
            text-decoration: underline;
        }
        .section {
            margin-bottom: 16px;
        }
    </style>
</head>
<body>
    <h1>Privacy Policy</h1>
    <p class="last-updated">Last updated: May 31, 2025</p>

    <div class="section">
        <h2>1. Introduction</h2>
        <p>
            This Privacy Policy ("Policy") describes how Curio ("we", "us",
            or "our") collects, uses, and protects your personal information
            when you use our content organization service (the "Service").
            By using our Service, you consent to the data practices
            described in this Policy.
        </p>
        <p>
            We are committed to protecting your privacy and handling your
            personal information responsibly and in accordance with
            applicable data protection laws.
        </p>
    </div>

    <div class="section">
        <h2>2. Information We Collect</h2>

        <h3>2.1 Information You Provide</h3>
        <ul>
            <li>
                <strong>Account Information:</strong> Email address, username,
                and authentication credentials when you create an account
            </li>
            <li>
                <strong>Social Login Data:</strong> When you sign in through
                third-party services (Google, Apple, etc.), we receive basic
                profile information as permitted by those services
            </li>
            <li>
                <strong>Content Data:</strong> Web content links, articles,
                notes, tags, folders, and other organizational data you save
                through the Service
            </li>
            <li>
                <strong>Communication Data:</strong> Messages you send to our
                support team or feedback you provide
            </li>
            <li>
                <strong>Payment Information:</strong> Billing details for
                premium subscriptions (processed through secure third-party
                payment processors)
            </li>
        </ul>

        <h3>2.2 Information We Collect Automatically</h3>
        <ul>
            <li>
                <strong>Usage Analytics:</strong> How you interact with the
                Service, features used, time spent, and navigation patterns
            </li>
            <li>
                <strong>Technical Information:</strong> IP address, device
                type, browser version, operating system, and mobile device
                identifiers
            </li>
            <li>
                <strong>Performance Data:</strong> App crashes, load times,
                and error reports to improve Service reliability
            </li>
            <li>
                <strong>Location Data:</strong> General location information
                derived from IP address (country/region level only)
            </li>
        </ul>

        <h3>2.3 Information from Third Parties</h3>
        <p>
            We may receive information about you from third-party services
            you connect to Curio, social media platforms you use to sign in,
            or publicly available sources when you save web content.
        </p>
    </div>

    <div class="section">
        <h2>3. How We Use Your Information</h2>
        <p>We use your information for the following purposes:</p>

        <h3>3.1 Service Provision</h3>
        <ul>
            <li>Creating and maintaining your account</li>
            <li>Providing core content organization functionality</li>
            <li>Syncing your data across devices</li>
            <li>Processing premium subscription payments</li>
            <li>Providing customer support</li>
        </ul>

        <h3>3.2 Service Improvement</h3>
        <ul>
            <li>Analyzing usage patterns to enhance user experience</li>
            <li>Developing new features and functionality</li>
            <li>Debugging and fixing technical issues</li>
            <li>Conducting research and analytics</li>
        </ul>

        <h3>3.3 Communications</h3>
        <ul>
            <li>Sending essential account and security notifications</li>
            <li>Providing customer support responses</li>
            <li>Sharing product updates and new features (with opt-out option)</li>
            <li>Sending billing and subscription-related communications</li>
        </ul>

        <h3>3.4 Legal and Security</h3>
        <ul>
            <li>Preventing fraud and abuse</li>
            <li>Complying with legal obligations</li>
            <li>Protecting our rights and interests</li>
            <li>Enforcing our Terms of Service</li>
        </ul>
    </div>

    <div class="section">
        <h2>4. Information Sharing and Disclosure</h2>
        <p>
            We do not sell, rent, or trade your personal information. We may
            share your information in the following limited circumstances:
        </p>

        <h3>4.1 Service Providers</h3>
        <p>
            We work with trusted third-party service providers who assist us
            in operating the Service, including:
        </p>
        <ul>
            <li>Cloud hosting and data storage providers</li>
            <li>Payment processing services</li>
            <li>Analytics and performance monitoring tools</li>
            <li>Customer support platforms</li>
            <li>Email communication services</li>
        </ul>
        <p>
            These providers are bound by confidentiality agreements and may
            only use your information to provide services to us.
        </p>

        <h3>4.2 Legal Requirements</h3>
        <p>We may disclose your information when required by law or to:</p>
        <ul>
            <li>Comply with legal processes or government requests</li>
            <li>Protect our rights, property, or safety</li>
            <li>Protect the rights, property, or safety of our users</li>
            <li>Investigate potential violations of our Terms of Service</li>
        </ul>
    </div>

    <div class="section">
        <h2>5. Data Security</h2>
        <p>
            We implement appropriate technical and organizational measures
            to protect your personal information against unauthorized
            access, alteration, disclosure, or destruction:
        </p>
        <ul>
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security assessments and updates</li>
            <li>Access controls and authentication requirements</li>
            <li>Secure data centers and infrastructure</li>
            <li>Employee training on data protection practices</li>
        </ul>
        <p>
            However, no method of transmission over the internet or
            electronic storage is 100% secure. We cannot guarantee absolute
            security.
        </p>
    </div>

    <div class="section">
        <h2>6. Data Retention</h2>
        <p>
            We retain your personal information for as long as necessary to
            provide the Service and fulfill the purposes outlined in this
            Policy:
        </p>
        <ul>
            <li>
                Account data is retained while your account is active and for
                30 days after deletion
            </li>
            <li>
                Analytics data is retained for up to 2 years in aggregated
                form
            </li>
            <li>
                Legal or regulatory requirements may require longer retention
                periods
            </li>
        </ul>
    </div>

    <div class="section">
        <h2>7. Your Privacy Rights</h2>
        <p>
            Depending on your location, you may have the following rights
            regarding your personal information:
        </p>

        <h3>7.1 Access and Portability</h3>
        <ul>
            <li>Request access to your personal information</li>
            <li>Receive a copy of your data in a portable format</li>
            <li>View what information we have collected about you</li>
        </ul>

        <h3>7.2 Correction and Deletion</h3>
        <ul>
            <li>Correct or update inaccurate personal information</li>
            <li>Request deletion of your account and associated data</li>
            <li>Remove specific content or information</li>
        </ul>

        <h3>7.3 Control and Consent</h3>
        <ul>
            <li>Opt-out of marketing communications</li>
            <li>Withdraw consent for certain data processing</li>
            <li>Object to processing based on legitimate interests</li>
            <li>Restrict processing in certain circumstances</li>
        </ul>

        <p>
            To exercise these rights, please contact us at 
            <a href="mailto:privacy@curi.ooo">privacy@curi.ooo</a>. 
            We will respond within 30 days.
        </p>
    </div>

    <div class="section">
        <h2>8. Cookies and Tracking Technologies</h2>
        <p>
            We use cookies and similar technologies to enhance your
            experience:
        </p>
        <ul>
            <li>
                <strong>Essential Cookies:</strong> Required for basic Service
                functionality and security
            </li>
            <li>
                <strong>Analytics Cookies:</strong> Help us understand how the
                Service is used and improve performance
            </li>
            <li>
                <strong>Preference Cookies:</strong> Remember your settings
                and customizations
            </li>
        </ul>
        <p>
            You can control cookie settings through your browser, though
            disabling certain cookies may affect Service functionality.
        </p>
    </div>

    <div class="section">
        <h2>9. International Data Transfers</h2>
        <p>
            Your information may be transferred to and processed in
            countries other than your own. We ensure appropriate safeguards
            are in place when transferring data internationally, including:
        </p>
        <ul>
            <li>
                Standard contractual clauses approved by regulatory
                authorities
            </li>
            <li>
                Adequacy decisions from relevant data protection authorities
            </li>
            <li>Other legally recognized transfer mechanisms</li>
        </ul>
    </div>

    <div class="section">
        <h2>10. Children's Privacy</h2>
        <p>
            Our Service is not intended for children under 13. We do not
            knowingly collect personal information from children under 13.
            If we discover we have collected information from a child under
            13, we will delete it immediately.
        </p>
        <p>
            If you are a parent or guardian and believe your child has
            provided us with personal information, please contact us
            immediately.
        </p>
    </div>

    <div class="section">
        <h2>11. Third-Party Links and Services</h2>
        <p>
            Our Service may contain links to third-party websites or
            integrate with third-party services. This Privacy Policy does
            not apply to those external sites or services. We encourage you
            to review the privacy policies of any third-party services you
            use.
        </p>
    </div>

    <div class="section">
        <h2>12. Changes to This Privacy Policy</h2>
        <p>
            We may update this Privacy Policy from time to time. We will
            notify you of material changes by:
        </p>
        <ul>
            <li>Posting the updated Policy on our website</li>
            <li>Sending an email notification to registered users</li>
            <li>Providing in-app notifications for significant changes</li>
        </ul>
        <p>
            Changes will take effect immediately upon posting. Your
            continued use of the Service after changes constitutes
            acceptance of the updated Policy.
        </p>
    </div>

    <div class="section">
        <h2>13. Regional Privacy Rights</h2>

        <h3>13.1 California Residents (CCPA)</h3>
        <p>
            California residents have additional rights under the California
            Consumer Privacy Act, including the right to know what personal
            information is collected, sold, or disclosed, and the right to
            delete personal information.
        </p>

        <h3>13.2 European Users (GDPR)</h3>
        <p>
            If you are in the European Economic Area, you have rights under
            the General Data Protection Regulation, including the right to
            access, rectify, erase, restrict processing, and data
            portability.
        </p>

        <h3>13.3 Other Jurisdictions</h3>
        <p>
            We comply with applicable privacy laws in all jurisdictions
            where we operate. Contact us for information about your specific
            rights.
        </p>
    </div>

    <div class="section">
        <h2>14. Contact Information</h2>
        <p>
            For any questions, concerns, or requests regarding this Privacy
            Policy or our data practices, please contact us at 
            <a href="mailto:privacy@curi.ooo">privacy@curi.ooo</a>.
        </p>
    </div>
</body>
</html>`;

  return c.html(html);
});

export { staticPrivacyRouter };
