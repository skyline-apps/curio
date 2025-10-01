import Button from "@app/components/ui/Button";
import { createLogger } from "@app/utils/logger";
import { isNativePlatform } from "@app/utils/platform";
import { getSupabaseClient } from "@app/utils/supabase";
import { Capacitor } from "@capacitor/core";
import {
  GoogleLoginResponseOnline,
  SocialLogin,
} from "@capgo/capacitor-social-login";
import { useState } from "react";
import { FaGoogle } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

const log = createLogger("GoogleSignIn");

interface GoogleOAuthButtonProps {
  nextUrl?: string;
}

function extractNonceFromIdToken(idToken: string): string | undefined {
  try {
    const payload = JSON.parse(atob(idToken.split(".")[1]));
    return payload.nonce;
  } catch {
    return undefined;
  }
}

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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
      // Native (iOS/Android): Use capacitor-social-login to get Google id_token, then exchange with Supabase
      if (isNative) {
        // Initialize plugin with platform-specific client IDs
        const platform = Capacitor.getPlatform();
        const webClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID;
        const iosClientId = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID;
        if (platform === "android") {
          if (!webClientId)
            throw new Error("Missing VITE_GOOGLE_WEB_CLIENT_ID");
          await SocialLogin.initialize({ google: { webClientId } });
        } else if (platform === "ios") {
          if (!iosClientId || !webClientId)
            throw new Error(
              "Missing VITE_GOOGLE_IOS_CLIENT_ID or VITE_GOOGLE_WEB_CLIENT_ID",
            );
          await SocialLogin.initialize({
            google: {
              iOSClientId: iosClientId,
              iOSServerClientId: webClientId,
              mode: "online",
            },
          });
        }
        // Trigger native Google login
        const { result } = await SocialLogin.login({
          provider: "google",
          options: {},
        });
        const idToken = (result as GoogleLoginResponseOnline)?.idToken;
        if (!idToken) {
          throw new Error("Google sign-in did not return an id_token");
        }
        const extractedNonce = extractNonceFromIdToken(idToken);
        const nonce = !!extractedNonce
          ? await sha256(extractedNonce)
          : undefined;

        const { error: supaError } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
          ...(nonce ? { nonce } : {}),
        });
        if (supaError) throw supaError;

        // Route through your existing callback path to preserve behavior
        navigate(`/auth/callback?next=${nextUrl || ""}`, { replace: true });
        return;
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
      {errorMessage && (
        <p className="text-danger text-xs wrap-normal">{errorMessage}</p>
      )}
    </div>
  );
};

export default GoogleOAuthButton;
