import Button from "@app/components/ui/Button";
import Input from "@app/components/ui/Input";
import { getSupabaseClient } from "@app/utils/supabase";
import { useState } from "react";

type EmailSignInProps = {
  onDemoLogin?: (email: string) => void;
};

const EmailSignIn: React.FC<EmailSignInProps> = ({
  onDemoLogin,
}: EmailSignInProps) => {
  const [email, setEmail] = useState<string>("");
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const redirectTo = import.meta.env.VITE_CURIO_URL || location.origin;

  const handleSignInWithEmail = async (): Promise<void> => {
    if (
      import.meta.env.VITE_DEMO_ACCOUNT_EMAIL &&
      email === import.meta.env.VITE_DEMO_ACCOUNT_EMAIL &&
      onDemoLogin
    ) {
      onDemoLogin(email);
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSigningIn(true);
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${redirectTo}/auth/callback`,
      },
    });
    setIsSigningIn(false);
    setErrorMessage(null);
    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage("Check your email for a link to sign in.");
    }
  };

  return (
    <div
      id="email-signin-button"
      className="flex flex-col gap-2 items-center w-full"
    >
      <form
        className="flex gap-2 w-full"
        onSubmit={(e) => {
          e.preventDefault();
          handleSignInWithEmail();
        }}
      >
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          contrast
          className="grow"
        />
        <Button
          isDisabled={!email}
          isLoading={isSigningIn}
          color="primary"
          type="submit"
          size="sm"
          className="shrink-0"
        >
          Sign in
        </Button>
      </form>
      <p className="text-danger text-sm">{errorMessage}</p>
      <p className="text-success text-sm">{successMessage}</p>
    </div>
  );
};

export default EmailSignIn;
