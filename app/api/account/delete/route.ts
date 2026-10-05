import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });

  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    console.error("delete_my_account failed", error.message);
    return Response.json({ error: "Couldn't delete your account. Try again." }, { status: 500 });
  }

  // The auth row is gone, so the logout call may 404; signOut still clears the cookies.
  await supabase.auth.signOut();
  return new Response(null, { status: 204 });
}
