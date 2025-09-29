import Button from "@app/components/ui/Button";
import { createLogger } from "@app/utils/logger";
import { isNativePlatform } from "@app/utils/platform";
import { getSupabaseClient } from "@app/utils/supabase";
import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { useState } from "react";
import { FaApple } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

const log = createLogger("AppleSignIn");

interface AppleOAuthButtonProps {
  nextUrl?: string;
}

const AppleOAuthButton: React.FC<AppleOAuthButtonProps> = ({
  nextUrl,
}: AppleOAuthButtonProps) => {
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignInWithApple = async (): Promise<void> => {
    setIsSigningIn(true);
    setErrorMessage(null);
    const supabase = getSupabaseClient();

    try {
      const isNative = isNativePlatform();
      const platform = Capacitor.getPlatform();

      if (!isNative || platform !== "ios") {
        setErrorMessage("Apple sign-in is only available on iOS.");
        return;
      }

      await SocialLogin.initialize({
        apple: {},
      });

      const { result } = await SocialLogin.login({
        provider: "apple",
        options: {},
      });

      const idToken = result?.idToken;
      if (!idToken) {
        throw new Error("Apple sign-in did not return an id_token");
      }

      const { error: supaError } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: idToken,
      });
      if (supaError) throw supaError;

      navigate(`/auth/callback?next=${nextUrl || ""}`, { replace: true });
    } catch (error) {
      if (error instanceof Error) {
        log.error(error.message);
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An unknown error occurred during sign in.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return isNativePlatform() && Capacitor.getPlatform() === "ios" ? (
    <div
      id="apple-signin-button"
      className="flex flex-col gap-2 items-center w-full"
    >
      <Button
        isLoading={isSigningIn}
        onPress={handleSignInWithApple}
        fullWidth
        color="primary"
        size="sm"
      >
        <FaApple className="mr-2" /> Sign in with Apple
      </Button>
      {errorMessage && (
        <p className="text-danger text-xs wrap-normal">{errorMessage}</p>
      )}
    </div>
  ) : null;
};

export default AppleOAuthButton;
