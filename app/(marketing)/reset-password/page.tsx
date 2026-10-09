import { createClient } from "@/lib/supabase/server";
import { NewPasswordNote } from "@/components/auth/NewPasswordNote";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="flex w-full flex-1 flex-col items-center justify-center">
      <NewPasswordNote signedIn={!!user} />
    </main>
  );
}
