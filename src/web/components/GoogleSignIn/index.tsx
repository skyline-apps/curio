"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/utils/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
globalThis.handleSignInWithGoogle = async function (
  response: any,
): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: response.credential,
  });
  if (error) {
    console.error(error);
  }
  if (data) {
    window.location.href = "/home";
  }
};

const GoogleOAuthButton: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div id="google-signin-button">
      <div
        id="g_id_onload"
        data-client_id="900658872079-sos9stfq83hhh3vk2fumfmrp3m9qai8o.apps.googleusercontent.com"
        data-context="signin"
        data-ux_mode="popup"
        data-callback="handleSignInWithGoogle"
        data-auto_prompt="false"
        data-use_fedcm_for_prompt="true"
      ></div>

      <div
        className="g_id_signin"
        data-type="standard"
        data-shape="rectangular"
        data-theme="outline"
        data-text="signin_with"
        data-size="large"
        data-logo_alignment="left"
      ></div>
    </div>
  );
};

export default GoogleOAuthButton;
