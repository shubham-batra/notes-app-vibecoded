import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/notes");
  }

  return (
    <main className="grid min-h-screen grid-rows-[1fr_auto_1fr] bg-zinc-50 px-4">
      <div className="pt-12 sm:pt-16">
        <div className="mx-auto w-full max-w-md text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Shubham&apos;s Note Taking Website
          </h1>
          <p className="mt-1 text-sm text-zinc-600">Secure markdown notes, built for speed.</p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-md">
        <AuthForm mode="login" />
      </div>
    </main>
  );
}
