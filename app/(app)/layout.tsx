import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/nav/Navbar";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const googleName: string = user.user_metadata.full_name ?? user.email?.split("@")[0] ?? "?";
  const name: string = (profile?.display_name as string | null | undefined)?.trim() || googleName;
  const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const avatar: string | null = user.user_metadata.avatar_url ?? null;

  return (
    <>
      <Navbar initials={initials} avatar={avatar} />
      <div className="flex flex-1 flex-col overflow-x-clip px-2 py-4 md:overflow-x-visible md:p-8">{children}</div>
    </>
  );
}
