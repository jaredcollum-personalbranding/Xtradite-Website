/**
 * Contact form submission — Wix Forms (Forms app), NOT a CMS collection.
 * Form: "Contact Form", id 8ae888de-ed1f-43b8-9627-26c9d9799eda (site 9f424aed-f9a6-4cf1-aaaa-5bb610a9defb).
 * Confirmed live via List Forms (form-schema-service/v4/forms) on 2026-07-11 — field target
 * keys and submit endpoint below are taken directly from that response, not guessed.
 */
import { wixApiRequest } from "./wix-client.js";

const CONTACT_FORM_ID = "8ae888de-ed1f-43b8-9627-26c9d9799eda";

/**
 * @param {{ name: string, email: string, company?: string, message: string }} fields
 */
export async function submitContactForm(fields) {
  const submissions = {
    first_name_0001: fields.name,
    email_0002: fields.email,
    message_0004: fields.message,
  };
  if (fields.company) submissions.company_0003 = fields.company;

  return wixApiRequest("/form-submission-service/v4/submissions", {
    method: "POST",
    body: {
      submission: {
        formId: CONTACT_FORM_ID,
        submissions,
      },
    },
  });
}
