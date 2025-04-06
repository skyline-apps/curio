import Button from "@app/components/ui/Button";
import { createClient } from "@web/utils/supabase/client";
import { useState } from "react";
import { FaGoogle } from "react-icons/fa6";

interface GoogleOAuthButtonProps {
  nextUrl?: string;
}

const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  nextUrl,
}: GoogleOAuthButtonProps) => {
  const supabase = createClient();
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignInWithGoogle = async (): Promise<void> => {
    setIsSigningIn(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${nextUrl || ""}`,
      },
    });
    setIsSigningIn(false);
    if (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <div
      id="google-signin-button"
      className="flex flex-col gap-2 items-center w-full"
    >
      <Button
        isLoading={isSigningIn}
        onPress={handleSignInWithGoogle}
        fullWidth
        color="primary"
        size="sm"
      >
        <FaGoogle className="mr-2" /> Sign in with Google
      </Button>
      <p className="text-danger text-sm">{errorMessage}</p>
    </div>
  );
};

export default GoogleOAuthButton;
