/**
 * Supabase client — public project URL + anon (publishable) key. Safe to hardcode: this key
 * only grants what Row Level Security policies allow (public read on content tables, insert-only
 * on contact_submissions — see supabase/schema.sql), the same trust model the site previously
 * used for its Wix headless OAuth client ID.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://bmhkdyshluiloorgnwoy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Aj9nCJLFY9aMycZeQ3buTQ_-n-Q7SFK";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
