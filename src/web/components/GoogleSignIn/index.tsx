import { useState } from "react";

import Button from "@/components/Button";
import { createClient } from "@/utils/supabase/client";

interface GoogleOAuthButtonProps {
  nextUrl?: string;
}

const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  nextUrl,
}: GoogleOAuthButtonProps) => {
  const supabase = createClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignInWithGoogle = async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${nextUrl || ""}`,
      },
    });
    if (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <div id="google-signin-button">
      <Button onClick={handleSignInWithGoogle}>Sign in with Google</Button>
      <p className="text-red-500">{errorMessage}</p>
    </div>
  );
};

export default GoogleOAuthButton;
