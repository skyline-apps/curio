import Button from "@app/components/ui/Button";
import { getSupabaseClient } from "@app/utils/supabase";
import { Browser } from "@capacitor/browser";
import { useState } from "react";
import { FaGoogle } from "react-icons/fa6";

interface GoogleOAuthButtonProps {
  nextUrl?: string;
}

const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  nextUrl,
}: GoogleOAuthButtonProps) => {
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const redirectTo = import.meta.env.VITE_CURIO_URL || location.origin;

  const handleSignInWithGoogle = async (): Promise<void> => {
    setIsSigningIn(true);
    setErrorMessage(null);
    const supabase = getSupabaseClient();

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${redirectTo}/auth/callback?next=${nextUrl || ""}`,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        throw error;
      }

      if (data.url) {
        await Browser.open({ url: data.url });
      } else {
        setErrorMessage("Could not get Google sign in URL.");
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An unknown error occurred during sign in.");
      }
    } finally {
      setIsSigningIn(false);
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
      {errorMessage && <p className="text-danger text-sm">{errorMessage}</p>}
    </div>
  );
};

export default GoogleOAuthButton;
