import Button from "@app/components/ui/Button";
import { createLogger } from "@app/utils/logger";
import { isNativePlatform } from "@app/utils/platform";
import { getSupabaseClient } from "@app/utils/supabase";
import { Capacitor } from "@capacitor/core";
import { GoogleOneTapAuth } from "capacitor-native-google-one-tap-signin";
import { useState } from "react";
import { FaGoogle } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

const log = createLogger("GoogleSignIn");

interface GoogleOAuthButtonProps {
  nextUrl?: string;
}

const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  nextUrl,
}: GoogleOAuthButtonProps) => {
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const redirectTo = import.meta.env.VITE_CURIO_URL || location.origin;
  const navigate = useNavigate();

  const handleSignInWithGoogle = async (): Promise<void> => {
    setIsSigningIn(true);
    setErrorMessage(null);
    const supabase = getSupabaseClient();
    const isNative = isNativePlatform();

    try {
      // Native (iOS/Android): Use Google One Tap plugin, then exchange id_token with Supabase
      if (isNative) {
        const platform = Capacitor.getPlatform();
        const googleClientId =
          platform === "ios"
            ? import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID
            : import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID;
        if (!googleClientId) {
          throw new Error(
            "Missing VITE_GOOGLE_CLIENT_ID. Set your Google Web or iOS client ID in env.",
          );
        }

        // Initialize plugin (safe to call multiple times)
        void GoogleOneTapAuth.initialize({ clientId: googleClientId });

        // Try auto sign-in, then fall back to button-style flow
        let result = await GoogleOneTapAuth.tryAutoOrOneTapSignIn();
        if (result.isSuccess === false) {
          result =
            await GoogleOneTapAuth.signInWithGoogleButtonFlowForNativePlatform();
        }

        if (result.isSuccess) {
          const success = result.success;
          const idToken = success?.idToken;

          if (!idToken) {
            throw new Error("Google sign-in did not return an id_token");
          }

          const { error: supaError } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: idToken,
          });
          if (supaError) throw supaError;

          // Route through your existing callback path to preserve behavior
          navigate(`/auth/callback?next=${nextUrl || ""}`, { replace: true });
          return;
        }
        const errorCode = result.noSuccess?.noSuccessReasonCode;
        if (errorCode === "NO_CREDENTIAL") {
          throw new Error(
            "No Google account was found on this device. Please add a Google account or sign in a different way.",
          );
        }
        // If we reach here, native sign-in failed without success details
        throw new Error(
          `Native Google sign-in was not successful: ${result.noSuccess?.noSuccessReasonCode}`,
        );
      }

      // Web: keep existing Supabase-hosted redirect flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${redirectTo}/auth/callback?next=${nextUrl || ""}`,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.location.href = data.url;
      } else {
        setErrorMessage("Could not get Google sign in URL.");
      }
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
