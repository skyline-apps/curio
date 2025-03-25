"use client";
import Button from "@web/components/ui/Button";
import Input from "@web/components/ui/Input";
import { createClient } from "@web/utils/supabase/client";
import { useState } from "react";

interface EmailSignInProps {}

const EmailSignIn: React.FC<EmailSignInProps> = ({}: EmailSignInProps) => {
  const supabase = createClient();
  const [email, setEmail] = useState<string>("");
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSignInWithEmail = async (): Promise<void> => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSigningIn(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
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
