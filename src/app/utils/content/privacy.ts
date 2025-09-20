export const privacyPolicyData = {
  title: "Privacy Policy",
  lastUpdated: "January 27, 2026",
  contactEmail: "privacy@curi.ooo",

  sections: {
    introduction: {
      title: "1. Introduction",
      content: [
        'This Privacy Policy ("Policy") describes how Curio ("we", "us", or "our") collects, uses, and protects your personal information when you use our content organization service (the "Service"). By using our Service, you consent to the data practices described in this Policy.',
        "We are committed to protecting your privacy and handling your personal information responsibly and in accordance with applicable data protection laws.",
      ],
    },

    informationWeCollect: {
      title: "2. Information We Collect",
      subsections: {
        informationYouProvide: {
          title: "2.1 Information You Provide",
          items: [
            "**Account Information:** Email address, username, and authentication credentials when you create an account",
            "**Social Login Data:** When you sign in through third-party services (Google, Apple, etc.), we receive basic profile information as permitted by those services",
            "**Content Data:** Web content links, articles, notes, tags, folders, and other organizational data you save through the Service",
            "**Communication Data:** Messages you send to our support team or feedback you provide",
            "**Payment Information:** Billing details for premium subscriptions (processed through secure third-party payment processors)",
          ],
        },
        informationWeCollectAutomatically: {
          title: "2.2 Information We Collect Automatically",
          items: [
            "**Usage Analytics:** How you interact with the Service, features used, time spent, and navigation patterns",
            "**Technical Information:** IP address, device type, browser version, operating system, and mobile device identifiers",
            "**Performance Data:** App crashes, load times, and error reports to improve Service reliability",
            "**Location Data:** General location information derived from IP address (country/region level only)",
          ],
        },
        informationFromThirdParties: {
          title: "2.3 Information from Third Parties",
          content:
            "We may receive information about you from third-party services you connect to Curio, social media platforms you use to sign in, or publicly available sources when you save web content.",
        },
      },
    },

    howWeUseInformation: {
      title: "3. How We Use Your Information",
      intro: "We use your information for the following purposes:",
      subsections: {
        serviceProvision: {
          title: "3.1 Service Provision",
          items: [
            "Creating and maintaining your account",
            "Providing core content organization functionality",
            "Syncing your data across devices",
            "Processing premium subscription payments",
            "Providing customer support",
          ],
        },
        serviceImprovement: {
          title: "3.2 Service Improvement",
          items: [
            "Analyzing usage patterns to enhance user experience",
            "Developing new features and functionality",
            "Debugging and fixing technical issues",
            "Conducting research and analytics",
          ],
        },
        communications: {
          title: "3.3 Communications",
          items: [
            "Sending essential account and security notifications",
            "Providing customer support responses",
            "Sharing product updates and new features (with opt-out option)",
            "Sending billing and subscription-related communications",
          ],
        },
        legalAndSecurity: {
          title: "3.4 Legal and Security",
          items: [
            "Preventing fraud and abuse",
            "Complying with legal obligations",
            "Protecting our rights and interests",
            "Enforcing our Terms of Service",
          ],
        },
      },
    },

    informationSharing: {
      title: "4. Information Sharing and Disclosure",
      intro:
        "We do not sell, rent, or trade your personal information. We may share your information in the following limited circumstances:",
      subsections: {
        serviceProviders: {
          title: "4.1 Service Providers",
          content:
            "We work with trusted third-party service providers who assist us in operating the Service, including:",
          items: [
            "Cloud hosting and data storage providers",
            "Payment processing services",
            "Analytics and performance monitoring tools",
            "Customer support platforms",
            "Email communication services",
          ],
          outro:
            "These providers are bound by confidentiality agreements and may only use your information to provide services to us.",
        },
        legalRequirements: {
          title: "4.2 Legal Requirements",
          content:
            "We may disclose your information when required by law or to:",
          items: [
            "Comply with legal processes or government requests",
            "Protect our rights, property, or safety",
            "Protect the rights, property, or safety of our users",
            "Investigate potential violations of our Terms of Service",
          ],
        },
      },
    },

    dataSecurity: {
      title: "5. Data Security",
      intro:
        "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction:",
      items: [
        "Encryption of data in transit and at rest",
        "Regular security assessments and updates",
        "Access controls and authentication requirements",
        "Secure data centers and infrastructure",
        "Employee training on data protection practices",
      ],
      outro:
        "However, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security.",
    },

    dataRetention: {
      title: "6. Data Retention",
      intro:
        "We retain your personal information for as long as necessary to provide the Service and fulfill the purposes outlined in this Policy:",
      items: [
        "Account data is retained while your account is active and for 30 days after deletion",
        "Analytics data is retained for up to 2 years in aggregated form",
        "Legal or regulatory requirements may require longer retention periods",
      ],
    },

    privacyRights: {
      title: "7. Your Privacy Rights",
      intro:
        "Depending on your location, you may have the following rights regarding your personal information:",
      subsections: {
        accessAndPortability: {
          title: "7.1 Access and Portability",
          items: [
            "Request access to your personal information",
            "Receive a copy of your data in a portable format",
            "View what information we have collected about you",
          ],
        },
        correctionAndDeletion: {
          title: "7.2 Correction and Deletion",
          items: [
            "Correct or update inaccurate personal information",
            "Request deletion of your account and associated data",
            "Remove specific content or information",
          ],
        },
        controlAndConsent: {
          title: "7.3 Control and Consent",
          items: [
            "Opt-out of marketing communications",
            "Withdraw consent for certain data processing",
            "Object to processing based on legitimate interests",
            "Restrict processing in certain circumstances",
          ],
        },
      },
      contact:
        "To exercise these rights, please contact us at privacy@curi.ooo. We will respond within 30 days.",
    },

    cookiesTracking: {
      title: "8. Cookies and Tracking Technologies",
      intro:
        "We use cookies and similar technologies to enhance your experience:",
      items: [
        "**Essential Cookies:** Required for basic Service functionality and security",
        "**Analytics Cookies:** Help us understand how the Service is used and improve performance",
        "**Preference Cookies:** Remember your settings and customizations",
      ],
      outro:
        "You can control cookie settings through your browser, though disabling certain cookies may affect Service functionality.",
    },

    internationalTransfers: {
      title: "9. International Data Transfers",
      intro:
        "Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place when transferring data internationally, including:",
      items: [
        "Standard contractual clauses approved by regulatory authorities",
        "Adequacy decisions from relevant data protection authorities",
        "Other legally recognized transfer mechanisms",
      ],
    },

    childrensPrivacy: {
      title: "10. Children's Privacy",
      content: [
        "Our Service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we discover we have collected information from a child under 13, we will delete it immediately.",
        "If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.",
      ],
    },

    thirdPartyLinks: {
      title: "11. Third-Party Links and Services",
      content:
        "Our Service may contain links to third-party websites or integrate with third-party services. This Privacy Policy does not apply to those external sites or services. We encourage you to review the privacy policies of any third-party services you use.",
    },

    policyChanges: {
      title: "12. Changes to This Privacy Policy",
      intro:
        "We may update this Privacy Policy from time to time. We will notify you of material changes by:",
      items: [
        "Posting the updated Policy on our website",
        "Sending an email notification to registered users",
        "Providing in-app notifications for significant changes",
      ],
      outro:
        "Changes will take effect immediately upon posting. Your continued use of the Service after changes constitutes acceptance of the updated Policy.",
    },

    regionalRights: {
      title: "13. Regional Privacy Rights",
      subsections: {
        california: {
          title: "13.1 California Residents (CCPA)",
          content:
            "California residents have additional rights under the California Consumer Privacy Act, including the right to know what personal information is collected, sold, or disclosed, and the right to delete personal information.",
        },
        europe: {
          title: "13.2 European Users (GDPR)",
          content:
            "If you are in the European Economic Area, you have rights under the General Data Protection Regulation, including the right to access, rectify, erase, restrict processing, and data portability.",
        },
        other: {
          title: "13.3 Other Jurisdictions",
          content:
            "We comply with applicable privacy laws in all jurisdictions where we operate. Contact us for information about your specific rights.",
        },
      },
    },

    contactInformation: {
      title: "14. Contact Information",
      content:
        "For any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at privacy@curi.ooo.",
    },
  },
};

// Helper function to render markdown-style text to HTML
export const renderMarkdownText = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
};
