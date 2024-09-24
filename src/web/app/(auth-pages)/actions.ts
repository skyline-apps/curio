"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { encodedRedirect } from "@/utils/redirect";

export const signInAction = async (formData: FormData): Promise<never> => {
  const email = formData.get("email") as string;
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    return encodedRedirect("error", "/login", error.message);
  }

  return redirect("/home");
};

export const signOutAction = async (): Promise<never> => {
  const supabase = createClient();
  await supabase.auth.signOut();
  return redirect("/login");
};
