import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** One auth lookup per request — layout and board page share it. */
export const getSessionUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
});
