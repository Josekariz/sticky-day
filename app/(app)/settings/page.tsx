import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseShape } from "@/lib/core/types";
import { SettingsPanels } from "@/components/profile/SettingsPanels";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const userId = user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("summary_time, default_shape")
    .eq("id", userId)
    .maybeSingle();

  const summaryTime: string = String(profile?.summary_time ?? "18:00");
  const defaultShape = parseShape(profile?.default_shape);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-hand text-5xl font-bold">Settings</h1>
        <p className="text-sm text-fg-soft">How Sticky Day looks and behaves.</p>
      </header>

      <SettingsPanels
        userId={userId}
        summaryTime={summaryTime}
        defaultShape={defaultShape}
      />
    </main>
  );
}
