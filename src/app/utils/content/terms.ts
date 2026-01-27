export interface TermsSection {
  title: string;
  content?: string[];
  items?: string[];
  subsections?: TermsSubsection[];
  outro?: string;
  contact?: string[];
}

export interface TermsSubsection {
  title: string;
  content?: string | string[];
  items?: string[];
  outro?: string;
}

export const termsOfServiceData: {
  title: string;
  lastUpdated: string;
  sections: TermsSection[];
} = {
  title: "Terms of service",
  lastUpdated: "January 27, 2026",
  sections: [
    {
      title: "1. Acceptance of Terms",
      content: [
        `These Terms of Service ("Terms", "Agreement") govern your use of the Curio application and services (collectively, the "Service") operated by Curio ("us", "we", or "our"). By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these terms, you may not access the Service.`,
        `You must be at least 13 years old to use this Service. By using the Service, you represent and warrant that you meet this age requirement.`,
      ],
    },
    {
      title: "2. Description of Service",
      content: [
        `Curio is a content organization platform that allows users to save, organize, and manage content from the internet. The Service includes both free and premium features, with premium features available through paid subscription plans.`,
        `We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, with or without notice, though we will make reasonable efforts to provide advance notice of significant changes.`,
      ],
    },
    {
      title: "3. User Accounts and Registration",
      content: [
        `To access certain features of the Service, you must create an account. You agree to:`,
      ],
      items: [
        `Provide accurate, current, and complete information during registration`,
        `Maintain and promptly update your account information`,
        `Maintain the security and confidentiality of your login credentials`,
        `Accept responsibility for all activities under your account`,
        `Notify us immediately of any unauthorized use of your account`,
      ],
      outro: `You may not create accounts using automated means or create multiple accounts for the purpose of circumventing Service limitations.`,
    },
    {
      title: "4. Subscription Plans and Billing",
      subsections: [
        {
          title: "4.1 Premium Subscription",
          content: `Curio offers premium subscription plans ("Premium Subscription") that provide enhanced features and functionality. Premium Subscriptions are available on monthly or annual billing cycles.`,
        },
        {
          title: "4.2 Billing and Payment",
          items: [
            `Subscription fees are billed in advance on a recurring basis`,
            `Monthly subscriptions are billed every month on the date you first subscribed`,
            `Annual subscriptions are billed every year on the date you first subscribed`,
            `All fees are non-refundable except as expressly stated in these Terms`,
            `You authorize us to charge your chosen payment method for all applicable fees`,
            `If payment fails, we may suspend your Premium Subscription after reasonable notice`,
          ],
        },
        {
          title: "4.3 Cancellation and Refunds",
          content: `You may cancel your Premium Subscription at any time through your account settings. Cancellation will take effect at the end of your current billing period.`,
          outro: `Refunds may be available at our discretion. To request a refund, please contact us at support@curi.ooo with your request and reason. For subscriptions purchased through the Apple App Store, you may also request refunds directly through Apple's refund process in accordance with Apple's Terms of Service.`,
        },
        {
          title: "4.4 Free Trial",
          content: `We may offer free trial periods for Premium Subscriptions. If you do not cancel before the trial period ends, you will be automatically charged for the subscription. We reserve the right to limit trial eligibility and modify trial terms.`,
        },
      ],
    },
    {
      title: "5. Acceptable Use Policy",
      content: [
        `You agree to use the Service in compliance with all applicable laws and regulations. You may not:`,
      ],
      items: [
        `Use the Service for any unlawful purpose or in violation of these Terms`,
        `Interfere with or disrupt the Service or servers connected to the Service`,
        `Attempt to gain unauthorized access to any part of the Service`,
        `Use automated scripts or bots to access the Service`,
        `Reverse engineer, decompile, or disassemble any part of the Service`,
        `Transmit viruses, malware, or other malicious code`,
        `Impersonate others or provide false information`,
        `Violate the intellectual property rights of others`,
      ],
    },
    {
      title: "6. Prohibited Content",
      content: [`You may not use Curio to save, store, or share content that:`],
      items: [
        `Violates any local, state, national, or international law`,
        `Infringes on intellectual property rights or proprietary rights of others`,
        `Contains or promotes hate speech, harassment, violence, or discrimination`,
        `Depicts or facilitates child exploitation or abuse`,
        `Contains non-consensual intimate imagery or facilitates revenge sharing`,
        `Promotes illegal activities, drugs, or weapons`,
        `Contains malicious software, viruses, or other harmful components`,
        `Violates the privacy or rights of others`,
        `Is defamatory, libelous, or fraudulent`,
        `Constitutes spam or unsolicited commercial content`,
      ],
      outro: `We reserve the right to remove any content that violates these Terms and take appropriate action, including account suspension or termination, with or without notice.`,
    },
    {
      title: "7. Content and Intellectual Property",
      content: [
        `Curio allows you to save and organize references to web content. All saved content remains the property of its respective owners and creators. You are solely responsible for ensuring you have the right to save and access any content through the Service.`,
        `You represent and warrant that: (a) you have the necessary rights to save and access content through the Service; (b) your use of the Service does not infringe upon the intellectual property rights of others; and (c) you will comply with all applicable copyright laws and terms of service of third-party websites.`,
        `We do not claim ownership of any third-party content saved through the Service. We act as a neutral platform and do not endorse or verify the legality of saved content. If you believe content saved through our Service infringes your rights, please contact us immediately.`,
        `We reserve the right to remove any saved content upon notice of alleged infringement or at our discretion, and may terminate accounts of repeat infringers.`,
        `The Service itself, including its software, design, and functionality, is owned by us and protected by copyright, trademark, and other intellectual property laws.`,
      ],
    },
    {
      title: "8. Privacy and Data Protection",
      content: [
        `Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you consent to the collection and use of information as described in our Privacy Policy.`,
      ],
    },
    {
      title: "9. Account Termination",
      content: [
        `We may suspend or terminate your account and access to the Service immediately, without prior notice, for any reason, including if you:`,
      ],
      items: [
        `Violate these Terms`,
        `Engage in conduct harmful to the Service or other users`,
        `Fail to pay applicable fees`,
        `Provide false or misleading information`,
      ],
      outro: `You may terminate your account at any time by contacting us. Upon termination, your right to use the Service will cease immediately, though certain provisions of these Terms will survive termination.`,
    },
    {
      title: "10. Disclaimers and Limitation of Liability",
      content: [
        `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.`,
        `TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR USE, ARISING OUT OF YOUR USE OF THE SERVICE.`,
        `OUR TOTAL LIABILITY TO YOU SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE MONTHS PRECEDING THE CLAIM.`,
      ],
    },
    {
      title: "11. Indemnification",
      content: [
        `You agree to indemnify, defend, and hold harmless Curio and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses arising out of your use of the Service, violation of these Terms, or infringement of any rights of others.`,
      ],
    },
    {
      title: "12. Dispute Resolution",
      content: [
        `Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. You waive any right to participate in class action lawsuits or class-wide arbitrations.`,
        `This arbitration clause does not apply to disputes that may be brought in small claims court or requests for injunctive relief.`,
      ],
    },
    {
      title: "13. Governing Law",
      content: [
        `These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to conflict of law principles. Any legal action shall be brought in the courts of San Francisco County, California.`,
      ],
    },
    {
      title: "14. Changes to Terms",
      content: [
        `We reserve the right to modify these Terms at any time. We will notify users of material changes by email or through the Service at least 30 days before the changes take effect. Your continued use of the Service after changes become effective constitutes acceptance of the revised Terms.`,
      ],
    },
    {
      title: "15. Severability",
      content: [
        `If any provision of these Terms is found to be unenforceable or invalid, the remaining provisions will remain in full force and effect, and the unenforceable provision will be replaced with an enforceable provision that most closely matches the intent of the original.`,
      ],
    },
    {
      title: "16. Entire Agreement",
      content: [
        `These Terms, together with our Privacy Policy, constitute the entire agreement between you and Curio regarding the Service and supersede all prior agreements and understandings.`,
      ],
    },
    {
      title: "17. Contact Information",
      content: [
        `For any questions regarding these Terms or the Service, please contact us at support@curi.ooo.`,
      ],
    },
  ],
};
