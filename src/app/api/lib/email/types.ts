import { type Header } from "postal-mime";

export type EmailHeaders = Header[];

export class EmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailError";
  }
}

export interface Email {
  recipient: string; // Should include the CURIO_EMAIL_DOMAIN hostname.
  sender: { address: string; name: string };
  subject: string;
  htmlContent?: string; // HTML content or plaintext as HTML of email if available.
  textContent?: string; // Plaintext of email if available.
  content: string; // Cleaner content. Prioritizes plaintext, then HTML.
  headers: EmailHeaders;
}
