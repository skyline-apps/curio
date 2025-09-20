import { describe, expect, it } from "vitest";

import { staticPrivacyRouter } from "./index";

describe("Static Privacy Router", () => {
  it("should return HTML privacy policy", async () => {
    const req = new Request("http://localhost/");
    const res = await staticPrivacyRouter.fetch(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");

    const html = await res.text();
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>Privacy Policy - Curio</title>");
    expect(html).toContain("Privacy Policy");
    expect(html).toContain("Last updated: May 31, 2025");
    expect(html).toContain("privacy@curi.ooo");
  });

  it("should contain all major privacy policy sections", async () => {
    const req = new Request("http://localhost/");
    const res = await staticPrivacyRouter.fetch(req);
    const html = await res.text();

    // Check for key sections
    expect(html).toContain("1. Introduction");
    expect(html).toContain("2. Information We Collect");
    expect(html).toContain("3. How We Use Your Information");
    expect(html).toContain("4. Information Sharing and Disclosure");
    expect(html).toContain("5. Data Security");
    expect(html).toContain("6. Data Retention");
    expect(html).toContain("7. Your Privacy Rights");
    expect(html).toContain("8. Cookies and Tracking Technologies");
    expect(html).toContain("9. International Data Transfers");
    expect(html).toContain("10. Children's Privacy");
    expect(html).toContain("11. Third-Party Links and Services");
    expect(html).toContain("12. Changes to This Privacy Policy");
    expect(html).toContain("13. Regional Privacy Rights");
    expect(html).toContain("14. Contact Information");
  });

  it("should be accessible without JavaScript", async () => {
    const req = new Request("http://localhost/");
    const res = await staticPrivacyRouter.fetch(req);
    const html = await res.text();

    // Should not contain any script tags or JavaScript dependencies
    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");

    // Should contain inline CSS for styling
    expect(html).toContain("<style>");
    expect(html).toContain("font-family:");
  });
});
