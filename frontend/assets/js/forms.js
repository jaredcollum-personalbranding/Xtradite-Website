/**
 * Contact form submission — writes to the `contact_submissions` table in Supabase.
 * RLS on that table grants `anon` INSERT only (see supabase/schema.sql), so this can't be
 * used to read back other visitors' submissions.
 */
import { supabase } from "./supabase-client.js";

/**
 * @param {{ name: string, email: string, company?: string, message: string }} fields
 */
export async function submitContactForm(fields) {
  const { error } = await supabase.from("contact_submissions").insert({
    name: fields.name,
    email: fields.email,
    company: fields.company || null,
    message: fields.message,
  });
  if (error) throw error;

  // Server-side GA4 conversion hit (Measurement Protocol) — records the lead even if
  // the browser's gtag.js call is blocked. Best-effort: never fails the form submission.
  fetch("/api/track-lead", { method: "POST" }).catch(() => {});
}
